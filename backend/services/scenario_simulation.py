"""
scenario_simulation.py
======================
Transparent, deterministic mathematical and rule-based What-If Scenario
Simulation Engine for the Antarctic Indian Polar Digital Twin (AIP-DT).

Core Principles:
----------------
1. No black-box machine learning: Uses explicit, defensible mathematical
   physics-based formulas and operational assumptions.
2. Combines current live station telemetry, existing predictive forecast trends,
   and multi-sensor anomaly states.
3. Every assumption and formula is exposed transparently in the API response.
4. Guaranteed numerical safety: All outputs are converted to standard Python
   types. No numpy types, NaNs, or Infinities are ever returned.
5. Maitri and Bharati stations remain completely independent.
"""

from __future__ import annotations

import math
from typing import Any, Optional


# ---------------------------------------------------------------------------
# Simulation Constants & Operational Coefficients
# ---------------------------------------------------------------------------

# Every 1°C colder than baseline increases heating power demand by 2.0%
COLD_WEATHER_POWER_FACTOR: float = 0.02

# Fallback generator capacities if telemetry does not provide generatorLoad
FALLBACK_GENERATOR_CAPACITIES: dict[str, float] = {
    "maitri": 75.0,    # kW nominal capacity
    "bharati": 150.0,  # kW nominal capacity
}

# Conservative default rates per hour when forecasting service is in LEARNING mode
FALLBACK_BATTERY_RATE_PER_HOUR: float = -0.10   # -0.1% per hour discharge
FALLBACK_FUEL_RATE_PER_HOUR: float = -0.05      # -0.05% per hour consumption (~1.2% per day)

# Meaningful drain threshold for fuel autonomy calculation
FUEL_AUTONOMY_THRESHOLD: float = -0.01


def _to_safe_float(value: Any, fallback: float = 0.0) -> float:
    """Convert any numeric value to a standard finite Python float."""
    if value is None:
        return fallback
    try:
        val = float(value)
        if math.isnan(val) or math.isinf(val):
            return fallback
        return val
    except (ValueError, TypeError):
        return fallback


