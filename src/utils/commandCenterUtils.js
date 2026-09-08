/**
 * commandCenterUtils.js
 * =======================
 * Pure data transformation and intelligence aggregation utilities for the
 * Antarctic Indian Polar Digital Twin (AIP-DT) Unified Command Center.
 *
 * Design constraints:
 *   - Pure functions ONLY (no hooks, no fetch, no side-effects).
 *   - Strict numeric & null safety (no NaN, no Infinity).
 *   - Preserves LOADING and LEARNING states honestly without fabricating intelligence.
 *   - Completely station-independent data structures.
 */

// ---------------------------------------------------------------------------
// 1. Safe Numeric Helper
// ---------------------------------------------------------------------------
export function toSafeNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const num = Number(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return fallback;
  }
  return num;
}

// ---------------------------------------------------------------------------
// 2. Risk Level Weight (For comparison/sorting only)
// ---------------------------------------------------------------------------
export function getRiskWeight(level) {
  if (!level || typeof level !== 'string') return 0;
  const norm = level.trim().toUpperCase();
  switch (norm) {
    case 'CRITICAL':
      return 4;
    case 'HIGH':
      return 3;
    case 'MEDIUM':
      return 2;
    case 'LOW':
      return 1;
    default:
      return 0;
  }
}

// ---------------------------------------------------------------------------
// 3. Priority Weight (For comparison/sorting only, lower is more urgent)
// ---------------------------------------------------------------------------
export function getPriorityWeight(priority) {
  if (!priority) return 99;
  const str = String(priority).trim().toUpperCase();
  const match = str.match(/P?(\d)/);
  if (match) {
    const p = parseInt(match[1], 10);
    if (p >= 1 && p <= 4) {
      return p;
    }
  }
  return 99;
}

// ---------------------------------------------------------------------------
// 4. Calculate Station Readiness
// ---------------------------------------------------------------------------
export function calculateStationReadiness({ telemetry, anomaly, forecast, decision } = {}) {
  const telemetryReady = Boolean(
    telemetry && (
      telemetry.temperature !== undefined ||
      telemetry.battery !== undefined ||
      telemetry.status !== undefined
    )
  );
  const anomalyReady = Boolean(anomaly && anomaly.status === 'ACTIVE');
  const forecastReady = Boolean(forecast && forecast.status === 'ACTIVE');
  const decisionReady = Boolean(decision && decision.status === 'ACTIVE');

  let points = 0;
  if (telemetryReady) points += 25;
  if (anomalyReady) points += 25;
  if (forecastReady) points += 25;
  if (decisionReady) points += 25;

  const intelligenceReadinessPercent = Math.min(100, Math.max(0, points));

  return {
    telemetryReady,
    anomalyReady,
    forecastReady,
    decisionReady,
    intelligenceReadinessPercent,
  };
}

