/**
 * test_phase6a.mjs
 * ==================
 * Automated test suite for Phase 6A: Unified Command Center Data Integration.
 *
 * Runs with node: node test_phase6a.mjs
 */

import assert from 'node:assert';
import {
  toSafeNumber,
  getRiskWeight,
  getPriorityWeight,
  calculateStationReadiness,
  buildStationCommandSummary,
  getHighestPriorityStation,
  buildCrossStationComparison,
  buildUnifiedCommandSummary,
} from './src/utils/commandCenterUtils.js';

console.log('--- STARTING PHASE 6A TEST SUITE ---');

// ---------------------------------------------------------------------------
// TEST 2: Maitri Summary Mapping
// ---------------------------------------------------------------------------
console.log('Running Test 2: Maitri Summary Mapping...');
const mockMaitriTelemetry = {
  stationId: 'maitri',
  stationName: 'Maitri',
  status: 'ONLINE',
  battery: 63.4,
  fuel: 71.2,
  powerConsumption: 46.1,
  temperature: -35.2,
  windSpeed: 42.0,
};
const mockMaitriAnomaly = {
  status: 'ACTIVE',
  severity: 'NORMAL',
  anomalyScore: 18.5,
  isAnomaly: false,
};
const mockMaitriForecast = {
  status: 'ACTIVE',
  battery: { trend: 'STABLE', forecast: 62.1 },
  fuel: { trend: 'DECREASING', forecast: 68.2, estimatedAutonomyHours: 170.5 },
  powerConsumption: { trend: 'INCREASING', forecast: 51.4 },
  temperature: { trend: 'STABLE', forecast: -34.8 },
};
const mockMaitriDecision = {
  status: 'ACTIVE',
  overallRisk: 'LOW',
  riskScore: 14.5,
  priority: 'P4 - ROUTINE',
  summary: 'Operational conditions stable.',
  recommendedActions: [],
};

const maitriSummary = buildStationCommandSummary({
  stationId: 'maitri',
  telemetry: mockMaitriTelemetry,
  anomaly: mockMaitriAnomaly,
  forecast: mockMaitriForecast,
  decision: mockMaitriDecision,
});

assert.strictEqual(maitriSummary.stationId, 'maitri');
assert.strictEqual(maitriSummary.stationName, 'Maitri');
assert.strictEqual(maitriSummary.telemetry.battery, 63.4);
assert.strictEqual(maitriSummary.telemetry.fuel, 71.2);
assert.strictEqual(maitriSummary.anomaly.status, 'ACTIVE');
assert.strictEqual(maitriSummary.anomaly.anomalyScore, 18.5);
assert.strictEqual(maitriSummary.forecast.batteryForecast, 62.1);
assert.strictEqual(maitriSummary.forecast.estimatedAutonomyHours, 170.5);
assert.strictEqual(maitriSummary.decision.riskScore, 14.5);
assert.strictEqual(maitriSummary.readiness.intelligenceReadinessPercent, 100);
console.log('✓ Test 2 PASSED');

// ---------------------------------------------------------------------------
// TEST 3: Bharati Summary Mapping
// ---------------------------------------------------------------------------
console.log('Running Test 3: Bharati Summary Mapping...');
const mockBharatiTelemetry = {
  stationId: 'bharati',
  stationName: 'Bharati',
  status: 'WARNING',
  battery: 28.5,
  fuel: 18.0,
  powerConsumption: 122.4,
  temperature: -24.2,
  windSpeed: 48.0,
};
const mockBharatiAnomaly = {
  status: 'ACTIVE',
  severity: 'WARNING',
  anomalyScore: 58.0,
  isAnomaly: true,
};
const mockBharatiForecast = {
  status: 'ACTIVE',
  battery: { trend: 'DECREASING', forecast: 15.0 },
  fuel: { trend: 'DECREASING', forecast: 10.0, estimatedAutonomyHours: 22.5 },
  powerConsumption: { trend: 'INCREASING', forecast: 135.0 },
  temperature: { trend: 'DECREASING', forecast: -28.0 },
};
const mockBharatiDecision = {
  status: 'ACTIVE',
  overallRisk: 'HIGH',
  riskScore: 68.0,
  priority: 'P2 - HIGH',
  summary: 'Fuel reserves critically low.',
  recommendedActions: [{ priority: 1, action: 'Refuel' }],
};

