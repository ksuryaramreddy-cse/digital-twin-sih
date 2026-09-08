"""
test_phase5a.py
================
Comprehensive test suite for Phase 5A: Backend Risk & Decision Intelligence Engine.

Tests:
  1. Existing APIs verification (/stations, /history, /anomaly, /forecast, /telemetry)
  2. Learning mode verification (insufficient samples, mixed status)
  3. Active normal state verification (complete schema, 4 categories)
  4. Energy risk calculation (low battery, declining forecast, increasing power)
  5. Fuel / Resource risk calculation (depletion trend, short autonomy)
  6. Infrastructure risk calculation (critical anomaly, safety escalation)
  7. Environmental baselines (Maitri -35°C and Bharati -24°C do not trigger critical)
  8. Overall weighting formula & critical safety escalation
  9. Station independence (Maitri vs Bharati isolated evaluation)
  10. Invalid station handling (HTTP 404)
  11. Bad data robustness (None, NaN, Inf, missing fields)
  12. Backend live API integration (/decision endpoint)
  13. Pure JSON serialization validation
  14. Existing system regression verification
"""

import json
import math
import sys
import unittest
import urllib.request
import urllib.error

# Import services directly for unit testing
from services.decision_engine import (
    risk_level_from_score,
    calculate_energy_risk,
    calculate_resource_risk,
    calculate_environment_risk,
    calculate_infrastructure_risk,
    calculate_overall_risk,
    generate_summary,
    generate_recommendations,
    evaluate_station_decision,
    WEIGHT_ENERGY,
    WEIGHT_RESOURCES,
    WEIGHT_ENVIRONMENT,
    WEIGHT_INFRASTRUCTURE,
)