// ---------------------------------------------------------------------------
// 5. Build Station Command Summary
// ---------------------------------------------------------------------------
export function buildStationCommandSummary({
  stationId,
  telemetry,
  anomaly,
  forecast,
  decision,
} = {}) {
  const normId = String(stationId || telemetry?.stationId || 'unknown').toLowerCase();
  const stationName =
    telemetry?.stationName ||
    (normId.charAt(0).toUpperCase() + normId.slice(1));

  // 1. Telemetry normalization
  const normTelemetry = {
    status: telemetry?.status || 'UNKNOWN',
    battery: telemetry?.battery !== undefined && telemetry?.battery !== null ? toSafeNumber(telemetry.battery, null) : null,
    fuel: telemetry?.fuel !== undefined && telemetry?.fuel !== null ? toSafeNumber(telemetry.fuel, null) : null,
    powerConsumption: telemetry?.powerConsumption !== undefined && telemetry?.powerConsumption !== null ? toSafeNumber(telemetry.powerConsumption, null) : null,
    temperature: telemetry?.temperature !== undefined && telemetry?.temperature !== null ? toSafeNumber(telemetry.temperature, null) : null,
    windSpeed: telemetry?.windSpeed !== undefined && telemetry?.windSpeed !== null ? toSafeNumber(telemetry.windSpeed, null) : null,
  };

  // 2. Anomaly normalization
  const normAnomaly = {
    status: anomaly?.status || 'LOADING',
    severity: anomaly?.severity || (anomaly?.status === 'ACTIVE' ? 'NORMAL' : null),
    anomalyScore: anomaly?.anomalyScore !== undefined && anomaly?.anomalyScore !== null ? toSafeNumber(anomaly.anomalyScore, null) : null,
    isAnomaly: Boolean(anomaly?.isAnomaly),
  };

  // 3. Forecast normalization
  const normForecast = {
    status: forecast?.status || 'LOADING',
    batteryTrend: forecast?.battery?.trend || null,
    batteryForecast: forecast?.battery?.forecast !== undefined && forecast?.battery?.forecast !== null ? toSafeNumber(forecast.battery.forecast, null) : null,
    fuelTrend: forecast?.fuel?.trend || null,
    fuelForecast: forecast?.fuel?.forecast !== undefined && forecast?.fuel?.forecast !== null ? toSafeNumber(forecast.fuel.forecast, null) : null,
    estimatedAutonomyHours: forecast?.fuel?.estimatedAutonomyHours !== undefined && forecast?.fuel?.estimatedAutonomyHours !== null ? toSafeNumber(forecast.fuel.estimatedAutonomyHours, null) : null,
    powerTrend: forecast?.powerConsumption?.trend || null,
    powerForecast: forecast?.powerConsumption?.forecast !== undefined && forecast?.powerConsumption?.forecast !== null ? toSafeNumber(forecast.powerConsumption.forecast, null) : null,
    temperatureTrend: forecast?.temperature?.trend || null,
    temperatureForecast: forecast?.temperature?.forecast !== undefined && forecast?.temperature?.forecast !== null ? toSafeNumber(forecast.temperature.forecast, null) : null,
  };

  // 4. Decision normalization
  const normDecision = {
    status: decision?.status || 'LOADING',
    overallRisk: decision?.overallRisk || null,
    riskScore: decision?.riskScore !== undefined && decision?.riskScore !== null ? toSafeNumber(decision.riskScore, null) : null,
    priority: decision?.priority || null,
    summary: decision?.summary || null,
    recommendedActions: Array.isArray(decision?.recommendedActions) ? decision.recommendedActions : [],
  };

  // 5. Readiness
  const readiness = calculateStationReadiness({
    telemetry,
    anomaly,
    forecast,
    decision,
  });

  return {
    stationId: normId,
    stationName,
    telemetry: normTelemetry,
    anomaly: normAnomaly,
    forecast: normForecast,
    decision: normDecision,
    readiness,
  };
}

// ---------------------------------------------------------------------------
// 6. Determine Highest Priority Station
// ---------------------------------------------------------------------------
export function getHighestPriorityStation(stations) {
  if (!Array.isArray(stations) || stations.length === 0) {
    return null;
  }

  // Only consider stations with ACTIVE decision intelligence
  const activeStations = stations.filter(
    (s) => s && s.decision && s.decision.status === 'ACTIVE' && s.decision.riskScore !== null
  );

  if (activeStations.length === 0) {
    return null;
  }

  if (activeStations.length === 1) {
    return activeStations[0];
  }

  // Sort by priority criteria:
  // 1. Primary: Highest decision riskScore (descending)
  // 2. Secondary: Higher overallRisk severity weight (descending)
  // 3. Tertiary: Lower priority weight (ascending: P1 < P2)
  const sorted = [...activeStations].sort((a, b) => {
    const scoreDiff = toSafeNumber(b.decision.riskScore, 0) - toSafeNumber(a.decision.riskScore, 0);
    if (Math.abs(scoreDiff) > 0.001) {
      return scoreDiff;
    }

    const weightDiff = getRiskWeight(b.decision.overallRisk) - getRiskWeight(a.decision.overallRisk);
    if (weightDiff !== 0) {
      return weightDiff;
    }

    const priorityDiff = getPriorityWeight(a.decision.priority) - getPriorityWeight(b.decision.priority);
    return priorityDiff;
  });

  return sorted[0];
}

