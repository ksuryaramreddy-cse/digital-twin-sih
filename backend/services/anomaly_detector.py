"""
anomaly_detector.py
===================
Multi-sensor anomaly detection for AIP-DT stations.

Pipeline per station
--------------------
  Rolling TELEMETRY_HISTORY (deque)
       ↓
  Feature extraction  (FEATURE_COLUMNS, NaN-safe)
       ↓
  StandardScaler       (zero-mean, unit-variance)
       ↓
  IsolationForest      (unsupervised, contamination=0.05)
       ↓
  Anomaly score 0-100  (deterministic linear transform of model decision_function)
       ↓
  Severity label       (NORMAL / WARNING / CRITICAL)
       ↓
  Top deviation factors (per-feature z-score deviation from historical mean)

Design decisions
----------------
* Stations are ALWAYS analysed independently - never pool Maitri + Bharati data.
* Minimum 30 samples are required before the model activates (LEARNING phase).
* IsolationForest is retrained from the full rolling history on every request.
  At ≤500 samples this takes < 50 ms and avoids stale-model problems.
* random_state=42 everywhere for reproducibility.
* All NumPy scalar types are converted to plain Python floats/ints/bools before
  being returned so FastAPI can serialise them without error.
"""

from __future__ import annotations

import math
from typing import Any

import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Numeric telemetry fields used as model features.
# Only these fields are extracted; any snapshot missing all of them is dropped.
FEATURE_COLUMNS: list[str] = [
    "temperature",
    "windSpeed",
    "humidity",
    "pressure",
    "battery",
    "fuel",
    "water",
    "powerConsumption",
    "generatorLoad",
]

# Minimum history length before the model is considered usable.
MINIMUM_SAMPLES: int = 30

# IsolationForest contamination: expected proportion of anomalies in normal data.
# 0.05 = assume 5 % of historical readings are outliers (conservative, safe).
CONTAMINATION: float = 0.05

# Anomaly score boundaries for severity classification.
# These operate on the 0-100 normalised score produced by _raw_to_score().
# IsolationForest.decision_function returns higher values for inliers,
# so after inversion: score 0 = most normal, 100 = most anomalous.
SCORE_WARNING_THRESHOLD: float = 55.0   # ≥55  → WARNING
SCORE_CRITICAL_THRESHOLD: float = 75.0  # ≥75  → CRITICAL

# Number of top deviation factors to include in the explanation.
TOP_N_FACTORS: int = 3


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _extract_feature_matrix(history: list[dict]) -> tuple[np.ndarray, list[str]]:
    """
    Convert a list of telemetry snapshots into a 2-D numpy feature matrix.

    Returns
    -------
    X : ndarray of shape (n_valid_samples, n_features)
        Rows where ALL selected columns are numeric are kept.
        Rows with any NaN are dropped.
    available_cols : list[str]
        The feature columns that were actually present and used.
    """
    rows: list[list[float]] = []
    available_cols: list[str] = []

    # Determine which columns are actually present in at least one snapshot
    present = {col for snap in history for col in snap if col in FEATURE_COLUMNS}
    available_cols = [c for c in FEATURE_COLUMNS if c in present]

    if not available_cols:
        return np.empty((0, 0)), available_cols

    for snap in history:
        row: list[float] = []
        valid = True
        for col in available_cols:
            val = snap.get(col)
            if val is None or not isinstance(val, (int, float)) or math.isnan(val):
                valid = False
                break
            row.append(float(val))
        if valid:
            rows.append(row)

    if not rows:
        return np.empty((0, len(available_cols))), available_cols

    return np.array(rows, dtype=np.float64), available_cols


def _raw_to_score(decision_value: float, history_scores: np.ndarray) -> float:
    """
    Convert a single IsolationForest decision_function value to a 0-100 anomaly score.

    IsolationForest.decision_function:
      • Positive  → more normal (inlier)
      • Negative  → more anomalous (outlier)
      Typical range on standardised data: roughly [-0.5, 0.5]

    Conversion:
      1. Collect all decision scores across the training set.
      2. Define score_range = max - min of those scores.
      3. Normalise so that the most normal historical point → 0
         and the most anomalous → 100.
      4. Clamp to [0, 100].

    This is fully deterministic: same history + same model → same score.
    """
    if len(history_scores) == 0 or history_scores.max() == history_scores.min():
        # Degenerate case: all points score identically
        return 0.0

    lo = float(history_scores.min())
    hi = float(history_scores.max())

    # Invert: high decision_function → low anomaly score
    normalised = (hi - float(decision_value)) / (hi - lo) * 100.0
    return float(np.clip(normalised, 0.0, 100.0))


def _severity_from_score(score: float, is_anomaly: bool) -> str:
    """
    Map a normalised 0-100 anomaly score + IsolationForest prediction to severity.

    IsolationForest.predict returns -1 (anomaly) or +1 (inlier).
    We use both the continuous score AND the binary prediction:
      • If the model says inlier (+1), cap at WARNING regardless of score.
      • If the model says anomaly (-1):
          score ≥ CRITICAL_THRESHOLD → CRITICAL
          score ≥ WARNING_THRESHOLD  → WARNING
          (below warning but still flagged) → WARNING
    """
    if not is_anomaly:
        # Model says inlier - NORMAL unless score is high (borderline)
        if score >= SCORE_CRITICAL_THRESHOLD:
            return "WARNING"   # score elevated but model says inlier → cautious
        return "NORMAL"

    # Model says anomaly
    if score >= SCORE_CRITICAL_THRESHOLD:
        return "CRITICAL"
    return "WARNING"