const bharatiSummary = buildStationCommandSummary({
  stationId: 'bharati',
  telemetry: mockBharatiTelemetry,
  anomaly: mockBharatiAnomaly,
  forecast: mockBharatiForecast,
  decision: mockBharatiDecision,
});

assert.strictEqual(bharatiSummary.stationId, 'bharati');
assert.strictEqual(bharatiSummary.telemetry.battery, 28.5);
assert.strictEqual(bharatiSummary.telemetry.fuel, 18.0);
assert.strictEqual(bharatiSummary.forecast.estimatedAutonomyHours, 22.5);
assert.strictEqual(bharatiSummary.decision.overallRisk, 'HIGH');
assert.strictEqual(bharatiSummary.decision.riskScore, 68.0);
console.log('✓ Test 3 PASSED');

// ---------------------------------------------------------------------------
// TEST 4: Station Independence
// ---------------------------------------------------------------------------
console.log('Running Test 4: Station Independence...');
const mIndep = buildStationCommandSummary({
  stationId: 'maitri',
  telemetry: { battery: 70 },
});
const bIndep = buildStationCommandSummary({
  stationId: 'bharati',
  telemetry: { battery: 30 },
});
assert.strictEqual(mIndep.telemetry.battery, 70);
assert.strictEqual(bIndep.telemetry.battery, 30);
assert.notStrictEqual(mIndep.telemetry.battery, bIndep.telemetry.battery);
console.log('✓ Test 4 PASSED');

// ---------------------------------------------------------------------------
// TEST 5: Highest Priority Station (Score difference)
// ---------------------------------------------------------------------------
console.log('Running Test 5: Highest Priority Station...');
const sMaitri5 = {
  stationId: 'maitri',
  decision: { status: 'ACTIVE', riskScore: 25, overallRisk: 'LOW', priority: 'P4' },
};
const sBharati5 = {
  stationId: 'bharati',
  decision: { status: 'ACTIVE', riskScore: 80, overallRisk: 'CRITICAL', priority: 'P1' },
};
const highest5 = getHighestPriorityStation([sMaitri5, sBharati5]);
assert.strictEqual(highest5.stationId, 'bharati');
console.log('✓ Test 5 PASSED');

// ---------------------------------------------------------------------------
// TEST 6: Risk Severity Tie-Breaker (Equal Scores)
// ---------------------------------------------------------------------------
console.log('Running Test 6: Risk Severity Tie-Breaker...');
const sMaitri6 = {
  stationId: 'maitri',
  decision: { status: 'ACTIVE', riskScore: 50.0, overallRisk: 'MEDIUM', priority: 'P3' },
};
const sBharati6 = {
  stationId: 'bharati',
  decision: { status: 'ACTIVE', riskScore: 50.0, overallRisk: 'CRITICAL', priority: 'P1' },
};
const highest6 = getHighestPriorityStation([sMaitri6, sBharati6]);
assert.strictEqual(highest6.stationId, 'bharati');
console.log('✓ Test 6 PASSED');

// ---------------------------------------------------------------------------
// TEST 7: Priority Tie-Breaker (Equal Scores & Equal Severity)
// ---------------------------------------------------------------------------
console.log('Running Test 7: Priority Tie-Breaker...');
const sMaitri7 = {
  stationId: 'maitri',
  decision: { status: 'ACTIVE', riskScore: 60.0, overallRisk: 'HIGH', priority: 'P1' },
};
const sBharati7 = {
  stationId: 'bharati',
  decision: { status: 'ACTIVE', riskScore: 60.0, overallRisk: 'HIGH', priority: 'P2' },
};
const highest7 = getHighestPriorityStation([sMaitri7, sBharati7]);
assert.strictEqual(highest7.stationId, 'maitri');
console.log('✓ Test 7 PASSED');

