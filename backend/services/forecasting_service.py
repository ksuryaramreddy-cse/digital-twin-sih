"""
forecasting_service.py
======================
Predictive forecasting engine for AIP-DT stations.

Pipeline per station:
---------------------
  Rolling TELEMETRY_HISTORY (deque)
       ↓
  Valid sample extraction & timestamp conversion (elapsed hours relative to latest)
       ↓
  Check sample count against MIN_FORECAST_SAMPLES (20)
       ↓
  If < 20: return LEARNING mode
       ↓
  If >= 20: return ACTIVE mode
       ├── battery:          Linear Regression (t -> battery)
       ├── fuel:             Linear Regression (t -> fuel) + estimatedAutonomyHours
       ├── powerConsumption: Linear Regression (t -> powerConsumption)
       └── temperature:      Simple Exponential Smoothing (SES) with fallback

Design principles:
------------------
* Stations are ALWAYS analysed independently - Maitri and Bharati never share history.
* Mathematical regression on actual timestamp elapsed hours ensures ratePerHour is real.
* Fuel autonomy calculated ONLY when fuel trend is meaningfully decreasing (rate < -threshold).
* No fake AI or black-box ML; mathematically defensible statistical models.
* Guaranteed JSON serialization: no Python NaN, Infinity, or NumPy types in response.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Optional

import numpy as np

# ---------------------------------------------------------------------------
# Configuration Constants
# ---------------------------------------------------------------------------

MIN_FORECAST_SAMPLES: int = 20
MAX_RECENT_SAMPLES: int = 30
FORECAST_HORIZON_HOURS: float = 24.0
MIN_TIME_SPAN_HOURS: float = 0.01  # Approximately 36 seconds

# Trend classification thresholds (units per hour)
# If |rate| <= threshold, trend is classified as STABLE.
BATTERY_TREND_THRESHOLD: float = 0.05       # % per hour
FUEL_TREND_THRESHOLD: float = 0.02          # % per hour
POWER_TREND_THRESHOLD: float = 0.10         # kW per hour
TEMP_TREND_THRESHOLD: float = 0.08          # °C per hour

# Meaningful drain threshold for fuel autonomy calculation
FUEL_AUTONOMY_DRAIN_THRESHOLD: float = -0.01  # % per hour


# ---------------------------------------------------------------------------
# Helper: Timestamp & Series Extraction
# ---------------------------------------------------------------------------

def _parse_iso_timestamp(ts_str: Any) -> Optional[float]:
    """Parse an ISO timestamp string into POSIX epoch seconds."""
    if not isinstance(ts_str, str) or not ts_str.strip():
        return None
    try:
        clean_str = ts_str.strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(clean_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.timestamp()
    except Exception:
        pass

    for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(ts_str.strip(), fmt).replace(tzinfo=timezone.utc)
            return dt.timestamp()
        except Exception:
            continue

    return None


def _extract_metric_series(
    history: list[dict],
    metric: str
) -> tuple[np.ndarray, np.ndarray]:
    """
    Extract deduplicated (elapsed_hours, values) arrays for a given metric.

    When multiple snapshots share the same timestamp, the latest snapshot value wins.
    Elapsed hours are computed relative to the earliest valid timestamp (t_0 = 0.0).

    Returns
    -------
    times_hours : np.ndarray (1D float64)
    values      : np.ndarray (1D float64)
    """
    ts_to_val: dict[float, float] = {}

    for snap in history:
        if not isinstance(snap, dict):
            continue
        ts_val = _parse_iso_timestamp(snap.get("timestamp"))
        if ts_val is None:
            continue

        raw_val = snap.get(metric)
        if raw_val is None or not isinstance(raw_val, (int, float)):
            continue

        float_val = float(raw_val)
        if math.isnan(float_val) or math.isinf(float_val):
            continue

        # Latest value for duplicate timestamp wins
        ts_to_val[ts_val] = float_val

    if not ts_to_val:
        return np.empty(0, dtype=np.float64), np.empty(0, dtype=np.float64)

    # Sort chronologically by timestamp
    sorted_points = sorted(ts_to_val.items(), key=lambda p: p[0])

    first_ts = sorted_points[0][0]
    times = np.array([(p[0] - first_ts) / 3600.0 for p in sorted_points], dtype=np.float64)
    values = np.array([p[1] for p in sorted_points], dtype=np.float64)

    return times, values


# ---------------------------------------------------------------------------
# Helper: Linear Regression Trend & Forecast
# ---------------------------------------------------------------------------

def _classify_trend(rate: float, threshold: float) -> str:
    """Classify trend direction based on rate of change and threshold."""
    if rate > threshold:
        return "INCREASING"
    if rate < -threshold:
        return "DECREASING"
    return "STABLE"


def _classify_confidence(r_squared: float) -> str:
    """
    Classify linear regression reliability based on R²:
      R² >= 0.80 -> HIGH
      R² >= 0.50 -> MEDIUM
      R² <  0.50 -> LOW
    """
    if r_squared >= 0.80:
        return "HIGH"
    if r_squared >= 0.50:
        return "MEDIUM"
    return "LOW"


def _linear_trend_forecast(
    times: np.ndarray,
    values: np.ndarray,
    threshold: float,
    horizon_hours: float = FORECAST_HORIZON_HOURS,
    min_bound: Optional[float] = None,
    max_bound: Optional[float] = None,
) -> dict[str, Any]:
    """
    Compute linear regression forecast over elapsed hour timestamps with safety bounds.

    Returns
    -------
    dict with:
      current     : float (most recent observed value)
      trend       : str ("INCREASING", "DECREASING", "STABLE")
      forecast    : float (extrapolated value at latest_elapsed + horizon_hours, clamped safely)
      ratePerHour : float (slope m in units/hour)
      rSquared    : float (coefficient of determination in [0.0, 1.0])
      confidence  : str ("HIGH", "MEDIUM", "LOW")
    """
    n = len(values)
    current_val = float(values[-1]) if n > 0 else 0.0

    # Guard against insufficient points or zero time span
    if n < 2 or (times[-1] - times[0]) < 1e-6:
        clamped_current = current_val
        if min_bound is not None:
            clamped_current = max(min_bound, clamped_current)
        if max_bound is not None:
            clamped_current = min(max_bound, clamped_current)
        return {
            "current": round(current_val, 1),
            "trend": "STABLE",
            "forecast": round(clamped_current, 1),
            "ratePerHour": 0.0,
            "rSquared": 1.0,
            "confidence": "HIGH",
        }

    try:
        # Fit y = m * t + c where t is elapsed hours from earliest sample
        poly = np.polyfit(times, values, 1)
        m = float(poly[0])
        c = float(poly[1])

        if math.isnan(m) or math.isinf(m) or math.isnan(c) or math.isinf(c):
            raise ValueError("Regression yielded NaN or Inf")

        rate_per_hour = round(m, 2)
        latest_elapsed_hours = float(times[-1])
        forecast_time = latest_elapsed_hours + horizon_hours
        raw_forecast = c + m * forecast_time

        # Apply physical safety bounds
        forecast_val = raw_forecast
        if min_bound is not None:
            forecast_val = max(min_bound, forecast_val)
        if max_bound is not None:
            forecast_val = min(max_bound, forecast_val)
        forecast_val = round(forecast_val, 1)

        # Compute R² (coefficient of determination)
        y_pred = m * times + c
        ss_res = float(np.sum((values - y_pred) ** 2))
        y_mean = float(np.mean(values))
        ss_tot = float(np.sum((values - y_mean) ** 2))

        if ss_tot < 1e-12:
            r_squared = 1.0
        else:
            r_squared = 1.0 - (ss_res / ss_tot)

        r_squared = float(np.clip(r_squared, 0.0, 1.0))
        r_squared = round(r_squared, 2)
        confidence = _classify_confidence(r_squared)

        trend = _classify_trend(rate_per_hour, threshold)

        return {
            "current": round(current_val, 1),
            "trend": trend,
            "forecast": forecast_val,
            "ratePerHour": rate_per_hour,
            "rSquared": r_squared,
            "confidence": confidence,
        }
    except Exception:
        clamped_current = current_val
        if min_bound is not None:
            clamped_current = max(min_bound, clamped_current)
        if max_bound is not None:
            clamped_current = min(max_bound, clamped_current)
        return {
            "current": round(current_val, 1),
            "trend": "STABLE",
            "forecast": round(clamped_current, 1),
            "ratePerHour": 0.0,
            "rSquared": 0.0,
            "confidence": "LOW",
        }


# ---------------------------------------------------------------------------
# Helper: Fuel Autonomy Calculation
# ---------------------------------------------------------------------------

def _calculate_fuel_autonomy(
    current_fuel: float,
    rate_per_hour: float,
) -> Optional[float]:
    """
    Calculate estimated autonomy hours when fuel trend is meaningfully decreasing.

    Formula: estimatedAutonomyHours = currentFuel / |ratePerHour|

    Constraints:
      * Only calculated when ratePerHour < FUEL_AUTONOMY_DRAIN_THRESHOLD (-0.01 %/h).
      * If stable or increasing, returns None (serializes to null in JSON).
      * Never divide by zero.
      * Never returns negative or infinite autonomy.
    """
    if rate_per_hour >= FUEL_AUTONOMY_DRAIN_THRESHOLD:
        return None

    abs_rate = abs(rate_per_hour)
    if abs_rate < 1e-6:
        return None

    if current_fuel <= 0.0:
        return 0.0

    autonomy = current_fuel / abs_rate
    if math.isnan(autonomy) or math.isinf(autonomy):
        return None

    if autonomy < 0.1:
        val = round(float(autonomy), 3)
        if val == 0.0:
            val = round(float(autonomy), 4)
        return val
    elif autonomy < 1.0:
        return round(float(autonomy), 2)
    else:
        rounded = round(float(autonomy), 1)
        return int(rounded) if rounded.is_integer() else rounded


# ---------------------------------------------------------------------------
# Helper: Simple Exponential Smoothing (SES)
# ---------------------------------------------------------------------------

def _simple_exponential_smoothing(
    values: np.ndarray,
    times: np.ndarray,
    threshold: float = TEMP_TREND_THRESHOLD,
) -> dict[str, Any]:
    """
    Forecast near-term temperature using Simple Exponential Smoothing (SES).

    Level equation:
      s_0 = y_0
      s_t = alpha * y_t + (1 - alpha) * s_{t-1}

    Alpha optimization:
      Searches grid alpha in [0.05, 0.95] to minimize sum of squared 1-step errors.

    Fallback:
      If SES calculation fails or is degenerate, uses the most recent valid value
      and sets method to 'fallback_latest'.
    """
    n = len(values)
    current_val = float(values[-1]) if n > 0 else 0.0

    if n == 0:
        return {
            "current": 0.0,
            "trend": "STABLE",
            "forecast": 0.0,
            "method": "fallback_latest",
        }

    if n < 2:
        return {
            "current": round(current_val, 1),
            "trend": "STABLE",
            "forecast": round(current_val, 1),
            "method": "fallback_latest",
        }

    try:
        # Search optimal alpha in [0.05, 0.95]
        best_alpha = 0.3
        min_sse = float("inf")

        alphas = np.linspace(0.05, 0.95, 19)
        for alpha in alphas:
            s = values[0]
            sse = 0.0
            for i in range(1, n):
                err = values[i] - s
                sse += err * err
                s = alpha * values[i] + (1.0 - alpha) * s
            if sse < min_sse:
                min_sse = sse
                best_alpha = float(alpha)

        # Run smoothing with best alpha
        s = values[0]
        for i in range(1, n):
            s = best_alpha * values[i] + (1.0 - best_alpha) * s

        smoothed_forecast = float(s)
        if math.isnan(smoothed_forecast) or math.isinf(smoothed_forecast):
            raise ValueError("SES produced NaN or Inf")

        # Trend estimation: use linear slope over history to classify trend
        temp_rate = 0.0
        if times[-1] - times[0] >= 1e-6:
            poly = np.polyfit(times, values, 1)
            temp_rate = float(poly[0])

        trend = _classify_trend(temp_rate, threshold)

        return {
            "current": round(current_val, 1),
            "trend": trend,
            "forecast": round(smoothed_forecast, 1),
            "method": "simple_exponential_smoothing",
        }
    except Exception:
        return {
            "current": round(current_val, 1),
            "trend": "STABLE",
            "forecast": round(current_val, 1),
            "method": "fallback_latest",
        }


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def forecast_station(
    station_id: str,
    history: list[dict],
) -> dict[str, Any]:
    """
    Run predictive operational forecasting for a single station.

    Parameters
    ----------
    station_id : str
        The station identifier, e.g. "maitri" or "bharati".
    history : list[dict]
        Chronological telemetry snapshots from TELEMETRY_HISTORY[station_id].

    Returns
    -------
    dict
        LEARNING status if valid unique-timestamp samples < MIN_FORECAST_SAMPLES (20)
        or if real time span < MIN_TIME_SPAN_HOURS (0.01h ~ 36s),
        or ACTIVE status with defensible forecast metrics for:
        battery, fuel (with autonomy), powerConsumption, temperature.
    """
    required_metrics = ["battery", "fuel", "powerConsumption", "temperature"]

    # 1. Deduplicate valid snapshots by timestamp (latest snapshot per timestamp wins)
    ts_to_snap: dict[float, dict] = {}
    for snap in history:
        if not isinstance(snap, dict):
            continue
        ts = _parse_iso_timestamp(snap.get("timestamp"))
        if ts is None:
            continue
        valid_all = True
        for m in required_metrics:
            val = snap.get(m)
            if val is None or not isinstance(val, (int, float)) or math.isnan(val) or math.isinf(val):
                valid_all = False
                break
        if valid_all:
            ts_to_snap[ts] = snap

    sorted_timestamps = sorted(ts_to_snap.keys())
    unique_samples_count = len(sorted_timestamps)

    # 2. Check sample count threshold
    if unique_samples_count < MIN_FORECAST_SAMPLES:
        return {
            "station": station_id,
            "status": "LEARNING",
            "samplesUsed": int(unique_samples_count),
            "minimumSamplesRequired": int(MIN_FORECAST_SAMPLES),
            "message": "Collecting telemetry for reliable trend analysis",
        }

    # 3. Select recent operational window
    recent_ts = sorted_timestamps[-MAX_RECENT_SAMPLES:]
    analysis_snapshots = [ts_to_snap[t] for t in recent_ts]

    # 4. Check real elapsed time span across the analysis window
    first_ts = recent_ts[0]
    latest_ts = recent_ts[-1]
    time_span_hours = (latest_ts - first_ts) / 3600.0

    if time_span_hours < MIN_TIME_SPAN_HOURS:
        return {
            "station": station_id,
            "status": "LEARNING",
            "samplesUsed": int(len(analysis_snapshots)),
            "minimumSamplesRequired": int(MIN_FORECAST_SAMPLES),
            "timeSpanHours": round(float(time_span_hours), 4),
            "minimumTimeSpanHours": float(MIN_TIME_SPAN_HOURS),
            "message": "Collecting telemetry across a sufficient time span for reliable trend analysis",
        }

    # 5. Extract metric series from recent window
    t_batt, v_batt = _extract_metric_series(analysis_snapshots, "battery")
    t_fuel, v_fuel = _extract_metric_series(analysis_snapshots, "fuel")
    t_power, v_power = _extract_metric_series(analysis_snapshots, "powerConsumption")
    t_temp, v_temp = _extract_metric_series(analysis_snapshots, "temperature")

    # 6. Compute forecasts with physical safety bounds
    battery_forecast = _linear_trend_forecast(
        t_batt, v_batt, BATTERY_TREND_THRESHOLD, min_bound=0.0, max_bound=100.0
    )
    fuel_forecast = _linear_trend_forecast(
        t_fuel, v_fuel, FUEL_TREND_THRESHOLD, min_bound=0.0, max_bound=100.0
    )
    power_forecast = _linear_trend_forecast(
        t_power, v_power, POWER_TREND_THRESHOLD, min_bound=0.0, max_bound=None
    )
    temp_forecast = _simple_exponential_smoothing(v_temp, t_temp, TEMP_TREND_THRESHOLD)

    # 7. Compute fuel autonomy
    autonomy_hours = _calculate_fuel_autonomy(
        current_fuel=fuel_forecast["current"],
        rate_per_hour=fuel_forecast["ratePerHour"],
    )
    fuel_forecast["estimatedAutonomyHours"] = autonomy_hours

    # 8. Construct ACTIVE response
    return {
        "station": station_id,
        "status": "ACTIVE",
        "samplesUsed": int(len(analysis_snapshots)),
        "forecastHorizonHours": int(FORECAST_HORIZON_HOURS),
        "battery": battery_forecast,
        "fuel": fuel_forecast,
        "powerConsumption": power_forecast,
        "temperature": temp_forecast,
        "message": "Forecasts are estimates based on recent observed telemetry trends.",
    }