// ---------------------------------------------------------------------------
// 7. Build Cross-Station Comparison
// ---------------------------------------------------------------------------
export function buildCrossStationComparison(maitri, bharati) {
  if (!maitri && !bharati) {
    return null;
  }

  const mTel = maitri?.telemetry || {};
  const bTel = bharati?.telemetry || {};

  // Battery comparison (lower is more constrained)
  let battery = null;
  if (mTel.battery !== null && mTel.battery !== undefined && bTel.battery !== null && bTel.battery !== undefined) {
    const mVal = toSafeNumber(mTel.battery);
    const bVal = toSafeNumber(bTel.battery);
    const diff = Math.round(Math.abs(mVal - bVal) * 10) / 10;
    battery = {
      maitri: mVal,
      bharati: bVal,
      difference: diff,
      lowerStation: mVal < bVal ? 'maitri' : bVal < mVal ? 'bharati' : 'equal',
    };
  }

  // Fuel comparison (lower is more constrained)
  let fuel = null;
  if (mTel.fuel !== null && mTel.fuel !== undefined && bTel.fuel !== null && bTel.fuel !== undefined) {
    const mVal = toSafeNumber(mTel.fuel);
    const bVal = toSafeNumber(bTel.fuel);
    const diff = Math.round(Math.abs(mVal - bVal) * 10) / 10;
    fuel = {
      maitri: mVal,
      bharati: bVal,
      difference: diff,
      lowerStation: mVal < bVal ? 'maitri' : bVal < mVal ? 'bharati' : 'equal',
    };
  }

  // Power Consumption comparison (higher is more loaded)
  let powerConsumption = null;
  if (
    mTel.powerConsumption !== null &&
    mTel.powerConsumption !== undefined &&
    bTel.powerConsumption !== null &&
    bTel.powerConsumption !== undefined
  ) {
    const mVal = toSafeNumber(mTel.powerConsumption);
    const bVal = toSafeNumber(bTel.powerConsumption);
    const diff = Math.round(Math.abs(mVal - bVal) * 10) / 10;
    powerConsumption = {
      maitri: mVal,
      bharati: bVal,
      difference: diff,
      higherStation: mVal > bVal ? 'maitri' : bVal > mVal ? 'bharati' : 'equal',
    };
  }

  // Overall Risk comparison (higher severity weight is riskier)
  let overallRisk = null;
  const mRisk = maitri?.decision?.overallRisk || null;
  const bRisk = bharati?.decision?.overallRisk || null;
  if (mRisk || bRisk) {
    const mWeight = getRiskWeight(mRisk);
    const bWeight = getRiskWeight(bRisk);
    overallRisk = {
      maitri: mRisk,
      bharati: bRisk,
      higherRiskStation: mWeight > bWeight ? 'maitri' : bWeight > mWeight ? 'bharati' : 'equal',
    };
  }

  return {
    battery,
    fuel,
    powerConsumption,
    overallRisk,
  };
}

// ---------------------------------------------------------------------------
// 8. Build Unified Command Summary
// ---------------------------------------------------------------------------
export function buildUnifiedCommandSummary(maitriSummary, bharatiSummary) {
  const stations = [maitriSummary, bharatiSummary].filter(Boolean);

  const highestPriorityStation = getHighestPriorityStation(stations);
  const crossStationComparison = buildCrossStationComparison(maitriSummary, bharatiSummary);

  let activeDecisionCount = 0;
  let activeForecastCount = 0;
  let activeAnomalyCount = 0;
  let totalReadiness = 0;

  stations.forEach((st) => {
    if (st.decision?.status === 'ACTIVE') activeDecisionCount += 1;
    if (st.forecast?.status === 'ACTIVE') activeForecastCount += 1;
    if (st.anomaly?.status === 'ACTIVE') activeAnomalyCount += 1;
    totalReadiness += toSafeNumber(st.readiness?.intelligenceReadinessPercent, 0);
  });

  const averageReadinessPercent = stations.length > 0 ? Math.round(totalReadiness / stations.length) : 0;

  return {
    stations,
    highestPriorityStation,
    crossStationComparison,
    totalStations: stations.length,
    activeDecisionEngines: activeDecisionCount,
    activeForecastEngines: activeForecastCount,
    activeAnomalyEngines: activeAnomalyCount,
    averageReadinessPercent,
  };
}
