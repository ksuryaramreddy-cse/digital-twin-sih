"""
test_phase4a.py
===============
Phase 4A.1 - Comprehensive Forecast Reliability & Time-Axis Verification Suite.

Tests:
  TEST 1  - PERFECT LINEAR DATA (ratePerHour = -1.0 %/h, exact 24h mathematical forecast)
  TEST 2  - DUPLICATE TIMESTAMPS (deduplication, latest value wins, no artificial time)
  TEST 3  - INSUFFICIENT TIME SPAN (30 samples within 5s -> LEARNING status)
  TEST 4  - BATTERY BOUNDS (clamped safely within 0 <= forecast <= 100)
  TEST 5  - FUEL BOUNDS (clamped safely within 0 <= forecast <= 100)
  TEST 6  - POWER BOUNDS (clamped safely within forecast >= 0)
  TEST 7  - R² VALIDATION & CONFIDENCE (HIGH >= 0.80, MEDIUM >= 0.50, LOW < 0.50)
  TEST 8  - FUEL AUTONOMY (real rate, autonomy = current / |rate|, null for stable/increasing)
  TEST 9  - STATION INDEPENDENCE (separate controlled histories, zero cross-talk)
  TEST 10 - EXISTING APIs (GET stations, history, anomaly, POST telemetry)
  TEST 11 - BAD DATA HANDLING (missing keys, NaN, Infinity, invalid timestamps)
"""

import json
import math
import sys
from datetime import datetime, timezone, timedelta
import numpy as np
import requests

from services.forecasting_service import (
    _parse_iso_timestamp,
    _extract_metric_series,
    _linear_trend_forecast,
    _calculate_fuel_autonomy,
    _simple_exponential_smoothing,
    _classify_confidence,
    forecast_station,
    MIN_FORECAST_SAMPLES,
    MIN_TIME_SPAN_HOURS,
    FORECAST_HORIZON_HOURS,
)

BASE_URL = "http://127.0.0.1:8000"


