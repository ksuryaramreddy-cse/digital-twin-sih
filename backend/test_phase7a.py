"""
test_phase7a.py
===============
Comprehensive automated test suite for Phase 7A:
Backend What-If Scenario Simulation Engine.

Tests:
------
TEST 1: Existing APIs still work (telemetry, history, anomaly, forecast, decision).
TEST 2: Neutral scenario produces valid simulation matching baseline.
TEST 3: Temperature drop increases power demand (+2% per 1°C drop).
TEST 4: Manual power demand increase works.
TEST 5: Generator capacity reduction increases stress ratio and stress level.
TEST 6: Fuel consumption increase reduces fuel and fuel autonomy.
TEST 7: Combined extreme scenario produces increased risk score and HIGH/CRITICAL severity.
TEST 8: Maitri and Bharati remain completely independent.
TEST 9: Invalid station returns 404; out-of-range inputs return 422 validation error.
TEST 10: Extreme inputs never produce NaN, Infinity, negative battery/fuel, or values > 100.
"""

import math
import sys
import requests

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000"


def assert_finite(val, name="value"):
    assert val is not None, f"{name} should not be None"
    assert not math.isnan(val), f"{name} is NaN"
    assert not math.isinf(val), f"{name} is Infinite"


def run_all_tests():
    print("=" * 70)
    print("  PHASE 7A -- WHAT-IF SCENARIO SIMULATION ENGINE TEST SUITE")
    print("=" * 70)

    # -----------------------------------------------------------------------
    # TEST 1: Existing APIs still work
    # -----------------------------------------------------------------------
    print("\n[TEST 1] Verifying existing endpoints...")
    for endpoint in [
        "/api/v1/stations/maitri",
        "/api/v1/stations/maitri/history",
        "/api/v1/stations/maitri/anomaly",
        "/api/v1/stations/maitri/forecast",
        "/api/v1/stations/maitri/decision",
        "/api/v1/stations/bharati/decision",
    ]:
        resp = requests.get(f"{BASE_URL}{endpoint}", timeout=5)
        assert resp.status_code == 200, f"Endpoint {endpoint} failed with {resp.status_code}"
    print("[PASS] TEST 1 PASSED: All existing station APIs return 200 OK.")

    # -----------------------------------------------------------------------
    # TEST 2: Neutral scenario produces valid simulation
    # -----------------------------------------------------------------------
    print("\n[TEST 2] Verifying neutral scenario on Maitri...")
    payload_neutral = {
        "temperatureDelta": 0.0,
        "powerDemandChange": 0.0,
        "generatorCapacityChange": 0.0,
        "fuelConsumptionChange": 0.0,
        "durationHours": 24.0,
    }
    resp = requests.post(f"{BASE_URL}/api/v1/stations/maitri/simulate", json=payload_neutral, timeout=5)
    assert resp.status_code == 200, f"Neutral scenario failed: {resp.text}"
    data = resp.json()

    assert data["status"] == "SUCCESS"
    assert data["station"] == "maitri"
    assert_finite(data["simulated"]["temperature"], "simulated.temperature")
    assert_finite(data["simulated"]["powerConsumption"], "simulated.powerConsumption")
    assert_finite(data["simulated"]["battery"], "simulated.battery")
    assert_finite(data["simulated"]["fuel"], "simulated.fuel")
    assert data["impact"]["powerChange"] == 0.0, "Zero power demand change should yield 0 delta"
    assert data["simulated"]["temperature"] == data["baseline"]["temperature"]
    assert len(data["assumptions"]) > 0, "Assumptions should be returned transparently"
    print("[PASS] TEST 2 PASSED: Neutral scenario output matches baseline and returns assumptions.")

    # -----------------------------------------------------------------------
    # TEST 3: Temperature drop increases power demand
    # -----------------------------------------------------------------------
    print("\n[TEST 3] Verifying cold weather thermal power increase...")
    payload_cold = {
        "temperatureDelta": -10.0,  # 10°C drop
        "powerDemandChange": 0.0,
        "generatorCapacityChange": 0.0,
        "fuelConsumptionChange": 0.0,
        "durationHours": 24.0,
    }
    resp = requests.post(f"{BASE_URL}/api/v1/stations/maitri/simulate", json=payload_cold, timeout=5)
    assert resp.status_code == 200
    data = resp.json()
    # 10°C drop * 2% per °C = +20% power demand
    expected_power = round(data["baseline"]["powerConsumption"] * 1.20, 2)
    assert data["simulated"]["powerConsumption"] == expected_power, (
        f"Expected {expected_power} kW with 20% heating load, got {data['simulated']['powerConsumption']}"
    )
    assert data["impact"]["powerChange"] > 0
    print(f"[PASS] TEST 3 PASSED: -10°C drop correctly added 20% heating demand ({data['baseline']['powerConsumption']} kW -> {data['simulated']['powerConsumption']} kW).")

    # -----------------------------------------------------------------------
    # TEST 4: Manual power demand increase works
    # -----------------------------------------------------------------------
    print("\n[TEST 4] Verifying manual power demand change...")
    payload_power = {
        "temperatureDelta": 0.0,
        "powerDemandChange": 25.0,  # +25%
        "generatorCapacityChange": 0.0,
        "fuelConsumptionChange": 0.0,
        "durationHours": 24.0,
    }
    resp = requests.post(f"{BASE_URL}/api/v1/stations/maitri/simulate", json=payload_power, timeout=5)
    assert resp.status_code == 200
    data = resp.json()
    expected_power = round(data["baseline"]["powerConsumption"] * 1.25, 2)
    assert data["simulated"]["powerConsumption"] == expected_power
    print(f"[PASS] TEST 4 PASSED: Manual power demand change (+25%) verified ({data['simulated']['powerConsumption']} kW).")

    # -----------------------------------------------------------------------
    # TEST 5: Generator capacity reduction increases stress
    # -----------------------------------------------------------------------
    print("\n[TEST 5] Verifying generator capacity impairment...")
    payload_gen = {
        "temperatureDelta": 0.0,
        "powerDemandChange": 10.0,
        "generatorCapacityChange": -50.0,  # 50% loss of generator capacity
        "fuelConsumptionChange": 0.0,
        "durationHours": 24.0,
    }
    resp = requests.post(f"{BASE_URL}/api/v1/stations/maitri/simulate", json=payload_gen, timeout=5)
    assert resp.status_code == 200
    data = resp.json()
    gen = data["generator"]
    assert gen["stressRatio"] > 1.0, f"Expected stress ratio > 1.0, got {gen['stressRatio']}"
    assert gen["stressLevel"] == "CRITICAL", f"Expected CRITICAL stress, got {gen['stressLevel']}"
    print(f"[PASS] TEST 5 PASSED: -50% generator capacity correctly escalated stress to {gen['stressLevel']} (ratio: {gen['stressRatio']}).")

    # -----------------------------------------------------------------------
    # TEST 6: Fuel consumption increase reduces fuel / autonomy
    # -----------------------------------------------------------------------
    print("\n[TEST 6] Verifying fuel consumption surge impact...")
    payload_fuel_normal = {
        "temperatureDelta": 0.0,
        "powerDemandChange": 0.0,
        "generatorCapacityChange": 0.0,
        "fuelConsumptionChange": 0.0,
        "durationHours": 48.0,
    }
    payload_fuel_high = {
        "temperatureDelta": 0.0,
        "powerDemandChange": 0.0,
        "generatorCapacityChange": 0.0,
        "fuelConsumptionChange": 50.0,  # +50% fuel consumption
        "durationHours": 48.0,
    }
    resp_norm = requests.post(f"{BASE_URL}/api/v1/stations/bharati/simulate", json=payload_fuel_normal, timeout=5).json()
    resp_high = requests.post(f"{BASE_URL}/api/v1/stations/bharati/simulate", json=payload_fuel_high, timeout=5).json()

    assert resp_high["simulated"]["fuel"] <= resp_norm["simulated"]["fuel"], "High fuel consumption must yield lower simulated fuel"
    assert resp_high["impact"]["fuelChange"] < resp_norm["impact"]["fuelChange"], "Fuel delta should be more negative"
    print(f"[PASS] TEST 6 PASSED: Fuel consumption surge (+50%) accelerated depletion (Remaining: {resp_high['simulated']['fuel']}% vs {resp_norm['simulated']['fuel']}%).")

    # -----------------------------------------------------------------------
    # TEST 7: Combined extreme scenario produces increased risk
    # -----------------------------------------------------------------------
    print("\n[TEST 7] Verifying combined extreme polar storm scenario...")
    payload_extreme = {
        "temperatureDelta": -20.0,        # -20°C drop (+40% heating)
        "powerDemandChange": 40.0,        # +40% base demand -> total +80%
        "generatorCapacityChange": -40.0, # 40% generator offline
        "fuelConsumptionChange": 50.0,    # +50% fuel burn
        "durationHours": 72.0,            # 3 days
    }
    resp = requests.post(f"{BASE_URL}/api/v1/stations/maitri/simulate", json=payload_extreme, timeout=5)
    assert resp.status_code == 200
    data = resp.json()

    assert data["risk"]["score"] >= 60, f"Expected elevated risk score (>= 60), got {data['risk']['score']}"
    assert data["risk"]["severity"] in ("HIGH", "CRITICAL"), f"Expected HIGH/CRITICAL severity, got {data['risk']['severity']}"
    assert len(data["risk"]["factors"]) >= 2, "Multiple risk factors should be identified"
    assert len(data["recommendations"]) >= 1, "Actionable recommendations should be generated"
    print(f"[PASS] TEST 7 PASSED: Extreme blizzard produced Risk Score {data['risk']['score']}/100 ({data['risk']['severity']}) with {len(data['risk']['factors'])} risk factors.")

    # -----------------------------------------------------------------------
    # TEST 8: Maitri / Bharati remain independent
    # -----------------------------------------------------------------------
    print("\n[TEST 8] Verifying station independence...")
    resp_m = requests.post(f"{BASE_URL}/api/v1/stations/maitri/simulate", json=payload_neutral, timeout=5).json()
    resp_b = requests.post(f"{BASE_URL}/api/v1/stations/bharati/simulate", json=payload_neutral, timeout=5).json()

    assert resp_m["station"] == "maitri"
    assert resp_b["station"] == "bharati"
    assert resp_m["baseline"]["temperature"] != resp_b["baseline"]["temperature"], "Maitri and Bharati baselines should differ"
    assert resp_m["baseline"]["powerConsumption"] != resp_b["baseline"]["powerConsumption"], "Maitri and Bharati power should differ"
    print(f"[PASS] TEST 8 PASSED: Maitri (Temp: {resp_m['baseline']['temperature']}°C) and Bharati (Temp: {resp_b['baseline']['temperature']}°C) remain completely independent.")

    # -----------------------------------------------------------------------
    # TEST 9: Invalid station and invalid input return proper errors
    # -----------------------------------------------------------------------
    print("\n[TEST 9] Verifying input validation and error handling...")
    # Invalid station
    resp_bad_station = requests.post(f"{BASE_URL}/api/v1/stations/dakshin_gangotri/simulate", json=payload_neutral, timeout=5)
    assert resp_bad_station.status_code == 404, f"Expected 404 for invalid station, got {resp_bad_station.status_code}"

    # Out of range temperatureDelta (> 50)
    resp_bad_temp = requests.post(f"{BASE_URL}/api/v1/stations/maitri/simulate", json={**payload_neutral, "temperatureDelta": 80.0}, timeout=5)
    assert resp_bad_temp.status_code == 422, f"Expected 422 for temperatureDelta=80, got {resp_bad_temp.status_code}"

    # Out of range durationHours (> 168)
    resp_bad_dur = requests.post(f"{BASE_URL}/api/v1/stations/maitri/simulate", json={**payload_neutral, "durationHours": 300.0}, timeout=5)
    assert resp_bad_dur.status_code == 422, f"Expected 422 for durationHours=300, got {resp_bad_dur.status_code}"

    # Out of range generatorCapacityChange (< -100)
    resp_bad_gen = requests.post(f"{BASE_URL}/api/v1/stations/maitri/simulate", json={**payload_neutral, "generatorCapacityChange": -150.0}, timeout=5)
    assert resp_bad_gen.status_code == 422, f"Expected 422 for generatorCapacityChange=-150, got {resp_bad_gen.status_code}"
    print("[PASS] TEST 9 PASSED: Proper 404 and 422 validation errors returned for invalid inputs.")

    # -----------------------------------------------------------------------
    # TEST 10: Extreme inputs never produce NaN, Infinity, or out-of-bound percentages
    # -----------------------------------------------------------------------
    print("\n[TEST 10] Verifying numeric safety and clamping on boundary conditions...")
    # Extreme 7-day max stress
    payload_boundary = {
        "temperatureDelta": -50.0,
        "powerDemandChange": 200.0,
        "generatorCapacityChange": -100.0, # Complete generator blackout
        "fuelConsumptionChange": 200.0,
        "durationHours": 168.0,            # Max 7 days
    }
    resp = requests.post(f"{BASE_URL}/api/v1/stations/maitri/simulate", json=payload_boundary, timeout=5)
    assert resp.status_code == 200
    data = resp.json()

    # Verify clamping [0, 100]
    battery = data["simulated"]["battery"]
    fuel = data["simulated"]["fuel"]
    risk = data["risk"]["score"]

    assert_finite(battery, "simulated.battery")
    assert_finite(fuel, "simulated.fuel")
    assert_finite(risk, "risk.score")

    assert 0.0 <= battery <= 100.0, f"Battery out of bounds: {battery}"
    assert 0.0 <= fuel <= 100.0, f"Fuel out of bounds: {fuel}"
    assert 0.0 <= risk <= 100.0, f"Risk score out of bounds: {risk}"
    assert data["generator"]["stressLevel"] == "CRITICAL"
    print(f"[PASS] TEST 10 PASSED: Maximum boundary inputs safely clamped (Battery: {battery}%, Fuel: {fuel}%, Risk: {risk}/100, 0 NaN/Inf).")

    print("\n" + "=" * 70)
    print("  ALL 10 TESTS IN PHASE 7A TEST SUITE PASSED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    try:
        run_all_tests()
    except Exception as e:
        print(f"\n[FAIL] TEST FAILED: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)