// ---------------------------------------------------------------------------
// TEST 8: No Active Decision Engines
// ---------------------------------------------------------------------------
console.log('Running Test 8: No Active Decision Engines...');
const sMaitri8 = {
  stationId: 'maitri',
  decision: { status: 'LEARNING', riskScore: null },
};
const sBharati8 = {
  stationId: 'bharati',
  decision: { status: 'LEARNING', riskScore: null },
};
const highest8 = getHighestPriorityStation([sMaitri8, sBharati8]);
assert.strictEqual(highest8, null);
console.log('✓ Test 8 PASSED');

// ---------------------------------------------------------------------------
// TEST 9: Readiness Calculation
// ---------------------------------------------------------------------------
console.log('Running Test 9: Readiness Calculation...');
// All active -> 100
const ready100 = calculateStationReadiness({
  telemetry: { battery: 80 },
  anomaly: { status: 'ACTIVE' },
  forecast: { status: 'ACTIVE' },
  decision: { status: 'ACTIVE' },
});
assert.strictEqual(ready100.intelligenceReadinessPercent, 100);

// Telemetry only -> 25
const ready25 = calculateStationReadiness({
  telemetry: { battery: 80 },
  anomaly: { status: 'LEARNING' },
  forecast: { status: 'LEARNING' },
  decision: { status: 'LEARNING' },
});
assert.strictEqual(ready25.intelligenceReadinessPercent, 25);
console.log('✓ Test 9 PASSED');

// ---------------------------------------------------------------------------
// TEST 10: Cross-Station Comparison
// ---------------------------------------------------------------------------
console.log('Running Test 10: Cross-Station Comparison...');
const comp = buildCrossStationComparison(maitriSummary, bharatiSummary);
assert.strictEqual(comp.battery.maitri, 63.4);
assert.strictEqual(comp.battery.bharati, 28.5);
assert.strictEqual(comp.battery.difference, 34.9);
assert.strictEqual(comp.battery.lowerStation, 'bharati');

assert.strictEqual(comp.fuel.maitri, 71.2);
assert.strictEqual(comp.fuel.bharati, 18.0);
assert.strictEqual(comp.fuel.difference, 53.2);
assert.strictEqual(comp.fuel.lowerStation, 'bharati');

assert.strictEqual(comp.powerConsumption.higherStation, 'bharati');
assert.strictEqual(comp.overallRisk.higherRiskStation, 'bharati');
console.log('✓ Test 10 PASSED');

// ---------------------------------------------------------------------------
// TEST 11: Missing / Corrupt Data Robustness
// ---------------------------------------------------------------------------
console.log('Running Test 11: Missing Data Robustness...');
const corruptRes = buildStationCommandSummary({
  stationId: null,
  telemetry: { battery: NaN, fuel: Infinity, powerConsumption: 'bad_number' },
  anomaly: null,
  forecast: undefined,
  decision: { riskScore: -Infinity },
});
assert.strictEqual(corruptRes.telemetry.battery, null);
assert.strictEqual(corruptRes.telemetry.fuel, null);
assert.strictEqual(corruptRes.telemetry.powerConsumption, null);
assert.strictEqual(corruptRes.decision.riskScore, null);
assert.doesNotThrow(() => JSON.stringify(corruptRes));
console.log('✓ Test 11 PASSED');

// ---------------------------------------------------------------------------
// Summary Object Verification
// ---------------------------------------------------------------------------
console.log('Verifying Unified Summary Aggregation...');
const unified = buildUnifiedCommandSummary(maitriSummary, bharatiSummary);
assert.strictEqual(unified.totalStations, 2);
assert.strictEqual(unified.activeDecisionEngines, 2);
assert.strictEqual(unified.activeForecastEngines, 2);
assert.strictEqual(unified.activeAnomalyEngines, 2);
assert.strictEqual(unified.averageReadinessPercent, 100);
assert.strictEqual(unified.highestPriorityStation.stationId, 'bharati');

console.log('--- ALL PHASE 6A UNIT TESTS PASSED SUCCESSFULLY! ---');