def simulate_station_scenario(
    station_id: str,
    current_telemetry: dict[str, Any],
    forecast_data: Optional[dict[str, Any]],
    anomaly_data: Optional[dict[str, Any]],
    scenario: dict[str, Any],
) -> dict[str, Any]:
    """
    Execute a transparent what-if operational scenario simulation for a polar station.

    Args:
        station_id: 'maitri' or 'bharati'
        current_telemetry: live station snapshot dict from STATIONS_STORE
        forecast_data: output from forecast_station() (or None)
        anomaly_data: output from run_anomaly_detection() (or None)
        scenario: dict containing simulation parameters:
            - temperatureDelta: float (°C, -50 to +50)
            - powerDemandChange: float (%, -100 to +200)
            - generatorCapacityChange: float (%, -100 to +100)
            - fuelConsumptionChange: float (%, -100 to +200)
            - durationHours: float (hours, 1 to 168)

    Returns:
        Structured simulation response dict with baseline, simulated metrics,
        impact deltas, generator stress, risk assessment, recommendations,
        and explicit operational assumptions.
    """
    station_key = str(station_id).lower().strip()
    assumptions_logged: list[str] = []

    # -----------------------------------------------------------------------
    # 1. Parse Scenario Parameters with Safe Bounds
    # -----------------------------------------------------------------------
    temp_delta = _to_safe_float(scenario.get("temperatureDelta"), 0.0)
    power_demand_change = _to_safe_float(scenario.get("powerDemandChange"), 0.0)
    gen_capacity_change = _to_safe_float(scenario.get("generatorCapacityChange"), 0.0)
    fuel_consumption_change = _to_safe_float(scenario.get("fuelConsumptionChange"), 0.0)
    duration_hours = max(1.0, min(168.0, _to_safe_float(scenario.get("durationHours"), 24.0)))

    # -----------------------------------------------------------------------
    # 2. Extract Baseline Metrics
    # -----------------------------------------------------------------------
    base_temp = _to_safe_float(current_telemetry.get("temperature"), -30.0)
    base_power = max(0.0, _to_safe_float(current_telemetry.get("powerConsumption"), 50.0))
    base_battery = max(0.0, min(100.0, _to_safe_float(current_telemetry.get("battery"), 75.0)))
    base_fuel = max(0.0, min(100.0, _to_safe_float(current_telemetry.get("fuel"), 60.0)))
    gen_load_percent = _to_safe_float(current_telemetry.get("generatorLoad"), 75.0)

    # -----------------------------------------------------------------------
    # 3. Temperature Simulation
    # -----------------------------------------------------------------------
    simulated_temp = round(base_temp + temp_delta, 2)

    # -----------------------------------------------------------------------
    # 4. Power Demand Simulation
    # -----------------------------------------------------------------------
    # Cold weather heating demand rule: Only cooling below baseline adds load
    if temp_delta < 0:
        cold_weather_impact_percent = round(abs(temp_delta) * (COLD_WEATHER_POWER_FACTOR * 100.0), 2)
        assumptions_logged.append(
            f"Thermal heating factor: {abs(temp_delta):.1f}°C drop increased power demand by {cold_weather_impact_percent:.1f}% (+2% per °C)."
        )
    else:
        cold_weather_impact_percent = 0.0
        if temp_delta > 0:
            assumptions_logged.append(
                f"Thermal warming of +{temp_delta:.1f}°C does not create negative heating demand."
            )

    total_power_change_percent = power_demand_change + cold_weather_impact_percent
    simulated_power = round(max(0.0, base_power * (1.0 + total_power_change_percent / 100.0)), 2)

    # -----------------------------------------------------------------------
    # 5. Generator Capacity & Stress Simulation
    # -----------------------------------------------------------------------
    # Compute baseline generator capacity from telemetry if available
    if gen_load_percent > 10.0 and base_power > 0:
        baseline_gen_capacity = round(base_power / (gen_load_percent / 100.0), 2)
        assumptions_logged.append(
            f"Baseline generator capacity derived from live load telemetry ({gen_load_percent:.0f}% at {base_power:.1f} kW = {baseline_gen_capacity:.1f} kW capacity)."
        )
    else:
        baseline_gen_capacity = FALLBACK_GENERATOR_CAPACITIES.get(station_key, 100.0)
        assumptions_logged.append(
            f"Baseline generator capacity used station nominal fallback of {baseline_gen_capacity:.1f} kW."
        )

    # Apply generator capacity change
    available_capacity = max(0.0, baseline_gen_capacity * (1.0 + gen_capacity_change / 100.0))

    if available_capacity <= 0.0:
        if simulated_power > 0.0:
            stress_ratio = 99.9
            stress_level = "CRITICAL"
        else:
            stress_ratio = 0.0
            stress_level = "NORMAL"
        assumptions_logged.append("Generator available capacity is 0 kW under simulated scenario.")
    else:
        stress_ratio = round(simulated_power / available_capacity, 3)
        if stress_ratio < 0.70:
            stress_level = "NORMAL"
        elif stress_ratio < 0.85:
            stress_level = "ELEVATED"
        elif stress_ratio <= 1.0:
            stress_level = "HIGH"
        else:
            stress_level = "CRITICAL"

    # -----------------------------------------------------------------------
    # 6. Battery Simulation
    # -----------------------------------------------------------------------
    forecast_active = bool(forecast_data and forecast_data.get("status") == "ACTIVE")
    forecast_battery_rate: Optional[float] = None

    if forecast_active:
        rate = forecast_data.get("battery", {}).get("ratePerHour")
        if rate is not None:
            forecast_battery_rate = _to_safe_float(rate)

    if forecast_battery_rate is not None:
        base_battery_rate = forecast_battery_rate
        assumptions_logged.append(
            f"Battery baseline rate extrapolated from active forecasting engine ({base_battery_rate:+.3f}%/h)."
        )
    else:
        base_battery_rate = FALLBACK_BATTERY_RATE_PER_HOUR
        assumptions_logged.append(
            f"Battery rate using conservative fallback ({base_battery_rate:+.3f}%/h) as forecasting engine is learning."
        )

    # Power demand multiplier on battery drain
    power_ratio = (simulated_power / base_power) if base_power > 0 else 1.0

    # Additional stress drain if generator is overloaded
    if stress_level == "CRITICAL":
        deficit_ratio = max(0.0, stress_ratio - 1.0)
        overload_drain = 0.40 + (deficit_ratio * 0.50)  # auxiliary shedding plus deficit bridge draw
    elif stress_level == "HIGH":
        overload_drain = 0.15
    else:
        overload_drain = 0.0

    if base_battery_rate < 0:
        simulated_battery_rate = (base_battery_rate * max(1.0, power_ratio)) - overload_drain
    else:
        # If batteries were charging/stable, high power stress cancels charging or causes drain
        if power_ratio > 1.2 or stress_level in ("HIGH", "CRITICAL"):
            simulated_battery_rate = -0.15 * power_ratio - overload_drain
        else:
            simulated_battery_rate = base_battery_rate

    simulated_battery_rate = round(simulated_battery_rate, 4)
    simulated_battery = round(max(0.0, min(100.0, base_battery + (simulated_battery_rate * duration_hours))), 2)

    # -----------------------------------------------------------------------
    # 7. Fuel Simulation & Autonomy
    # -----------------------------------------------------------------------
    forecast_fuel_rate: Optional[float] = None
    if forecast_active:
        rate = forecast_data.get("fuel", {}).get("ratePerHour")
        if rate is not None:
            forecast_fuel_rate = _to_safe_float(rate)

    if forecast_fuel_rate is not None:
        base_fuel_rate = forecast_fuel_rate
        assumptions_logged.append(
            f"Fuel baseline rate extrapolated from active forecasting engine ({base_fuel_rate:+.3f}%/h)."
        )
    else:
        base_fuel_rate = FALLBACK_FUEL_RATE_PER_HOUR
        assumptions_logged.append(
            f"Fuel rate using conservative operational baseline ({base_fuel_rate:+.3f}%/h)."
        )

    # Fuel consumption factors:
    # 1. Power demand scaling (generators burn fuel proportional to load)
    # 2. Operator fuelConsumptionChange scenario input
    # 3. Efficiency penalty under generator overload stress
    fuel_load_multiplier = max(0.1, power_ratio)
    fuel_user_multiplier = max(0.0, 1.0 + fuel_consumption_change / 100.0)
    stress_fuel_penalty = 1.15 if stress_level == "CRITICAL" else (1.05 if stress_level == "HIGH" else 1.0)

    # Ensure fuel rate is negative when fuel is burning
    raw_fuel_rate = base_fuel_rate if base_fuel_rate < 0 else -0.04
    simulated_fuel_rate = round(raw_fuel_rate * fuel_load_multiplier * fuel_user_multiplier * stress_fuel_penalty, 4)

    simulated_fuel = round(max(0.0, min(100.0, base_fuel + (simulated_fuel_rate * duration_hours))), 2)

    # Fuel autonomy (hours)
    if simulated_fuel_rate < FUEL_AUTONOMY_THRESHOLD and simulated_fuel > 0:
        fuel_autonomy_hours: Optional[float] = round(simulated_fuel / abs(simulated_fuel_rate), 1)
    else:
        fuel_autonomy_hours = None

    # -----------------------------------------------------------------------
    # 8. Scenario Risk Assessment (0 - 100 Scale)
    # -----------------------------------------------------------------------
    risk_score: float = 0.0
    risk_factors: list[str] = []

    # A. Battery Criticality (max 30 points)
    if simulated_battery < 15.0:
        risk_score += 30.0
        risk_factors.append(f"Simulated battery severely depleted ({simulated_battery:.1f}% < 15% emergency floor).")
    elif simulated_battery < 30.0:
        risk_score += 20.0
        risk_factors.append(f"Simulated battery critical reserve ({simulated_battery:.1f}% < 30%).")
    elif simulated_battery < 50.0:
        risk_score += 10.0
        risk_factors.append(f"Simulated battery reserve reduced ({simulated_battery:.1f}% < 50%).")
    elif simulated_battery_rate < -1.0:
        risk_score += 5.0
        risk_factors.append(f"Rapid battery discharge rate ({simulated_battery_rate:.2f}%/h).")

    # B. Fuel Criticality (max 25 points)
    if simulated_fuel < 15.0:
        risk_score += 25.0
        risk_factors.append(f"Simulated fuel storage critically depleted ({simulated_fuel:.1f}% < 15%).")
    elif simulated_fuel < 30.0:
        risk_score += 15.0
        risk_factors.append(f"Simulated fuel reserve low ({simulated_fuel:.1f}% < 30%).")
    elif fuel_autonomy_hours is not None and fuel_autonomy_hours < 48.0:
        risk_score += 12.0
        risk_factors.append(f"Fuel autonomy reduced below 48 hours ({fuel_autonomy_hours:.0f}h remaining).")
    elif simulated_fuel < 50.0:
        risk_score += 5.0
        risk_factors.append(f"Fuel storage below half capacity ({simulated_fuel:.1f}%).")

    # C. Generator Stress (max 25 points)
    if stress_level == "CRITICAL":
        risk_score += 25.0
        risk_factors.append(f"Generator microgrid over-capacity (Stress ratio {stress_ratio:.2f} > 1.00).")
    elif stress_level == "HIGH":
        risk_score += 16.0
        risk_factors.append(f"High generator operating stress (Stress ratio {stress_ratio:.2f} in 85-100% band).")
    elif stress_level == "ELEVATED":
        risk_score += 8.0
        risk_factors.append(f"Elevated generator load demand (Stress ratio {stress_ratio:.2f}).")

    # D. Extreme Temperature (max 10 points)
    if simulated_temp < -42.0:
        risk_score += 10.0
        risk_factors.append(f"Extreme deep-freeze polar environment ({simulated_temp:.1f}°C < -42°C).")
    elif simulated_temp < -32.0:
        risk_score += 5.0
        risk_factors.append(f"Sub-zero polar thermal stress ({simulated_temp:.1f}°C).")
    elif abs(temp_delta) >= 15.0:
        risk_score += 3.0
        risk_factors.append(f"Large environmental thermal delta (Δ {temp_delta:+.1f}°C).")

    # E. Baseline Anomaly Condition (max 10 points)
    if anomaly_data and anomaly_data.get("isAnomaly"):
        severity = str(anomaly_data.get("severity", "WARNING")).upper()
        if severity == "CRITICAL":
            risk_score += 10.0
            risk_factors.append("Active critical multi-sensor anomaly detected on station baseline.")
        else:
            risk_score += 5.0
            risk_factors.append("Active multi-sensor anomaly warning on station baseline.")

    clamped_risk_score = round(max(0.0, min(100.0, risk_score)), 1)

    if clamped_risk_score >= 80.0:
        severity_label = "CRITICAL"
    elif clamped_risk_score >= 60.0:
        severity_label = "HIGH"
    elif clamped_risk_score >= 30.0:
        severity_label = "MEDIUM"
    else:
        severity_label = "LOW"

    if not risk_factors:
        risk_factors.append("All operational parameters remain within nominal envelopes.")

    # -----------------------------------------------------------------------
    # 9. Operational Recommendations
    # -----------------------------------------------------------------------
    recommendations: list[str] = []

    if stress_level in ("HIGH", "CRITICAL"):
        recommendations.append("Execute non-critical load shedding and balance microgrid distribution.")

    if simulated_battery < 30.0:
        recommendations.append("Prioritize battery conservation, disconnect non-essential loads, and verify auxiliary input.")

    if simulated_fuel < 30.0 or (fuel_autonomy_hours is not None and fuel_autonomy_hours < 72.0):
        recommendations.append("Prepare emergency fuel resupply logistics and optimize generator dispatch schedule.")

    if simulated_temp < -32.0:
        recommendations.append("Increase environmental thermal monitoring, inspect fuel trace heating, and verify habitat insulation.")

    if anomaly_data and anomaly_data.get("isAnomaly"):
        recommendations.append("Investigate active baseline telemetry anomalies prior to executing scenario actions.")

    if not recommendations:
        recommendations.append("Maintain standard polar operational surveillance. All simulated metrics are nominal.")

    # -----------------------------------------------------------------------
    # 10. Impact Deltas
    # -----------------------------------------------------------------------
    battery_change = round(simulated_battery - base_battery, 2)
    fuel_change = round(simulated_fuel - base_fuel, 2)
    power_change = round(simulated_power - base_power, 2)

    return {
        "station": station_key,
        "status": "SUCCESS",
        "scenario": {
            "temperatureDelta": temp_delta,
            "powerDemandChange": power_demand_change,
            "generatorCapacityChange": gen_capacity_change,
            "fuelConsumptionChange": fuel_consumption_change,
            "durationHours": duration_hours,
        },
        "baseline": {
            "temperature": round(base_temp, 2),
            "powerConsumption": round(base_power, 2),
            "battery": round(base_battery, 2),
            "fuel": round(base_fuel, 2),
            "generatorLoad": round(gen_load_percent, 1),
        },
        "simulated": {
            "temperature": simulated_temp,
            "powerConsumption": simulated_power,
            "battery": simulated_battery,
            "fuel": simulated_fuel,
            "fuelAutonomyHours": fuel_autonomy_hours,
        },
        "impact": {
            "batteryChange": battery_change,
            "fuelChange": fuel_change,
            "powerChange": power_change,
        },
        "generator": {
            "capacityChange": gen_capacity_change,
            "baselineCapacity": baseline_gen_capacity,
            "availableCapacity": round(available_capacity, 2),
            "stressRatio": stress_ratio,
            "stressLevel": stress_level,
        },
        "risk": {
            "score": clamped_risk_score,
            "severity": severity_label,
            "factors": risk_factors,
        },
        "recommendations": recommendations,
        "assumptions": assumptions_logged,
    }