def _top_deviation_factors(
    latest: dict,
    history: list[dict],
    available_cols: list[str],
) -> list[dict[str, Any]]:
    """
    Identify which features deviate most from their historical baseline.

    Method: z-score  |  deviation = |current - mean| / std
    This is purely a statistical explanation - it does NOT claim that
    IsolationForest itself ranks feature importance.

    Returns the top-N features sorted by absolute deviation (descending).
    """
    factors: list[dict[str, Any]] = []

    for col in available_cols:
        current_val = latest.get(col)
        if current_val is None or not isinstance(current_val, (int, float)):
            continue

        historical_vals = []
        for snap in history:
            v = snap.get(col)
            if v is not None and isinstance(v, (int, float)) and not math.isnan(v):
                historical_vals.append(float(v))

        if len(historical_vals) < 2:
            continue

        arr = np.array(historical_vals, dtype=np.float64)
        mean = float(arr.mean())
        std = float(arr.std())

        if std < 1e-9:
            deviation = 0.0
        else:
            deviation = abs(float(current_val) - mean) / std

        factors.append({
            "feature":         col,
            "currentValue":    round(float(current_val), 3),
            "baselineAverage": round(mean, 3),
            "deviation":       round(deviation, 3),
        })

    # Sort by deviation descending, return top N
    factors.sort(key=lambda x: x["deviation"], reverse=True)
    return factors[:TOP_N_FACTORS]


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_anomaly_detection(
    station_id: str,
    history: list[dict],
    latest_snapshot: dict,
) -> dict[str, Any]:
    """
    Run IsolationForest anomaly detection for a single station.

    Parameters
    ----------
    station_id       : str   - "maitri" or "bharati"
    history          : list  - all telemetry snapshots from TELEMETRY_HISTORY
    latest_snapshot  : dict  - the most recent telemetry snapshot to evaluate

    Returns
    -------
    dict - fully JSON-serialisable response (all NumPy types converted).
    """
    # ------------------------------------------------------------------
    # 1. Extract feature matrix from history
    # ------------------------------------------------------------------
    X, available_cols = _extract_feature_matrix(history)
    n_samples = X.shape[0] if X.ndim == 2 else 0

    # ------------------------------------------------------------------
    # 2. LEARNING phase - not enough data yet
    # ------------------------------------------------------------------
    if n_samples < MINIMUM_SAMPLES:
        return {
            "station":                 station_id,
            "status":                  "LEARNING",
            "samplesUsed":             int(n_samples),
            "minimumSamplesRequired":  MINIMUM_SAMPLES,
            "message":                 "Collecting telemetry to establish operational baseline",
        }

    # ------------------------------------------------------------------
    # 3. Scale features - StandardScaler so no single high-range sensor
    #    (e.g. pressure ~980) dominates the distance computation.
    # ------------------------------------------------------------------
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # ------------------------------------------------------------------
    # 4. Train IsolationForest on this station's rolling history.
    #    contamination=0.05 means the model expects 5 % of points to be
    #    anomalous; random_state=42 ensures reproducibility.
    # ------------------------------------------------------------------
    clf = IsolationForest(
        n_estimators=100,
        contamination=CONTAMINATION,
        random_state=42,
        n_jobs=1,
    )
    clf.fit(X_scaled)

    # ------------------------------------------------------------------
    # 5. Build the feature vector for the latest snapshot.
    #    Use the same available_cols identified from history.
    # ------------------------------------------------------------------
    latest_row: list[float] = []
    for col in available_cols:
        val = latest_snapshot.get(col)
        if val is None or not isinstance(val, (int, float)) or math.isnan(val):
            # Fall back to the historical mean for this feature
            col_idx = available_cols.index(col)
            val = float(X[:, col_idx].mean())
        latest_row.append(float(val))

    latest_vec = np.array([latest_row], dtype=np.float64)
    latest_scaled = scaler.transform(latest_vec)

    # ------------------------------------------------------------------
    # 6. Score the latest snapshot.
    #    decision_function: higher = more normal, lower = more anomalous.
    #    predict:           +1 = inlier, -1 = outlier (anomaly).
    # ------------------------------------------------------------------
    # Compute decision scores across the full training set for normalisation
    train_decision_scores = clf.decision_function(X_scaled)          # shape (n,)
    latest_decision_score = float(clf.decision_function(latest_scaled)[0])
    latest_prediction = int(clf.predict(latest_scaled)[0])           # +1 or -1

    is_anomaly: bool = (latest_prediction == -1)

    # Normalise to 0-100 (0 = perfectly normal, 100 = maximally anomalous)
    anomaly_score: float = round(
        _raw_to_score(latest_decision_score, train_decision_scores), 2
    )

    # ------------------------------------------------------------------
    # 7. Derive severity
    # ------------------------------------------------------------------
    severity: str = _severity_from_score(anomaly_score, is_anomaly)

    # ------------------------------------------------------------------
    # 8. Compute top deviation factors (statistical explanation)
    # ------------------------------------------------------------------
    top_factors = _top_deviation_factors(latest_snapshot, history, available_cols)

    # ------------------------------------------------------------------
    # 9. Build response - ensure all values are plain Python types
    # ------------------------------------------------------------------
    message = (
        "Unusual multi-sensor operational pattern detected"
        if is_anomaly
        else "Station operating within learned baseline"
    )

    return {
        "station":              station_id,
        "status":               "ACTIVE",
        "isAnomaly":            bool(is_anomaly),
        "severity":             severity,
        "anomalyScore":         float(anomaly_score),
        "samplesUsed":          int(n_samples),
        "featuresUsed":         available_cols,
        "model":                "IsolationForest",
        "contamination":        float(CONTAMINATION),
        "message":              message,
        "topDeviationFactors":  top_factors,
    }