def run_unit_tests():
    print("\n" + "=" * 65)
    print("RUNNING PHASE 4A.1 UNIT & MATHEMATICAL VERIFICATION")
    print("=" * 65)

    # -------------------------------------------------------------
    # TEST 1 - PERFECT LINEAR DATA
    # -------------------------------------------------------------
    print("\n--> TEST 1: PERFECT LINEAR DATA")
    base_t = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    linear_history = [
        {"timestamp": (base_t + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%SZ"), "battery": 100.0 - 1.0 * i}
        for i in range(4)
    ]
    times, values = _extract_metric_series(linear_history, "battery")
    res1 = _linear_trend_forecast(times, values, threshold=0.05, min_bound=0.0, max_bound=100.0)

    print(f"  Times (elapsed hours): {times.tolist()}")
    print(f"  Values: {values.tolist()}")
    print(f"  Rate: {res1['ratePerHour']} %/h, Forecast: {res1['forecast']}%, R²: {res1['rSquared']}")

    assert abs(res1["ratePerHour"] - (-1.0)) < 1e-4, f"Expected -1.0 %/h, got {res1['ratePerHour']}"
    assert res1["trend"] == "DECREASING"
    # Latest observed is 97.0 at t=3h. At t=3+24=27h, forecast = 100 - 27 = 73.0
    assert abs(res1["forecast"] - 73.0) < 1e-4, f"Expected 73.0%, got {res1['forecast']}"
    assert abs(res1["rSquared"] - 1.0) < 1e-4, f"Expected R² = 1.0, got {res1['rSquared']}"
    assert res1["confidence"] == "HIGH"
    print("TEST 1 PASSED [PASS]")

    # -------------------------------------------------------------
    # TEST 2 - DUPLICATE TIMESTAMPS
    # -------------------------------------------------------------
    print("\n--> TEST 2: DUPLICATE TIMESTAMPS")
    # Same timestamp 10:00:00 -> 80, 79, 78 (78 should win)
    # Next timestamp 11:00:00 -> 77
    dupe_history = [
        {"timestamp": "2026-01-01T10:00:00Z", "battery": 80.0},
        {"timestamp": "2026-01-01T10:00:00Z", "battery": 79.0},
        {"timestamp": "2026-01-01T10:00:00Z", "battery": 78.0},
        {"timestamp": "2026-01-01T11:00:00Z", "battery": 77.0},
    ]
    times_dupe, values_dupe = _extract_metric_series(dupe_history, "battery")
    print(f"  Deduplicated times: {times_dupe.tolist()}")
    print(f"  Deduplicated values: {values_dupe.tolist()}")

    # Must contain exactly 2 unique timestamps
    assert len(times_dupe) == 2, f"Expected 2 points, got {len(times_dupe)}"
    # Latest value for 10:00:00 must be 78.0
    assert values_dupe[0] == 78.0, f"Expected latest value 78.0, got {values_dupe[0]}"
    assert values_dupe[1] == 77.0
    # Real elapsed time: exactly 0.0 and 1.0 hour (no artificial 0.05s increments)
    assert abs(times_dupe[0] - 0.0) < 1e-6
    assert abs(times_dupe[1] - 1.0) < 1e-6
    # Rate must be (77 - 78) / 1.0 = -1.0 %/h
    res2 = _linear_trend_forecast(times_dupe, values_dupe, threshold=0.05)
    assert abs(res2["ratePerHour"] - (-1.0)) < 1e-4
    print("  [OK] Deduplication correct: latest value wins, no artificial timestamps invented.")
    print("TEST 2 PASSED [PASS]")

    # -------------------------------------------------------------
    # TEST 3 - INSUFFICIENT TIME SPAN (< 0.01h / 36s)
    # -------------------------------------------------------------
    print("\n--> TEST 3: INSUFFICIENT TIME SPAN")
    # 30 samples all within 5 seconds
    rapid_history = []
    t0 = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    for i in range(30):
        # Spaced by 0.15 seconds -> total span 4.35s < 36s
        t_i = t0 + timedelta(milliseconds=i * 150)
        rapid_history.append({
            "timestamp": t_i.strftime("%Y-%m-%dT%H:%M:%S.%fZ")[:-4] + "Z",
            "battery": 80.0 - 0.1 * i,
            "fuel": 70.0,
            "powerConsumption": 50.0,
            "temperature": -35.0,
        })
    res3 = forecast_station("maitri", rapid_history)
    print(f"  Response on rapid burst: status={res3.get('status')}, message={res3.get('message')}")
    assert res3["status"] == "LEARNING"
    assert "Collecting telemetry across a sufficient time span" in res3["message"]
    assert "battery" not in res3
    assert res3["timeSpanHours"] < MIN_TIME_SPAN_HOURS
    assert res3["minimumTimeSpanHours"] == MIN_TIME_SPAN_HOURS
    print("  [OK] Rapid bursts safely reject trend calculation and remain in LEARNING mode.")
    print("TEST 3 PASSED [PASS]")

    # -------------------------------------------------------------
    # TEST 4 - BATTERY BOUNDS (0 <= forecast <= 100)
    # -------------------------------------------------------------
    print("\n--> TEST 4: BATTERY BOUNDS")
    # Strong drop: battery drops by 5% per hour from 100 to 0 (would extrapolate to -120% at +24h)
    t_start = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    steep_batt_history = [
        {
            "timestamp": (t_start + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "battery": max(0.0, 100.0 - 5.0 * i),
            "fuel": 80.0,
            "powerConsumption": 50.0,
            "temperature": -35.0,
        }
        for i in range(25)
    ]
    res4 = forecast_station("maitri", steep_batt_history)
    batt_forecast = res4["battery"]["forecast"]
    print(f"  Steep battery drain: rate={res4['battery']['ratePerHour']} %/h, forecast={batt_forecast}%")
    assert 0.0 <= batt_forecast <= 100.0, f"Battery forecast out of bounds: {batt_forecast}"
    assert batt_forecast == 0.0, f"Expected clamped at 0.0, got {batt_forecast}"
    print("TEST 4 PASSED [PASS]")

    # -------------------------------------------------------------
    # TEST 5 - FUEL BOUNDS (0 <= forecast <= 100)
    # -------------------------------------------------------------
    print("\n--> TEST 5: FUEL BOUNDS")
    # Strong drop: fuel drops by 4% per hour
    steep_fuel_history = [
        {
            "timestamp": (t_start + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "battery": 80.0,
            "fuel": max(0.0, 80.0 - 4.0 * i),
            "powerConsumption": 50.0,
            "temperature": -35.0,
        }
        for i in range(25)
    ]
    res5 = forecast_station("maitri", steep_fuel_history)
    fuel_forecast = res5["fuel"]["forecast"]
    print(f"  Steep fuel drain: rate={res5['fuel']['ratePerHour']} %/h, forecast={fuel_forecast}%")
    assert 0.0 <= fuel_forecast <= 100.0, f"Fuel forecast out of bounds: {fuel_forecast}"
    assert fuel_forecast == 0.0, f"Expected clamped at 0.0, got {fuel_forecast}"
    print("TEST 5 PASSED [PASS]")

    # -------------------------------------------------------------
    # TEST 6 - POWER BOUNDS (forecast >= 0)
    # -------------------------------------------------------------
    print("\n--> TEST 6: POWER BOUNDS")
    # Decreasing power: 10 kW dropping by 1 kW per hour (extrapolating negative)
    steep_power_history = [
        {
            "timestamp": (t_start + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "battery": 80.0,
            "fuel": 80.0,
            "powerConsumption": max(0.0, 20.0 - 1.0 * i),
            "temperature": -35.0,
        }
        for i in range(25)
    ]
    res6 = forecast_station("maitri", steep_power_history)
    power_forecast = res6["powerConsumption"]["forecast"]
    print(f"  Decreasing power: rate={res6['powerConsumption']['ratePerHour']} kW/h, forecast={power_forecast} kW")
    assert power_forecast >= 0.0, f"Power forecast cannot be negative: {power_forecast}"
    print("TEST 6 PASSED [PASS]")

    # -------------------------------------------------------------
    # TEST 7 - R² VALIDATION & CONFIDENCE
    # -------------------------------------------------------------
    print("\n--> TEST 7: R² VALIDATION & CONFIDENCE")
    # Clean linear
    t_clean, v_clean = np.linspace(0, 10, 20), 100.0 - 0.5 * np.linspace(0, 10, 20)
    res_clean = _linear_trend_forecast(t_clean, v_clean, threshold=0.05)
    print(f"  Clean line: R²={res_clean['rSquared']}, confidence={res_clean['confidence']}")
    assert res_clean["rSquared"] >= 0.99
    assert res_clean["confidence"] == "HIGH"

    # Highly noisy data
    np.random.seed(42)
    t_noisy = np.linspace(0, 10, 20)
    v_noisy = 50.0 + np.random.normal(0, 10.0, 20)
    res_noisy = _linear_trend_forecast(t_noisy, v_noisy, threshold=0.05)
    print(f"  Noisy data: R²={res_noisy['rSquared']}, confidence={res_noisy['confidence']}")
    assert res_noisy["rSquared"] < 0.50
    assert res_noisy["confidence"] == "LOW"
    print("TEST 7 PASSED [PASS]")

    # -------------------------------------------------------------
    # TEST 8 - FUEL AUTONOMY
    # -------------------------------------------------------------
    print("\n--> TEST 8: FUEL AUTONOMY")
    # Rate = -1.0 %/h, current fuel = 76.0% -> autonomy = 76.0 hours
    autonomy_valid = _calculate_fuel_autonomy(current_fuel=76.0, rate_per_hour=-1.0)
    print(f"  Fuel autonomy (drain -1.0 %/h, fuel 76.0%): {autonomy_valid} hours")
    assert autonomy_valid == 76 or autonomy_valid == 76.0

    # Stable fuel (rate = 0.0) -> None
    autonomy_stable = _calculate_fuel_autonomy(current_fuel=76.0, rate_per_hour=0.0)
    assert autonomy_stable is None, f"Expected None for stable, got {autonomy_stable}"

    # Increasing fuel (rate = +1.0) -> None
    autonomy_inc = _calculate_fuel_autonomy(current_fuel=76.0, rate_per_hour=1.0)
    assert autonomy_inc is None, f"Expected None for increasing, got {autonomy_inc}"
    print("TEST 8 PASSED [PASS]")

    # -------------------------------------------------------------
    # TEST 9 - STATION INDEPENDENCE
    # -------------------------------------------------------------
    print("\n--> TEST 9: STATION INDEPENDENCE")
    maitri_controlled = [
        {
            "timestamp": (t_start + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "battery": 100.0 - 2.0 * i,  # steep drop
            "fuel": 70.0,
            "powerConsumption": 50.0,
            "temperature": -35.0,
        }
        for i in range(25)
    ]
    bharati_controlled = [
        {
            "timestamp": (t_start + timedelta(hours=i)).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "battery": 80.0,  # steady
            "fuel": 50.0,
            "powerConsumption": 100.0,
            "temperature": -24.0,
        }
        for i in range(25)
    ]
    m_res = forecast_station("maitri", maitri_controlled)
    b_res = forecast_station("bharati", bharati_controlled)

    print(f"  Maitri battery rate: {m_res['battery']['ratePerHour']} %/h, trend: {m_res['battery']['trend']}")
    print(f"  Bharati battery rate: {b_res['battery']['ratePerHour']} %/h, trend: {b_res['battery']['trend']}")

    assert m_res["battery"]["ratePerHour"] == -2.0
    assert m_res["battery"]["trend"] == "DECREASING"
    assert b_res["battery"]["ratePerHour"] == 0.0
    assert b_res["battery"]["trend"] == "STABLE"
    print("TEST 9 PASSED [PASS]")

    # -------------------------------------------------------------
    # TEST 11 - BAD DATA HANDLING (unit level)
    # -------------------------------------------------------------
    print("\n--> TEST 11: BAD DATA HANDLING")
    dirty_history = list(maitri_controlled[:22])
    dirty_history.append({"timestamp": "INVALID_TS", "battery": 50})
    dirty_history.append({"timestamp": t_start.strftime("%Y-%m-%dT%H:%M:%SZ"), "battery": float("nan")})
    dirty_history.append({"timestamp": None, "fuel": float("inf")})
    dirty_res = forecast_station("maitri", dirty_history)

    assert dirty_res["status"] == "ACTIVE"
    dumped = json.dumps(dirty_res)
    assert "NaN" not in dumped
    assert "Infinity" not in dumped
    print("  [OK] Missing keys, NaNs, and Infs handled safely without invalid JSON.")
    print("TEST 11 PASSED [PASS]")

    print("\n" + "=" * 65)
    print("ALL UNIT & MATHEMATICAL TESTS PASSED! [PASS]")
    print("=" * 65)


def run_http_tests():
    print("\n" + "=" * 65)
    print("RUNNING LIVE HTTP API INTEGRATION TESTS")
    print("=" * 65)

    # -------------------------------------------------------------
    # TEST 10 - EXISTING APIs
    # -------------------------------------------------------------
    print("\n--> TEST 10: EXISTING APIs")
    r_m = requests.get(f"{BASE_URL}/api/v1/stations/maitri")
    assert r_m.status_code == 200
    print("  [OK] GET /api/v1/stations/maitri -> 200")

    r_b = requests.get(f"{BASE_URL}/api/v1/stations/bharati")
    assert r_b.status_code == 200
    print("  [OK] GET /api/v1/stations/bharati -> 200")

    r_h = requests.get(f"{BASE_URL}/api/v1/stations/maitri/history")
    assert r_h.status_code == 200
    print("  [OK] GET /api/v1/stations/maitri/history -> 200")

    r_a = requests.get(f"{BASE_URL}/api/v1/stations/maitri/anomaly")
    assert r_a.status_code == 200
    print("  [OK] GET /api/v1/stations/maitri/anomaly -> 200")

    r_p = requests.post(f"{BASE_URL}/api/v1/stations/maitri/telemetry", json={"water": 82.5})
    assert r_p.status_code == 200
    print("  [OK] POST /api/v1/stations/maitri/telemetry -> 200")

    # Forecast endpoint live
    r_f = requests.get(f"{BASE_URL}/api/v1/stations/maitri/forecast")
    assert r_f.status_code == 200
    f_json = r_f.json()
    print(f"  [OK] GET /api/v1/stations/maitri/forecast -> 200 (status: {f_json['status']})")
    assert f_json["status"] in ("LEARNING", "ACTIVE")

    # Invalid station returns 404
    r_inv = requests.get(f"{BASE_URL}/api/v1/stations/invalid_station/forecast")
    assert r_inv.status_code == 404
    print("  [OK] GET /api/v1/stations/invalid_station/forecast -> 404")
    print("TEST 10 PASSED [PASS]")

    print("\n" + "=" * 65)
    print("ALL 11 TESTS (UNIT + HTTP) COMPLETED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    run_unit_tests()
    if len(sys.argv) > 1 and sys.argv[1] == "--unit-only":
        sys.exit(0)
    run_http_tests()

