"""
decision_engine.py
===================
Explainable Risk & Decision Intelligence Engine for AIP-DT Stations.

Architecture:
-------------
Live Telemetry + IsolationForest Anomaly Engine + Predictive Forecasting Engine
      ↓
Categorical Risk Assessment (Energy, Resources, Environment, Infrastructure)
      ↓
Weighted Overall Risk Assessment (with Critical Safety Escalation)
      ↓
Explainable Summary & Evidence-Based Operational Recommendations

Design principles:
------------------
* Completely explainable, rule-based operational synthesis.
* Reuses existing real ML (IsolationForest) and forecasting (OLS regression + SES).
* Transparent scoring: every point and recommendation is linked to real triggered factors.
* Station baseline awareness: respects Maitri (~-35°C) and Bharati (~-24°C) baselines.
* Safe LEARNING mode: will not produce premature or fake risk scores.
* Guaranteed JSON serializability: pure Python primitives, zero NaN/Infinity.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Any, Optional

import numpy as np


# ---------------------------------------------------------------------------
# Constants & Weights
# ---------------------------------------------------------------------------
WEIGHT_ENERGY: float = 0.30
WEIGHT_RESOURCES: float = 0.25
WEIGHT_ENVIRONMENT: float = 0.20
WEIGHT_INFRASTRUCTURE: float = 0.25

# Risk level boundaries
SCORE_CRITICAL: float = 75.0
SCORE_HIGH: float = 50.0
SCORE_MEDIUM: float = 25.0


# ---------------------------------------------------------------------------
# Helper: Risk Level Mapping & Value Sanitization
# ---------------------------------------------------------------------------
def risk_level_from_score(score: float) -> str:
    """
    Map numerical score (0–100) to categorical risk level:
      0–24   -> LOW
      25–49  -> MEDIUM
      50–74  -> HIGH
      75–100 -> CRITICAL
    """
    if score >= SCORE_CRITICAL:
        return "CRITICAL"
    elif score >= SCORE_HIGH:
        return "HIGH"
    elif score >= SCORE_MEDIUM:
        return "MEDIUM"
    return "LOW"


def _safe_float(val: Any, default: float = 0.0) -> float:
    """Safely convert any numeric/numpy scalar to a clean Python float."""
    if val is None:
        return default
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return default
        return f
    except (ValueError, TypeError):
        return default


def _sanitize_for_json(obj: Any) -> Any:
    """Recursively convert NumPy scalars and handle NaN/Infinity for pure JSON."""
    if isinstance(obj, dict):
        return {k: _sanitize_for_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_sanitize_for_json(v) for v in obj]
    elif isinstance(obj, (np.integer, int)):
        return int(obj)
    elif isinstance(obj, (np.floating, float)):
        f = float(obj)
        if math.isnan(f) or math.isinf(f):
            return None
        return f
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    return obj


# ---------------------------------------------------------------------------
# TASK 2 - Energy Risk Calculation
# ---------------------------------------------------------------------------
def calculate_energy_risk(
    current_station: dict,
    forecast: dict,
    anomaly: dict
) -> dict:
    """
    Calculate Energy Risk score (0–100) and identify driving factors.
    Evidence:
      - Current battery level
      - Forecast battery level (24h)
      - Battery trend
      - Power consumption trend
      - Subsystem anomaly evidence
    """
    score = 0.0
    factors: list[str] = []

    station = current_station or {}
    battery = _safe_float(station.get("battery"), default=100.0)
    
    # 1. Current Battery
    if battery < 20.0:
        score += 40.0
        factors.append(f"Battery reserve is critically low ({battery:.1f}%).")
    elif battery < 35.0:
        score += 25.0
        factors.append(f"Battery reserve is low ({battery:.1f}%).")
    elif battery < 50.0:
        score += 10.0
        factors.append(f"Battery reserve is below 50% ({battery:.1f}%).")

    # 2. Forecast Battery (if active)
    forecast_status = forecast.get("status") if isinstance(forecast, dict) else None
    batt_fc = (forecast.get("battery") or {}) if isinstance(forecast, dict) else {}
    if forecast_status == "ACTIVE" and batt_fc:
        f_batt = batt_fc.get("forecast")
        if f_batt is not None:
            f_batt_val = _safe_float(f_batt)
            if f_batt_val < 15.0:
                score += 30.0
                factors.append(f"Battery is forecast to fall below 15% within 24 hours ({f_batt_val:.1f}%).")
            elif f_batt_val < 30.0:
                score += 20.0
                factors.append(f"Battery is forecast to fall below 30% within 24 hours ({f_batt_val:.1f}%).")
            elif f_batt_val < 50.0:
                score += 10.0
                factors.append(f"Battery is forecast to decline below 50% within 24 hours ({f_batt_val:.1f}%).")

        batt_trend = str(batt_fc.get("trend") or "").upper()
        if batt_trend == "DECREASING":
            score += 10.0
            factors.append("Battery level is trending downward.")

    # 3. Power Consumption Trend (if active)
    power_fc = (forecast.get("powerConsumption") or {}) if isinstance(forecast, dict) else {}
    if forecast_status == "ACTIVE" and power_fc:
        power_trend = str(power_fc.get("trend") or "").upper()
        if power_trend == "INCREASING":
            score += 10.0
            factors.append("Power consumption trend is increasing.")

    # 4. Anomaly Subsystem Evidence
    if isinstance(anomaly, dict) and anomaly.get("status") == "ACTIVE":
        anomaly_sev = str(anomaly.get("severity") or "NORMAL").upper()
        dev_factors = anomaly.get("topDeviationFactors") or []
        dev_features = [f.get("feature") for f in dev_factors if isinstance(f, dict)]
        if any(feat in ("battery", "powerConsumption", "generatorLoad") for feat in dev_features):
            if anomaly_sev == "CRITICAL":
                score += 15.0
                factors.append("Critical anomaly detected in electrical/battery subsystem.")
            elif anomaly_sev == "WARNING":
                score += 10.0
                factors.append("Statistical deviation detected in electrical/power subsystem.")

    clamped_score = int(round(min(100.0, max(0.0, score))))
    return {
        "level": risk_level_from_score(clamped_score),
        "score": clamped_score,
        "factors": factors,
    }


# ---------------------------------------------------------------------------
# TASK 3 - Resource Risk Calculation
# ---------------------------------------------------------------------------
def calculate_resource_risk(
    current_station: dict,
    forecast: dict
) -> dict:
    """
    Calculate Resource Risk score (0–100) and identify driving factors.
    Evidence:
      - Current fuel level
      - Forecast fuel level (24h)
      - Fuel trend
      - Estimated fuel autonomy (hours) from forecasting service
      - Secondary resource: potable water reserves
    """
    score = 0.0
    factors: list[str] = []

    station = current_station or {}
    fuel = _safe_float(station.get("fuel"), default=100.0)

    # 1. Current Fuel
    if fuel < 15.0:
        score += 35.0
        factors.append(f"Fuel reserve is critically low ({fuel:.1f}%).")
    elif fuel < 30.0:
        score += 25.0
        factors.append(f"Fuel reserve is below 30% ({fuel:.1f}%).")
    elif fuel < 50.0:
        score += 10.0
        factors.append(f"Fuel reserve is below 50% ({fuel:.1f}%).")

    # 2. Fuel Forecast & Trend (if active)
    forecast_status = forecast.get("status") if isinstance(forecast, dict) else None
    fuel_fc = (forecast.get("fuel") or {}) if isinstance(forecast, dict) else {}
    if forecast_status == "ACTIVE" and fuel_fc:
        f_fuel = fuel_fc.get("forecast")
        if f_fuel is not None:
            f_fuel_val = _safe_float(f_fuel)
            if f_fuel_val < 15.0:
                score += 30.0
                factors.append(f"Fuel reserve is forecast to fall below 15% within 24 hours ({f_fuel_val:.1f}%).")
            elif f_fuel_val < 30.0:
                score += 20.0
                factors.append(f"Fuel reserve is forecast to decline below 30% within 24 hours ({f_fuel_val:.1f}%).")

        fuel_trend = str(fuel_fc.get("trend") or "").upper()
        if fuel_trend == "DECREASING":
            score += 10.0
            factors.append("Fuel reserves are experiencing active depletion.")

        # 3. Estimated Autonomy (hours) directly from forecasting engine
        autonomy = fuel_fc.get("estimatedAutonomyHours")
        if autonomy is not None:
            autonomy_val = _safe_float(autonomy)
            if autonomy_val < 24.0:
                score += 35.0
                factors.append(f"Critical fuel autonomy: estimated {autonomy_val:.1f} hours remaining.")
            elif autonomy_val < 72.0:
                score += 25.0
                factors.append(f"Limited fuel autonomy: estimated {autonomy_val:.1f} hours remaining.")
            elif autonomy_val < 168.0:
                score += 15.0
                factors.append(f"Fuel autonomy requires operational planning: estimated {autonomy_val:.1f} hours remaining.")

    # 4. Potable Water Check
    water = _safe_float(station.get("water"), default=100.0)
    if water < 20.0:
        score += 15.0
        factors.append(f"Potable water reserve is critically low ({water:.1f}%).")
    elif water < 35.0:
        score += 10.0
        factors.append(f"Potable water reserve is below 35% ({water:.1f}%).")

    clamped_score = int(round(min(100.0, max(0.0, score))))
    return {
        "level": risk_level_from_score(clamped_score),
        "score": clamped_score,
        "factors": factors,
    }


# ---------------------------------------------------------------------------
# TASK 4 - Environmental Risk Calculation
# ---------------------------------------------------------------------------
def calculate_environment_risk(
    current_station: dict,
    forecast: dict,
    anomaly: dict
) -> dict:
    """
    Calculate Environmental Risk score (0–100) and identify driving factors.
    Respects normal Antarctic baselines:
      - Maitri baseline:  ~-35°C temp, ~50 km/h wind
      - Bharati baseline: ~-24°C temp, ~41 km/h wind
    Does NOT flag baseline cold as critical.
    """
    score = 0.0
    factors: list[str] = []

    station = current_station or {}
    station_key = str(station.get("stationId", "")).lower()
    temp = _safe_float(station.get("temperature"), default=-30.0)
    wind = _safe_float(station.get("windSpeed"), default=30.0)

    # 1. Station-aware Temperature evaluation
    if station_key == "maitri":
        # Baseline ~ -35°C
        if temp < -50.0:
            score += 35.0
            factors.append(f"Severe extreme cold ({temp:.1f}°C) recorded at Maitri (< -50°C).")
        elif temp < -42.0:
            score += 20.0
            factors.append(f"Sub-baseline extreme cold ({temp:.1f}°C) recorded at Maitri.")
        elif temp < -38.0:
            score += 10.0
            factors.append(f"Elevated cold conditions ({temp:.1f}°C) below normal Maitri baseline.")
    elif station_key == "bharati":
        # Baseline ~ -24°C
        if temp < -40.0:
            score += 35.0
            factors.append(f"Severe extreme cold ({temp:.1f}°C) recorded at Bharati (< -40°C).")
        elif temp < -32.0:
            score += 20.0
            factors.append(f"Sub-baseline extreme cold ({temp:.1f}°C) recorded at Bharati.")
        elif temp < -28.0:
            score += 10.0
            factors.append(f"Elevated cold conditions ({temp:.1f}°C) below normal Bharati baseline.")
    else:
        # Generic fallback
        if temp < -50.0:
            score += 35.0
            factors.append(f"Severe extreme cold ({temp:.1f}°C).")
        elif temp < -40.0:
            score += 20.0
            factors.append(f"Sub-baseline cold ({temp:.1f}°C).")

    # 2. Temperature Trend from Forecast
    forecast_status = forecast.get("status") if isinstance(forecast, dict) else None
    temp_fc = (forecast.get("temperature") or {}) if isinstance(forecast, dict) else {}
    if forecast_status == "ACTIVE" and temp_fc:
        temp_trend = str(temp_fc.get("trend") or "").upper()
        if temp_trend == "DECREASING":
            score += 10.0
            factors.append("Ambient temperature trend indicates further cooling.")

    # 3. Wind Speed
    if wind >= 90.0:
        score += 40.0
        factors.append(f"Severe blizzard winds ({wind:.1f} km/h) threatening external operations.")
    elif wind >= 70.0:
        score += 25.0
        factors.append(f"High blizzard wind speed ({wind:.1f} km/h) recorded.")
    elif wind >= 55.0:
        score += 15.0
        factors.append(f"Gale-force wind conditions ({wind:.1f} km/h) impacting station structure.")

    # 4. Environmental Anomaly Evidence
    if isinstance(anomaly, dict) and anomaly.get("status") == "ACTIVE":
        anomaly_sev = str(anomaly.get("severity") or "NORMAL").upper()
        dev_factors = anomaly.get("topDeviationFactors") or []
        dev_features = [f.get("feature") for f in dev_factors if isinstance(f, dict)]
        if any(feat in ("temperature", "windSpeed", "pressure") for feat in dev_features):
            if anomaly_sev == "CRITICAL":
                score += 15.0
                factors.append("Significant anomaly detected across environmental sensor cluster.")
            elif anomaly_sev == "WARNING":
                score += 10.0
                factors.append("Unusual environmental telemetry flagged by anomaly detector.")

    clamped_score = int(round(min(100.0, max(0.0, score))))
    return {
        "level": risk_level_from_score(clamped_score),
        "score": clamped_score,
        "factors": factors,
    }


# ---------------------------------------------------------------------------
# TASK 5 - Infrastructure Risk Calculation
# ---------------------------------------------------------------------------
def calculate_infrastructure_risk(
    current_station: dict,
    anomaly: dict
) -> dict:
    """
    Calculate Infrastructure Risk score (0–100) and identify driving factors.
    Evidence:
      - IsolationForest multi-sensor anomaly severity (NORMAL: +0, WARNING: +35, CRITICAL: +75)
      - Generator load and operating status
      - Primary satellite communication link status
    """
    score = 0.0
    factors: list[str] = []

    station = current_station or {}

    # 1. Anomaly Intelligence Primary Evidence
    if isinstance(anomaly, dict) and anomaly.get("status") == "ACTIVE":
        severity = str(anomaly.get("severity") or "NORMAL").upper()
        if severity == "CRITICAL":
            # +75 directly ensures score >= 75 (CRITICAL risk level)
            score += 75.0
            factors.append("Multi-sensor anomaly detector flagged an operational CRITICAL state.")
        elif severity == "WARNING":
            score += 35.0
            factors.append("Multi-sensor anomaly detector flagged an operational WARNING state.")

    # 2. Generator Load & Status
    gen_status = str(station.get("generatorStatus") or "NORMAL").upper()
    if gen_status not in ("NORMAL", "ONLINE", "OK"):
        score += 15.0
        factors.append(f"Generator operating status is abnormal ({gen_status}).")

    gen_load = _safe_float(station.get("generatorLoad"), default=50.0)
    if gen_load >= 90.0:
        score += 20.0
        factors.append(f"Generator operating near peak load capacity ({gen_load:.1f}%).")
    elif gen_load >= 75.0:
        score += 10.0
        factors.append(f"Elevated generator load ({gen_load:.1f}%).")

    # 3. Communications Status
    comms = str(station.get("communicationStatus") or "ONLINE").upper()
    if "OFFLINE" in comms:
        score += 25.0
        factors.append("Primary satellite communication link is OFFLINE.")
    elif "DEGRADED" in comms:
        score += 15.0
        factors.append("Satellite communication link is operating in DEGRADED mode.")

    clamped_score = int(round(min(100.0, max(0.0, score))))
    return {
        "level": risk_level_from_score(clamped_score),
        "score": clamped_score,
        "factors": factors,
    }


# ---------------------------------------------------------------------------
# TASK 6 - Overall Risk Calculation
# ---------------------------------------------------------------------------
def calculate_overall_risk(
    energy_risk: dict,
    resource_risk: dict,
    environment_risk: dict,
    infrastructure_risk: dict
) -> tuple[str, float, Optional[str]]:
    """
    Calculate weighted overall risk score:
      Energy: 30%, Resources: 25%, Environment: 20%, Infrastructure: 25%

    Critical Safety Override:
      If any category is CRITICAL, overall risk level cannot be below HIGH
      (score escalated to at least 50.0).

    Returns
    -------
    (overall_level, overall_score, safety_escalation_note)
    """
    e_score = _safe_float((energy_risk or {}).get("score"))
    r_score = _safe_float((resource_risk or {}).get("score"))
    env_score = _safe_float((environment_risk or {}).get("score"))
    i_score = _safe_float((infrastructure_risk or {}).get("score"))

    weighted_score = round(
        (e_score * WEIGHT_ENERGY) +
        (r_score * WEIGHT_RESOURCES) +
        (env_score * WEIGHT_ENVIRONMENT) +
        (i_score * WEIGHT_INFRASTRUCTURE),
        1
    )

    clamped_score = float(min(100.0, max(0.0, weighted_score)))
    overall_level = risk_level_from_score(clamped_score)
    safety_escalation_note: Optional[str] = None

    # Check for Critical Safety Override
    categories = [
        ("Energy", (energy_risk or {}).get("level")),
        ("Resource", (resource_risk or {}).get("level")),
        ("Environmental", (environment_risk or {}).get("level")),
        ("Infrastructure", (infrastructure_risk or {}).get("level")),
    ]
    critical_cats = [name for name, level in categories if str(level or "").upper() == "CRITICAL"]

    if critical_cats:
        cat_names = ", ".join(critical_cats)
        if clamped_score < SCORE_HIGH:
            clamped_score = float(SCORE_HIGH)
            overall_level = "HIGH"
            safety_escalation_note = f"Critical {cat_names} risk triggered an operational safety escalation."
        elif overall_level in ("LOW", "MEDIUM"):
            overall_level = "HIGH"
            safety_escalation_note = f"Critical {cat_names} risk triggered an operational safety escalation."

    return overall_level, clamped_score, safety_escalation_note


# ---------------------------------------------------------------------------
# TASK 7 - Explainable Summary Generation
# ---------------------------------------------------------------------------
def generate_summary(
    overall_level: str,
    risk_categories: dict,
    safety_escalation_note: Optional[str] = None
) -> str:
    """
    Generate an explainable summary explaining the risk level and the top driver.
    """
    cats = risk_categories or {}
    cat_scores = {
        "energy": _safe_float((cats.get("energy") or {}).get("score")),
        "resource": _safe_float((cats.get("resources") or {}).get("score")),
        "environment": _safe_float((cats.get("environment") or {}).get("score")),
        "infrastructure": _safe_float((cats.get("infrastructure") or {}).get("score")),
    }
    top_cat, top_score = max(cat_scores.items(), key=lambda item: item[1])

    cat_labels = {
        "energy": "electrical energy and battery reserves",
        "resource": "diesel fuel and station autonomy",
        "environment": "ambient weather and wind conditions",
        "infrastructure": "multi-sensor equipment and system diagnostics",
    }
    driver_text = cat_labels.get(top_cat, "station subsystems")

    if overall_level == "CRITICAL":
        base = f"Critical operational risk indicators require immediate operational attention (primary driver: {driver_text})."
    elif overall_level == "HIGH":
        base = f"Multiple operational indicators suggest elevated risk (primary driver: {driver_text}) requiring preventive action."
    elif overall_level == "MEDIUM":
        base = f"Moderate operational risks have been identified (primary driver: {driver_text}) and should be monitored proactively."
    else:
        base = "Operational conditions are currently stable with no major predictive risks detected."

    if safety_escalation_note:
        return f"{base} {safety_escalation_note}"
    return base


# ---------------------------------------------------------------------------
# TASK 8 - Recommended Actions Generation
# ---------------------------------------------------------------------------
def generate_recommendations(
    overall_risk: str,
    risk_categories: dict,
    current_station: dict,
    forecast: dict,
    anomaly: dict
) -> list[dict]:
    """
    Generate prioritized, evidence-based operational recommendations.
    Sorted by severity tier (CRITICAL -> HIGH -> MEDIUM -> LOW).
    """
    actions_pool: list[tuple[int, str, str, str]] = []  # (priority_tier, category, action, reason)

    station = current_station or {}
    fc = forecast or {}
    anom = anomaly or {}

    # 1. Energy Actions
    battery = _safe_float(station.get("battery"), 100.0)
    batt_fc = (fc.get("battery") or {}) if isinstance(fc, dict) else {}
    f_batt = _safe_float(batt_fc.get("forecast"), 100.0) if batt_fc.get("forecast") is not None else 100.0
    power_fc = (fc.get("powerConsumption") or {}) if isinstance(fc, dict) else {}

    if battery < 20.0 or f_batt < 15.0:
        actions_pool.append((
            1,
            "ENERGY",
            "Execute emergency power-shedding and disconnect non-essential loads immediately.",
            "Battery reserves are critically depleted or forecast to breach emergency floor (<15%) within 24 hours."
        ))
    elif battery < 35.0 or f_batt < 30.0 or batt_fc.get("trend") == "DECREASING":
        actions_pool.append((
            2,
            "ENERGY",
            "Reduce non-essential electrical loads and optimize station thermal heating.",
            "Battery reserves are forecast to decline over the next 24 hours."
        ))

    if power_fc.get("trend") == "INCREASING":
        actions_pool.append((
            3,
            "ENERGY",
            "Review generator efficiency and electrical load distribution.",
            "Station power consumption is exhibiting an upward trend."
        ))

    # 2. Resource Actions
    fuel = _safe_float(station.get("fuel"), 100.0)
    fuel_fc = (fc.get("fuel") or {}) if isinstance(fc, dict) else {}
    autonomy = fuel_fc.get("estimatedAutonomyHours")

    if (autonomy is not None and _safe_float(autonomy) < 24.0) or fuel < 15.0:
        actions_pool.append((
            1,
            "RESOURCES",
            "Initiate emergency fuel conservation and prioritize critical life-support systems.",
            "Fuel reserves are critically low or projected autonomy is less than 24 hours."
        ))
    elif (autonomy is not None and _safe_float(autonomy) < 72.0) or fuel < 30.0 or fuel_fc.get("trend") == "DECREASING":
        actions_pool.append((
            2,
            "RESOURCES",
            "Review fuel consumption and begin fuel logistics contingency planning.",
            "Fuel reserves show active depletion with limited estimated autonomy."
        ))
    elif (autonomy is not None and _safe_float(autonomy) < 168.0) or fuel < 50.0:
        actions_pool.append((
            3,
            "RESOURCES",
            "Monitor fuel autonomy more frequently and plan refueling dispatch.",
            "Fuel reserves require proactive monitoring to maintain seasonal autonomy."
        ))

    water = _safe_float(station.get("water"), 100.0)
    if water < 20.0:
        actions_pool.append((
            1,
            "RESOURCES",
            "Switch to auxiliary water recycling protocols immediately.",
            "Potable water reserve has dropped below the 20% critical threshold."
        ))

    # 3. Environment Actions
    wind = _safe_float(station.get("windSpeed"), 0.0)
    temp = _safe_float(station.get("temperature"), -30.0)
    station_key = str(station.get("stationId", "")).lower()
    temp_fc = (fc.get("temperature") or {}) if isinstance(fc, dict) else {}

    if wind >= 90.0:
        actions_pool.append((
            1,
            "ENVIRONMENT",
            "Suspend all external vehicular travel and outdoor scientific activities.",
            "Severe blizzard winds (>=90 km/h) present an acute hazard to personnel."
        ))
    elif wind >= 70.0 or (station_key == "maitri" and temp < -45.0) or (station_key == "bharati" and temp < -35.0):
        actions_pool.append((
            2,
            "ENVIRONMENT",
            "Prepare station systems and secure external equipment for blizzard conditions.",
            "Extreme weather telemetry exceeds standard baseline operational thresholds."
        ))
    elif wind >= 55.0 or (temp_fc.get("trend") == "DECREASING"):
        actions_pool.append((
            3,
            "ENVIRONMENT",
            "Increase environmental monitoring frequency and review wind-sensitive external operations.",
            "Gale-force winds or decreasing temperature trend detected."
        ))

    # 4. Infrastructure Actions
    anomaly_sev = str(anom.get("severity") or "NORMAL").upper() if isinstance(anom, dict) else "NORMAL"
    gen_load = _safe_float(station.get("generatorLoad"), 50.0)
    gen_status = str(station.get("generatorStatus") or "NORMAL").upper()
    comms = str(station.get("communicationStatus") or "ONLINE").upper()

    if anomaly_sev == "CRITICAL":
        actions_pool.append((
            1,
            "INFRASTRUCTURE",
            "Investigate abnormal multi-sensor operational pattern immediately.",
            "IsolationForest detected a significant statistical deviation across station sensors."
        ))
    elif anomaly_sev == "WARNING":
        actions_pool.append((
            3,
            "INFRASTRUCTURE",
            "Increase diagnostic telemetry monitoring for unusual sensor behaviour.",
            "Multi-sensor anomaly detection flagged an operational WARNING state."
        ))

    if gen_load >= 90.0 or gen_status not in ("NORMAL", "ONLINE", "OK"):
        actions_pool.append((
            2,
            "INFRASTRUCTURE",
            "Inspect generator and balance electrical distribution loads.",
            "Generator is operating near peak load capacity or indicates abnormal status."
        ))

    if "OFFLINE" in comms:
        actions_pool.append((
            2,
            "INFRASTRUCTURE",
            "Verify backup communication link and run satellite transceiver diagnostics.",
            "Primary communication telemetry indicates OFFLINE status."
        ))
    elif "DEGRADED" in comms:
        actions_pool.append((
            3,
            "INFRASTRUCTURE",
            "Schedule diagnostic test of satellite terminal RF link.",
            "Communication telemetry reports degraded signal transmission."
        ))

    # Deduplicate actions by action string
    seen_actions = set()
    deduped_actions: list[tuple[int, str, str, str]] = []
    for tier, cat, act, rsn in actions_pool:
        if act not in seen_actions:
            seen_actions.add(act)
            deduped_actions.append((tier, cat, act, rsn))

    # Sort by priority tier (1 = CRITICAL, 2 = HIGH, 3 = MEDIUM)
    deduped_actions.sort(key=lambda x: x[0])

    # If no actions were triggered (healthy nominal state), provide default action
    if not deduped_actions:
        return [
            {
                "priority": 1,
                "category": "MONITORING",
                "action": "Continue normal operations and routine monitoring.",
                "reason": "No major operational risks are currently indicated by the available telemetry intelligence."
            }
        ]

    # Format result with sequential priorities 1, 2, 3...
    formatted_recs = []
    for idx, (_, cat, act, rsn) in enumerate(deduped_actions, start=1):
        formatted_recs.append({
            "priority": idx,
            "category": cat,
            "action": act,
            "reason": rsn,
        })

    return formatted_recs


# ---------------------------------------------------------------------------
# TASK 9 - Public Entry Point
# ---------------------------------------------------------------------------
def evaluate_station_decision(
    station_id: str,
    current_station: dict,
    history: list[dict],
    anomaly_result: dict,
    forecast_result: dict
) -> dict:
    """
    Main evaluation pipeline for the station decision engine.

    Returns
    -------
    dict (clean, JSON-serializable):
      - Either LEARNING response (if anomaly or forecasting is not ready)
      - Or ACTIVE decision intelligence response with all categories and recommendations
    """
    norm_station = str(station_id).lower()

    # 1. Check upstream intelligence readiness
    anomaly_status = str((anomaly_result or {}).get("status") or "LEARNING").upper() if isinstance(anomaly_result, dict) else "LEARNING"
    forecast_status = str((forecast_result or {}).get("status") or "LEARNING").upper() if isinstance(forecast_result, dict) else "LEARNING"

    if anomaly_status != "ACTIVE" or forecast_status != "ACTIVE":
        return _sanitize_for_json({
            "station": norm_station,
            "status": "LEARNING",
            "message": "Operational intelligence is collecting sufficient telemetry data before generating risk assessments.",
            "anomalyStatus": anomaly_status,
            "forecastStatus": forecast_status,
        })

    # 2. Evaluate Categories
    energy_risk = calculate_energy_risk(current_station, forecast_result, anomaly_result)
    resource_risk = calculate_resource_risk(current_station, forecast_result)
    environment_risk = calculate_environment_risk(current_station, forecast_result, anomaly_result)
    infrastructure_risk = calculate_infrastructure_risk(current_station, anomaly_result)

    risk_categories = {
        "energy": energy_risk,
        "resources": resource_risk,
        "environment": environment_risk,
        "infrastructure": infrastructure_risk,
    }

    # 3. Calculate Overall Weighted Risk with Safety Escalation
    overall_level, overall_score, safety_escalation_note = calculate_overall_risk(
        energy_risk, resource_risk, environment_risk, infrastructure_risk
    )

    # 4. Generate Explainable Summary
    summary = generate_summary(overall_level, risk_categories, safety_escalation_note)

    # 5. Generate Evidence-Based Recommendations
    recommended_actions = generate_recommendations(
        overall_level, risk_categories, current_station, forecast_result, anomaly_result
    )

    # 6. Map Priority
    priority_map = {
        "CRITICAL": "P1 - CRITICAL",
        "HIGH": "P2 - HIGH",
        "MEDIUM": "P3 - MEDIUM",
        "LOW": "P4 - ROUTINE",
    }
    priority = priority_map.get(overall_level, "P4 - ROUTINE")

    response = {
        "station": norm_station,
        "status": "ACTIVE",
        "overallRisk": overall_level,
        "riskScore": overall_score,
        "priority": priority,
        "summary": summary,
        "riskCategories": risk_categories,
        "recommendedActions": recommended_actions,
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    return _sanitize_for_json(response)