class TestPhase5ADecisionEngine(unittest.TestCase):

    # -----------------------------------------------------------------------
    # TEST 1 — Existing APIs
    # -----------------------------------------------------------------------
    def test_01_existing_apis(self):
        base = "http://127.0.0.1:8000/api/v1"
        routes = [
            f"{base}/stations",
            f"{base}/stations/maitri",
            f"{base}/stations/maitri/history",
            f"{base}/stations/maitri/anomaly",
            f"{base}/stations/maitri/forecast",
        ]
        for url in routes:
            try:
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=5) as resp:
                    self.assertEqual(resp.status, 200, f"Route {url} failed with {resp.status}")
                    data = json.loads(resp.read().decode())
                    self.assertIsNotNone(data)
            except Exception as e:
                self.fail(f"Existing route {url} raised error: {e}")

        # Test POST telemetry
        try:
            post_url = f"{base}/stations/maitri/telemetry"
            body = json.dumps({"battery": 78.0}).encode("utf-8")
            req = urllib.request.Request(post_url, data=body, headers={"Content-Type": "application/json"}, method="POST")
            with urllib.request.urlopen(req, timeout=5) as resp:
                self.assertEqual(resp.status, 200)
                data = json.loads(resp.read().decode())
                self.assertEqual(data.get("status"), "SUCCESS")
        except Exception as e:
            self.fail(f"POST telemetry failed: {e}")

    # -----------------------------------------------------------------------
    # TEST 2 — Learning Mode
    # -----------------------------------------------------------------------
    def test_02_learning_mode(self):
        # Case A: Both LEARNING
        anomaly_learn = {"status": "LEARNING", "samplesUsed": 5, "minimumSamplesRequired": 30}
        forecast_learn = {"status": "LEARNING", "samplesUsed": 5, "minimumSamplesRequired": 20}
        res_a = evaluate_station_decision("maitri", {}, [], anomaly_learn, forecast_learn)
        self.assertEqual(res_a["status"], "LEARNING")
        self.assertNotIn("riskScore", res_a)
        self.assertNotIn("recommendedActions", res_a)
        self.assertEqual(res_a["anomalyStatus"], "LEARNING")
        self.assertEqual(res_a["forecastStatus"], "LEARNING")

        # Case B: Anomaly ACTIVE, Forecast LEARNING (mixed state)
        anomaly_active = {"status": "ACTIVE", "severity": "NORMAL"}
        res_b = evaluate_station_decision("maitri", {}, [], anomaly_active, forecast_learn)
        self.assertEqual(res_b["status"], "LEARNING")
        self.assertEqual(res_b["anomalyStatus"], "ACTIVE")
        self.assertEqual(res_b["forecastStatus"], "LEARNING")

    # -----------------------------------------------------------------------
    # TEST 3 — Active Normal State
    # -----------------------------------------------------------------------
    def test_03_active_normal_state(self):
        station = {
            "stationId": "maitri",
            "temperature": -35.0,
            "windSpeed": 45.0,
            "battery": 80.0,
            "fuel": 75.0,
            "water": 80.0,
            "powerConsumption": 48.0,
            "generatorStatus": "NORMAL",
            "generatorLoad": 70.0,
            "communicationStatus": "ONLINE",
        }
        anomaly = {"status": "ACTIVE", "severity": "NORMAL", "isAnomaly": False}
        forecast = {
            "status": "ACTIVE",
            "battery": {"current": 80.0, "forecast": 78.0, "trend": "STABLE"},
            "fuel": {"current": 75.0, "forecast": 74.5, "trend": "STABLE", "estimatedAutonomyHours": None},
            "powerConsumption": {"current": 48.0, "forecast": 48.2, "trend": "STABLE"},
            "temperature": {"current": -35.0, "forecast": -35.0, "trend": "STABLE"},
        }
        res = evaluate_station_decision("maitri", station, [], anomaly, forecast)
        self.assertEqual(res["status"], "ACTIVE")
        self.assertEqual(res["station"], "maitri")
        self.assertIn("overallRisk", res)
        self.assertIn("riskScore", res)
        self.assertIn("priority", res)
        self.assertIn("summary", res)
        self.assertIn("riskCategories", res)
        self.assertIn("recommendedActions", res)
        self.assertIn("generatedAt", res)

        cats = res["riskCategories"]
        for cat in ("energy", "resources", "environment", "infrastructure"):
            self.assertIn(cat, cats)
            self.assertIn("level", cats[cat])
            self.assertIn("score", cats[cat])
            self.assertIn("factors", cats[cat])

        # Under healthy nominal state, overall risk should be LOW
        self.assertEqual(res["overallRisk"], "LOW")
        self.assertLess(res["riskScore"], 25.0)

    # -----------------------------------------------------------------------
    # TEST 4 — Energy Risk
    # -----------------------------------------------------------------------
    def test_04_energy_risk(self):
        station = {"battery": 18.0, "powerConsumption": 55.0}  # < 20% -> +40
        forecast = {
            "status": "ACTIVE",
            "battery": {"forecast": 10.0, "trend": "DECREASING"},  # forecast < 15% -> +30, decreasing -> +10
            "powerConsumption": {"trend": "INCREASING"},            # power increasing -> +10
        }
        anomaly = {"status": "ACTIVE", "severity": "NORMAL"}
        
        e_risk = calculate_energy_risk(station, forecast, anomaly)
        self.assertGreaterEqual(e_risk["score"], 80)
        self.assertEqual(e_risk["level"], "CRITICAL")
        self.assertTrue(any("critically low" in f.lower() for f in e_risk["factors"]))
        self.assertTrue(any("forecast to fall below 15%" in f.lower() for f in e_risk["factors"]))
        self.assertTrue(any("trending downward" in f.lower() for f in e_risk["factors"]))
        self.assertTrue(any("increasing" in f.lower() for f in e_risk["factors"]))

        # Recommendations should include emergency load shedding
        recs = generate_recommendations("CRITICAL", {"energy": e_risk}, station, forecast, anomaly)
        self.assertTrue(any("power-shedding" in r["action"].lower() for r in recs))

    # -----------------------------------------------------------------------
    # TEST 5 — Fuel / Resource Risk
    # -----------------------------------------------------------------------
    def test_05_resource_risk(self):
        station = {"fuel": 12.0, "water": 70.0}  # fuel < 15% -> +35
        forecast = {
            "status": "ACTIVE",
            "fuel": {
                "forecast": 8.0,                      # forecast < 15% -> +30
                "trend": "DECREASING",                # trend decreasing -> +10
                "estimatedAutonomyHours": 18.5,       # autonomy < 24h -> +35
            }
        }
        r_risk = calculate_resource_risk(station, forecast)
        self.assertGreaterEqual(r_risk["score"], 80)
        self.assertEqual(r_risk["level"], "CRITICAL")
        self.assertTrue(any("critically low" in f.lower() for f in r_risk["factors"]))
        self.assertTrue(any("18.5 hours" in f.lower() for f in r_risk["factors"]))

        # Recommendations should include fuel conservation
        recs = generate_recommendations("CRITICAL", {"resources": r_risk}, station, forecast, {})
        self.assertTrue(any("fuel conservation" in r["action"].lower() for r in recs))

    # -----------------------------------------------------------------------
    # TEST 6 — Infrastructure Risk & Safety Escalation
    # -----------------------------------------------------------------------
    def test_06_infrastructure_risk(self):
        station = {
            "generatorStatus": "NORMAL",
            "generatorLoad": 72.0,
            "communicationStatus": "ONLINE",
        }
        # CRITICAL anomaly -> +70
        anomaly = {"status": "ACTIVE", "severity": "CRITICAL", "isAnomaly": True}
        infra_risk = calculate_infrastructure_risk(station, anomaly)
        self.assertGreaterEqual(infra_risk["score"], 70)
        self.assertTrue(any("critical" in f.lower() for f in infra_risk["factors"]))

        # Test safety escalation: other categories are low (score 0), but infra is CRITICAL
        energy_low = {"level": "LOW", "score": 0}
        resource_low = {"level": "LOW", "score": 0}
        env_low = {"level": "LOW", "score": 0}
        
        level, score, note = calculate_overall_risk(energy_low, resource_low, env_low, infra_risk)
        # Weighted score without override would be 70 * 0.25 = 17.5 (LOW).
        # But critical safety override escalates level to at least HIGH and score to >= 50.0!
        self.assertIn(level, ("HIGH", "CRITICAL"))
        self.assertGreaterEqual(score, 50.0)
        self.assertIsNotNone(note)
        self.assertIn("safety escalation", note.lower())

    # -----------------------------------------------------------------------
    # TEST 7 — Environmental Baselines
    # -----------------------------------------------------------------------
    def test_07_environmental_baselines(self):
        # Maitri normal baseline around -35°C
        maitri_station = {"stationId": "maitri", "temperature": -35.0, "windSpeed": 45.0}
        forecast_normal = {"status": "ACTIVE", "temperature": {"trend": "STABLE"}}
        anomaly_normal = {"status": "ACTIVE", "severity": "NORMAL"}
        env_maitri = calculate_environment_risk(maitri_station, forecast_normal, anomaly_normal)
        self.assertEqual(env_maitri["level"], "LOW", f"Maitri baseline at -35°C flagged as {env_maitri['level']}")
        self.assertLess(env_maitri["score"], 25)

        # Bharati normal baseline around -24°C
        bharati_station = {"stationId": "bharati", "temperature": -24.0, "windSpeed": 38.0}
        env_bharati = calculate_environment_risk(bharati_station, forecast_normal, anomaly_normal)
        self.assertEqual(env_bharati["level"], "LOW", f"Bharati baseline at -24°C flagged as {env_bharati['level']}")
        self.assertLess(env_bharati["score"], 25)

        # Extreme sub-baseline check: Maitri at -54°C + 95 km/h blizzard
        maitri_extreme = {"stationId": "maitri", "temperature": -54.0, "windSpeed": 95.0}
        env_extreme = calculate_environment_risk(maitri_extreme, forecast_normal, anomaly_normal)
        self.assertGreaterEqual(env_extreme["score"], 70)
        self.assertIn(env_extreme["level"], ("HIGH", "CRITICAL"))

    # -----------------------------------------------------------------------
    # TEST 8 — Overall Weighting Formula & Level Mapping
    # -----------------------------------------------------------------------
    def test_08_overall_weighting(self):
        # Formula: Energy * 0.30 + Resources * 0.25 + Environment * 0.20 + Infrastructure * 0.25
        # Test case: Energy=60, Resources=40, Environment=20, Infrastructure=40
        # Expected: 60*0.3 + 40*0.25 + 20*0.2 + 40*0.25 = 18 + 10 + 4 + 10 = 42.0 (MEDIUM)
        e = {"level": "HIGH", "score": 60}
        r = {"level": "MEDIUM", "score": 40}
        env = {"level": "LOW", "score": 20}
        i = {"level": "MEDIUM", "score": 40}
        lvl, scr, note = calculate_overall_risk(e, r, env, i)
        self.assertAlmostEqual(scr, 42.0, places=1)
        self.assertEqual(lvl, "MEDIUM")
        self.assertIsNone(note)

        # Level boundaries
        self.assertEqual(risk_level_from_score(10.0), "LOW")
        self.assertEqual(risk_level_from_score(24.9), "LOW")
        self.assertEqual(risk_level_from_score(25.0), "MEDIUM")
        self.assertEqual(risk_level_from_score(49.9), "MEDIUM")
        self.assertEqual(risk_level_from_score(50.0), "HIGH")
        self.assertEqual(risk_level_from_score(74.9), "HIGH")
        self.assertEqual(risk_level_from_score(75.0), "CRITICAL")
        self.assertEqual(risk_level_from_score(100.0), "CRITICAL")

    # -----------------------------------------------------------------------
    # TEST 9 — Station Independence
    # -----------------------------------------------------------------------
    def test_09_station_independence(self):
        maitri_station = {"stationId": "maitri", "battery": 15.0, "fuel": 10.0, "temperature": -35.0}
        bharati_station = {"stationId": "bharati", "battery": 75.0, "fuel": 80.0, "temperature": -24.0}
        
        forecast_maitri = {
            "status": "ACTIVE",
            "battery": {"forecast": 5.0, "trend": "DECREASING"},
            "fuel": {"forecast": 5.0, "trend": "DECREASING", "estimatedAutonomyHours": 10.0},
        }
        forecast_bharati = {
            "status": "ACTIVE",
            "battery": {"forecast": 75.0, "trend": "STABLE"},
            "fuel": {"forecast": 80.0, "trend": "STABLE", "estimatedAutonomyHours": None},
        }
        anomaly_nominal = {"status": "ACTIVE", "severity": "NORMAL"}

        res_maitri = evaluate_station_decision("maitri", maitri_station, [], anomaly_nominal, forecast_maitri)
        res_bharati = evaluate_station_decision("bharati", bharati_station, [], anomaly_nominal, forecast_bharati)

        self.assertIn(res_maitri["overallRisk"], ("HIGH", "CRITICAL"))
        self.assertEqual(res_bharati["overallRisk"], "LOW")
        self.assertNotEqual(res_maitri["riskScore"], res_bharati["riskScore"])

    # -----------------------------------------------------------------------
    # TEST 10 — Invalid Station (HTTP 404)
    # -----------------------------------------------------------------------
    def test_10_invalid_station(self):
        url = "http://127.0.0.1:8000/api/v1/stations/invalid_station_xyz/decision"
        req = urllib.request.Request(url)
        try:
            with urllib.request.urlopen(req) as resp:
                self.fail(f"Expected 404 for invalid station, got {resp.status}")
        except urllib.error.HTTPError as e:
            self.assertEqual(e.code, 404)
            err_data = json.loads(e.read().decode())
            self.assertIn("not found", err_data.get("detail", "").lower())

    # -----------------------------------------------------------------------
    # TEST 11 — Bad Data Robustness
    # -----------------------------------------------------------------------
    def test_11_bad_data_robustness(self):
        corrupt_station = {
            "battery": None,
            "fuel": float("nan"),
            "water": "invalid_string",
            "temperature": float("inf"),
            "windSpeed": None,
        }
        corrupt_forecast = {
            "status": "ACTIVE",
            "battery": {"forecast": float("nan"), "trend": None},
            "fuel": {"forecast": None, "estimatedAutonomyHours": float("inf")},
            "powerConsumption": None,
        }
        corrupt_anomaly = {
            "status": "ACTIVE",
            "severity": None,
            "topDeviationFactors": [{"feature": None, "deviation": float("nan")}],
        }
        try:
            res = evaluate_station_decision("maitri", corrupt_station, [], corrupt_anomaly, corrupt_forecast)
            self.assertIsInstance(res, dict)
            # Must serialize without error
            dumped = json.dumps(res)
            self.assertNotIn("NaN", dumped)
            self.assertNotIn("Infinity", dumped)
        except Exception as e:
            self.fail(f"evaluate_station_decision crashed on corrupt data: {e}")

    # -----------------------------------------------------------------------
    # TEST 12 — Backend Live Decision Route
    # -----------------------------------------------------------------------
    def test_12_live_decision_route(self):
        for station in ("maitri", "bharati"):
            url = f"http://127.0.0.1:8000/api/v1/stations/{station}/decision"
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as resp:
                self.assertEqual(resp.status, 200)
                data = json.loads(resp.read().decode())
                self.assertEqual(data.get("station"), station)
                self.assertIn(data.get("status"), ("LEARNING", "ACTIVE"))
                if data.get("status") == "ACTIVE":
                    self.assertIn("overallRisk", data)
                    self.assertIn("recommendedActions", data)
                elif data.get("status") == "LEARNING":
                    self.assertIn("anomalyStatus", data)
                    self.assertIn("forecastStatus", data)

    # -----------------------------------------------------------------------
    # TEST 13 — JSON Serialization
    # -----------------------------------------------------------------------
    def test_13_json_serialization(self):
        states = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        for st in states:
            station = {"battery": 50.0, "fuel": 50.0}
            anomaly = {"status": "ACTIVE", "severity": "NORMAL" if st == "LOW" else "CRITICAL"}
            forecast = {"status": "ACTIVE", "battery": {"forecast": 40.0, "trend": "STABLE"}}
            res = evaluate_station_decision("maitri", station, [], anomaly, forecast)
            try:
                serialized = json.dumps(res)
                self.assertIsInstance(serialized, str)
            except Exception as e:
                self.fail(f"JSON serialization failed for {st} state: {e}")

    # -----------------------------------------------------------------------
    # TEST 14 — Existing System Regression
    # -----------------------------------------------------------------------
    def test_14_existing_system_regression(self):
        # Verify anomaly detector still works independently
        from services.anomaly_detector import run_anomaly_detection
        from services.forecasting_service import forecast_station

        history = [
            {
                "temperature": -35.0,
                "windSpeed": 50.0,
                "humidity": 60.0,
                "pressure": 984.0,
                "battery": 78.0,
                "fuel": 72.0,
                "water": 84.0,
                "powerConsumption": 48.6,
                "generatorLoad": 78.0,
                "timestamp": f"2026-09-07T12:{i:02d}:00Z"
            }
            for i in range(35)
        ]
        anom = run_anomaly_detection("maitri", history, history[-1])
        self.assertIn(anom.get("status"), ("ACTIVE", "LEARNING"))

        fc = forecast_station("maitri", history)
        self.assertIn(fc.get("status"), ("ACTIVE", "LEARNING"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
