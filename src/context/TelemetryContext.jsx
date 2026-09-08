import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { MAITRI, BHARATI } from '../data/stationData';
import { SIMULATION_SCENARIOS } from '../services/simulationService';

// Maitri telemetry is served by the dedicated Render deployment.
// Override via VITE_API_URL in .env for local development or alternative backends.
const MAITRI_API_BASE = (import.meta.env.VITE_API_URL || "https://maitri-backend-api-1.onrender.com").replace(/\/+$/, "").replace(/\/api\/v1$/, "") + "/api/v1";

// Bharati telemetry is served by its own dedicated Render deployment.
const BHARATI_API_BASE = "https://bharati-station.onrender.com/api/v1";

// Local Phase-1 backend — history API lives here regardless of which cloud
// backend is used for current telemetry.
const LOCAL_API_BASE = "http://localhost:8000/api/v1";

// How often to poll current telemetry (ms)
const POLL_INTERVAL_MS = 3000;

// How often to refresh history (ms) — slightly slower to reduce load
const HISTORY_POLL_INTERVAL_MS = 5000;

// How often to refresh anomaly ML results (ms).
// Anomaly detection retrains on each request so 8 s is a safe cadence.
const ANOMALY_POLL_INTERVAL_MS = 8000;

// How often to poll predictive operational forecasts (ms)
const FORECAST_POLL_INTERVAL_MS = 10000;

// How often to poll explainable operational decision intelligence (ms)
const DECISION_POLL_INTERVAL_MS = 10000;

/**
 * Transform a raw backend history snapshot into the chart-friendly shape
 * expected by SensorChart (keys: time, temp, fuelPct, batteryPct, powerKW,
 * genLoadPct, chpHeatKW).
 *
 * @param {Object} snapshot  — one entry from /history response
 * @returns {Object}         — chart-ready data point
 */
export function formatHistoryForCharts(snapshot) {
  // Extract HH:MM:SS from ISO timestamp "2026-09-07T07:01:33Z"
  let time = snapshot.timestamp ?? "";
  const match = time.match(/T(\d{2}:\d{2}:\d{2})/);
  if (match) time = match[1];

  return {
    // XAxis label consumed by SensorChart
    time,
    // Preserve original for debugging / future use
    timestamp: snapshot.timestamp ?? null,
    // Maitri + Bharati shared keys
    temp:        snapshot.temperature     ?? null,
    fuelPct:     snapshot.fuel            ?? null,
    batteryPct:  snapshot.battery         ?? null,
    powerKW:     snapshot.powerConsumption ?? null,
    genLoadPct:  snapshot.generatorLoad   ?? null,
    // Bharati-specific (not present in local backend — leave null gracefully)
    chpHeatKW:   snapshot.chpHeatKW       ?? null,
    // Extra fields available for future phases
    windSpeed:   snapshot.windSpeed       ?? null,
    humidity:    snapshot.humidity        ?? null,
    pressure:    snapshot.pressure        ?? null,
    status:      snapshot.status          ?? null,
    riskLevel:   snapshot.riskLevel       ?? null,
  };
}

// Deep clone helper
const cloneState = (obj) => JSON.parse(JSON.stringify(obj));

const TelemetryContext = createContext(null);

const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const updateStationTelemetry = (prevStation, baseStation, scenarioMod) => {
  const nextStation = { ...prevStation };

  // 1. Temperature variation (nudged towards scenario target)
  const baseTemp = baseStation.temperature;
  const targetTemp = scenarioMod ? (baseTemp + (scenarioMod.tempOffset || 0)) : prevStation.temperature;
  const tempDiff = targetTemp - prevStation.temperature;
  const tempChange = (Math.random() - 0.5) * 0.4 + (tempDiff * 0.25);
  nextStation.temperature = Number(clamp(prevStation.temperature + tempChange, -60, -10).toFixed(1));

  // 2. Wind Speed variation (nudged towards scenario target)
  const baseWind = baseStation.windSpeed;
  const targetWind = scenarioMod ? (baseWind + (scenarioMod.windOffset || 0)) : prevStation.windSpeed;
  const windDiff = targetWind - prevStation.windSpeed;
  const windChange = (Math.random() - 0.5) * 2.0 + (windDiff * 0.25);
  nextStation.windSpeed = Number(clamp(prevStation.windSpeed + windChange, 5, 140).toFixed(1));

  // 3. Battery slowly decreases (unless floating/recharging)
  let batteryDrain = 0.15;
  if (scenarioMod) {
    if (scenarioMod.id === "GEN_LOAD_SHED" && prevStation.stationId === "maitri") {
      batteryDrain = 0.45;
    }
  }
  nextStation.battery = Number(clamp(prevStation.battery - batteryDrain, 0, 100).toFixed(1));

  // 4. Fuel slowly decreases
  const fuelDrainRate = scenarioMod && scenarioMod.fuelDrainRate !== undefined ? scenarioMod.fuelDrainRate : 1.0;
  let fuelDrain = 0.04 * fuelDrainRate;
  if (scenarioMod && scenarioMod.fuelLevel !== undefined && prevStation.stationId === "bharati") {
    // Drop fuel towards scenario target (e.g. Fuel Emergency)
    const targetFuel = scenarioMod.fuelLevel;
    const fuelDiff = targetFuel - prevStation.fuel;
    fuelDrain = fuelDiff * 0.25;
  }
  nextStation.fuel = Number(clamp(prevStation.fuel - fuelDrain, 0, 100).toFixed(1));

  // 5. Water level gradual change
  const waterChange = (Math.random() - 0.5) * 0.4;
  nextStation.water = Number(clamp(prevStation.water + waterChange, 0, 100).toFixed(1));

  // 6. Power Consumption variation
  const basePower = baseStation.powerConsumption;
  const targetPower = scenarioMod ? (basePower + (scenarioMod.powerOffset || 0)) : prevStation.powerConsumption;
  const powerDiff = targetPower - prevStation.powerConsumption;
  const powerChange = (Math.random() - 0.5) * 0.5 + (powerDiff * 0.25);
  nextStation.powerConsumption = Number(clamp(prevStation.powerConsumption + powerChange, 10, 200).toFixed(1));

  // 7. Derive Weather Condition logically based on telemetry
  const deriveWeather = (wSpeed, temp) => {
    if (wSpeed >= 75 && temp <= -30) {
      return "Blizzard Warning";
    } else if (wSpeed >= 55) {
      return "Windy";
    } else if (temp <= -34) {
      return "Snow";
    } else if (temp <= -30) {
      return "Light Snow";
    } else if (wSpeed >= 35) {
      return "Cloudy";
    } else if (wSpeed >= 20) {
      return "Partly Cloudy";
    } else {
      return "Clear";
    }
  };

  // 8. Derive Operational Status from Battery, Fuel, and Water thresholds
  const deriveOperationalStatus = (batt, fl, wt) => {
    if (batt < 30 || fl < 20 || wt < 20) {
      return "CRITICAL";
    }
    if (batt < 70 || fl < 50 || wt < 50) {
      return "WARNING";
    }
    return "NORMAL";
  };

  const weather = deriveWeather(nextStation.windSpeed, nextStation.temperature);
  nextStation.status = deriveOperationalStatus(nextStation.battery, nextStation.fuel, nextStation.water);

  // Sync nested objects so the rest of the application gets these live updates
  nextStation.environment = {
    ...prevStation.environment,
    temperature: nextStation.temperature,
    feelsLike: Number((nextStation.temperature - (nextStation.windSpeed * 0.15)).toFixed(1)),
    windSpeed: nextStation.windSpeed,
    weatherCondition: weather
  };

  nextStation.energy = {
    ...prevStation.energy,
    batteryLevel: nextStation.battery,
    powerConsumptionKW: nextStation.powerConsumption,
    generatorLoadPct: clamp(Math.round(nextStation.powerConsumption / 0.8), 20, 100),
    generatorStatus: nextStation.battery < 40 ? "HIGH_LOAD" : "NORMAL"
  };

  nextStation.resources = {
    ...prevStation.resources,
    fuelLevelPct: nextStation.fuel,
    waterLevelPct: nextStation.water,
    fuelDaysRemaining: Math.round(nextStation.fuel * 1.1),
    waterCurrentLitres: Math.round(prevStation.resources.waterCapacityLitres * (nextStation.water / 100)),
    fuelCurrentLitres: Math.round(prevStation.resources.fuelCapacityLitres * (nextStation.fuel / 100))
  };

  // Handle active scenarios alerts or specific settings
  if (scenarioMod) {
    if (scenarioMod.commsStatus) {
      nextStation.communicationStatus = scenarioMod.commsStatus;
    } else {
      nextStation.communicationStatus = "ONLINE";
    }
    
    if (scenarioMod.alert) {
      nextStation.primaryAlert = scenarioMod.alert.split(':')[0];
      // Keep alert at the top of the alerts feed
      if (!nextStation.alerts.some(a => a.id === `ALT-${scenarioMod.id}`)) {
        nextStation.alerts = [
          {
            id: `ALT-${scenarioMod.id}`,
            type: "System Event",
            severity: scenarioMod.id.includes("FUEL") || scenarioMod.id.includes("BLIZZARD") ? "critical" : "warning",
            status: "ACTIVE ALERT",
            message: scenarioMod.alert,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " UTC",
            threshold: "Scenario Injected",
            currentValue: "Active",
            ack: false
          },
          ...nextStation.alerts
        ];
      }
    } else {
      nextStation.primaryAlert = baseStation.primaryAlert;
      // Remove scenario alerts if we are back to NOMINAL
      nextStation.alerts = nextStation.alerts.filter(a => !a.id.startsWith("ALT-") || a.id === "ALT-EXT-COLD" || a.id === "ALT-HIGH-WIND" || a.id === "ALT-BH-FUEL" || a.id === "ALT-BH-WEATHER");
    }
  } else {
    nextStation.communicationStatus = "ONLINE";
    nextStation.primaryAlert = baseStation.primaryAlert;
  }

  // Evaluate risk level dynamically
  let riskScore = 0;
  if (nextStation.temperature <= -35.0) riskScore += 2;
  else if (nextStation.temperature <= -28.0) riskScore += 1;

  if (nextStation.windSpeed >= 50.0) riskScore += 2;
  else if (nextStation.windSpeed >= 40.0) riskScore += 1;

  if (nextStation.fuel <= 20) riskScore += 3;
  else if (nextStation.fuel <= 35) riskScore += 1;

  if (nextStation.battery <= 40) riskScore += 2;

  if (nextStation.communicationStatus.includes("DEGRADED") || nextStation.communicationStatus.includes("OFFLINE")) {
    riskScore += 2;
  }

  if (riskScore >= 3) {
    nextStation.riskLevel = "HIGH RISK";
  } else if (riskScore >= 2) {
    nextStation.riskLevel = "MODERATE RISK";
  } else {
    nextStation.riskLevel = "LOW RISK";
  }

  return nextStation;
};

export function TelemetryProvider({ children }) {
  const [maitri, setMaitri] = useState(() => cloneState(MAITRI));
  const [bharati, setBharati] = useState(() => cloneState(BHARATI));
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toISOString());
  const [activeScenario, setActiveScenario] = useState(SIMULATION_SCENARIOS.NOMINAL);

  // ── Live rolling history from the local Phase-1 backend ─────────────────
  const [maitriHistory, setMaitriHistory] = useState([]);
  const [bharatiHistory, setBharatiHistory] = useState([]);

  // ── Phase 3B: ML anomaly results from the local IsolationForest endpoint ──
  // null = not yet received; object = latest backend response (LEARNING or ACTIVE)
  const [maitriAnomaly, setMaitriAnomaly] = useState(null);
  const [bharatiAnomaly, setBharatiAnomaly] = useState(null);

  // ── Phase 4B: Predictive forecast results from local FastAPI backend ──────
  // null = not yet received; object = latest backend response (LEARNING or ACTIVE)
  const [maitriForecast, setMaitriForecast] = useState(null);
  const [bharatiForecast, setBharatiForecast] = useState(null);

  // ── Phase 5B: Operational decision results from local FastAPI backend ──────
  // null = not yet received; object = latest backend response (LEARNING or ACTIVE)
  const [maitriDecision, setMaitriDecision] = useState(null);
  const [bharatiDecision, setBharatiDecision] = useState(null);

  // Maitri connection status
  const [connectionStatus, setConnectionStatus] = useState("DISCONNECTED");
  const [twinSyncStatus, setTwinSyncStatus] = useState("DISCONNECTED");
  const staleTimerRef = useRef(null);

  // Bharati connection status
  const [bharatiConnectionStatus, setBharatiConnectionStatus] = useState("DISCONNECTED");
  const [bharatiSyncStatus, setBharatiSyncStatus] = useState("DISCONNECTED");
  const bharatiStaleTimerRef = useRef(null);

  const staleTimeoutMs = 10000;

  // ─── Helper: map flat FastAPI response onto the nested maitri state ────────
  const applyApiResponse = useCallback((apiData) => {
    setMaitri((prev) => {
      // ── Core sensor fields ──────────────────────────────────────────────────
      const temp     = apiData.temperature       ?? prev.temperature;
      const wind     = apiData.windSpeed         ?? prev.windSpeed;
      const battery  = apiData.battery           ?? prev.battery;
      const fuel     = apiData.fuel              ?? prev.fuel;
      const water    = apiData.water             ?? prev.water;
      const power    = apiData.powerConsumption  ?? prev.powerConsumption;
      const humidity = apiData.humidity          ?? prev.environment?.humidity;
      const pressure = apiData.pressure          ?? prev.environment?.pressure;
      // Use the API's computed generatorLoad directly instead of recalculating
      const generatorLoad = apiData.generatorLoad ?? clamp(Math.round(power / 0.8), 20, 100);

      const feelsLike = Number((temp - wind * 0.15).toFixed(1));

      const deriveWeather = (w, t) => {
        if (w >= 75 && t <= -30)  return "Blizzard Warning";
        if (w >= 55)              return "Windy";
        if (t <= -34)             return "Snow";
        if (t <= -30)             return "Light Snow";
        if (w >= 35)              return "Cloudy";
        if (w >= 20)              return "Partly Cloudy";
        return "Clear";
      };

      // ── stationCrew: "24 / 25" → { current: 24, maxWinter: 25 } ────────────
      let crewCapacity = prev.crewCapacity;
      if (apiData.stationCrew) {
        const parts = String(apiData.stationCrew).split('/').map(s => s.trim());
        crewCapacity = {
          ...prev.crewCapacity,
          current:   parseInt(parts[0], 10) || prev.crewCapacity?.current,
          maxWinter: parseInt(parts[1], 10) || prev.crewCapacity?.maxWinter,
        };
      }

      // ── generators: API array → energy.generators (already same shape) ──────
      const generators = Array.isArray(apiData.generators) && apiData.generators.length
        ? apiData.generators
        : prev.energy?.generators ?? [];

      // ── equipmentHealth → equipment[] (field renames) ───────────────────────
      // API shape: { name, status, activeUnit, health, temp, details, runtime, nextMaint }
      // UI shape:  { id, name, category, status, primaryUnit, operationalHealth,
      //              temperatureC, details, runtimeHours, nextMaintenance }
      // IDs are assigned positionally to match the four fixed equipment slots.
      const EQ_IDS       = ['EQ-GEN',  'EQ-HEAT',  'EQ-POWER',  'EQ-COMM'];
      const EQ_CATS      = ['Power Generation', 'Climate Control', 'Power Distribution', 'Communications'];
      let equipment = prev.equipment;
      if (Array.isArray(apiData.equipmentHealth) && apiData.equipmentHealth.length) {
        equipment = apiData.equipmentHealth.map((eq, i) => ({
          id:                EQ_IDS[i]   ?? `EQ-${i}`,
          name:              eq.name,
          category:          EQ_CATS[i]  ?? eq.name,
          status:            eq.status,
          primaryUnit:       eq.activeUnit,
          operationalHealth: eq.health,
          temperatureC:      eq.temp,
          details:           eq.details,
          runtimeHours:      eq.runtime,
          nextMaintenance:   `${eq.nextMaint}h`,
        }));
      }

      // ── alerts: API shape → UI shape ────────────────────────────────────────
      // API shape: { id, title, time, status, text, metadata, acknowledged, severity }
      // UI shape:  { id, type, timestamp, status, message, currentValue, threshold,
      //              severity, ack }
      // Parse currentValue and threshold out of the metadata string
      // e.g. "Current: -34.1°C | Threshold: Trigger: < -30.0°C"
      let alerts = prev.alerts;
      if (Array.isArray(apiData.alerts) && apiData.alerts.length) {
        alerts = apiData.alerts.map((a) => {
          let currentValue = '—';
          let threshold    = '—';
          if (a.metadata) {
            const cvMatch = a.metadata.match(/Current:\s*([^|]+)/);
            const thMatch = a.metadata.match(/Threshold:\s*(.+)/);
            if (cvMatch) currentValue = cvMatch[1].trim();
            if (thMatch) threshold    = thMatch[1].trim();
          }
          return {
            id:           a.id,
            type:         a.title,          // "EXTREME COLD" → used for icon lookup
            timestamp:    a.time,
            status:       a.status,
            message:      a.text,
            currentValue,
            threshold,
            severity:     a.severity?.toLowerCase() ?? 'info',
            ack:          a.acknowledged ?? false,
          };
        });
      }

      return {
        ...prev,
        // ── flat scalars ────────────────────────────────────────────────────
        temperature:         temp,
        windSpeed:           wind,
        battery,
        fuel,
        water,
        powerConsumption:    power,
        status:              apiData.status              ?? prev.status,
        riskLevel:           apiData.riskLevel           ?? prev.riskLevel,
        communicationStatus: apiData.communicationStatus ?? prev.communicationStatus,
        primaryAlert:        apiData.primaryAlert        ?? prev.primaryAlert,
        overallHealth:       apiData.overallHealth       ?? prev.overallHealth,
        lastUpdated:         apiData.lastUpdated         ?? new Date().toISOString(),
        crewCapacity,
        equipment,
        alerts,

        // ── environment (includes new aux fields) ──────────────────────────
        environment: {
          ...prev.environment,
          temperature:        temp,
          feelsLike,
          windSpeed:          wind,
          humidity,
          pressure,
          weatherCondition:   deriveWeather(wind, temp),
          // aux strip fields
          windDirection:      apiData.windVector        ?? prev.environment?.windDirection,
          visibility:         apiData.visibility        ?? prev.environment?.visibility,
          solarRadiation:     apiData.solarFlux         ?? prev.environment?.solarRadiation,
          snowAccumulation24h:apiData.snowAccumulation  ?? prev.environment?.snowAccumulation24h,
        },

        // ── energy (includes generators array + direct generatorLoad) ───────
        energy: {
          ...prev.energy,
          batteryLevel:    battery,
          powerConsumptionKW: power,
          generatorLoadPct:   generatorLoad,
          generatorStatus:    apiData.generatorStatus ?? (battery < 40 ? "HIGH_LOAD" : "NORMAL"),
          generators,
        },

        // ── resources ───────────────────────────────────────────────────────
        resources: {
          ...prev.resources,
          fuelLevelPct:       fuel,
          waterLevelPct:      water,
          fuelDaysRemaining:  Math.round(fuel * 1.1),
          waterCurrentLitres: Math.round(prev.resources.waterCapacityLitres * (water / 100)),
          fuelCurrentLitres:  Math.round(prev.resources.fuelCapacityLitres  * (fuel  / 100)),
        },
      };
    });
    setLastUpdated(new Date().toISOString());
  }, []);

  // ─── POST a single field update to FastAPI (Maitri) ───────────────────────
  const updateMaitriField = useCallback(async (fieldUpdates) => {
    try {
      const res = await fetch(`${MAITRI_API_BASE}/stations/maitri/telemetry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldUpdates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // Backend returns { status, station } — apply the authoritative state
      if (json.station) applyApiResponse(json.station);
    } catch (err) {
      console.warn("[TelemetryContext] POST telemetry failed:", err);
    }
  }, [applyApiResponse]);

  // ─── Helper: map Bharati API response onto the nested bharati state ─────────
  // The Bharati backend returns deeply nested objects already in the shape the
  // UI expects, so most sub-objects can be passed through directly.
  // Flat scalars are also written to the top-level for the Digital Twin map/cards.
  const applyBharatiApiResponse = useCallback((apiData) => {
    setBharati((prev) => {
      // ── Flat scalars (kept at top level for TwinStationCards / map pins) ────
      const temp  = apiData.temperature      ?? prev.temperature;
      const wind  = apiData.windSpeed        ?? prev.windSpeed;
      const bat   = apiData.battery          ?? prev.battery;
      const fuel  = apiData.fuel             ?? prev.fuel;
      const water = apiData.water            ?? prev.water;
      const power = apiData.powerConsumption ?? prev.powerConsumption;

      // ── environment{} — use API's full nested object, fall back field-by-field
      const apiEnv = apiData.environment;
      const environment = apiEnv ? {
        ...prev.environment,
        temperature:          apiEnv.temperature          ?? temp,
        feelsLike:            apiEnv.feelsLike            ?? prev.environment?.feelsLike,
        windSpeed:            apiEnv.windSpeed            ?? wind,
        windGust:             apiEnv.windGust             ?? prev.environment?.windGust,
        windDirection:        apiEnv.windDirection        ?? prev.environment?.windDirection,
        humidity:             apiEnv.humidity             ?? prev.environment?.humidity,
        pressure:             apiEnv.pressure             ?? prev.environment?.pressure,
        weatherCondition:     apiEnv.weatherCondition     ?? prev.environment?.weatherCondition,
        visibility:           apiEnv.visibility           ?? prev.environment?.visibility,
        solarRadiation:       apiEnv.solarRadiation       ?? prev.environment?.solarRadiation,
        uvIndex:              apiEnv.uvIndex              ?? prev.environment?.uvIndex,
        snowAccumulation24h:  apiEnv.snowAccumulation24h  ?? prev.environment?.snowAccumulation24h,
      } : prev.environment;

      // ── energy{} — use API's full nested object (includes generators[])
      const apiEnergy = apiData.energy;
      const energy = apiEnergy ? {
        ...prev.energy,
        batteryLevel:             apiEnergy.batteryLevel             ?? bat,
        batteryCapacityKWh:       apiEnergy.batteryCapacityKWh       ?? prev.energy?.batteryCapacityKWh,
        batteryStoredKWh:         apiEnergy.batteryStoredKWh         ?? prev.energy?.batteryStoredKWh,
        batteryVoltage:           apiEnergy.batteryVoltage           ?? prev.energy?.batteryVoltage,
        batteryRunTimeHours:      apiEnergy.batteryRunTimeHours      ?? prev.energy?.batteryRunTimeHours,
        batteryHealth:            apiEnergy.batteryHealth            ?? prev.energy?.batteryHealth,
        batteryStatus:            apiEnergy.batteryStatus            ?? prev.energy?.batteryStatus,
        powerConsumptionKW:       apiEnergy.powerConsumptionKW       ?? power,
        powerGenerationKW:        apiEnergy.powerGenerationKW        ?? prev.energy?.powerGenerationKW,
        generatorStatus:          apiEnergy.generatorStatus          ?? (bat < 40 ? "HIGH_LOAD" : "NORMAL"),
        generatorLoadPct:         apiEnergy.generatorLoadPct         ?? prev.energy?.generatorLoadPct,
        gridVoltage:              apiEnergy.gridVoltage              ?? prev.energy?.gridVoltage,
        gridFrequency:            apiEnergy.gridFrequency            ?? prev.energy?.gridFrequency,
        dailyEnergyKWh:           apiEnergy.dailyEnergyKWh           ?? prev.energy?.dailyEnergyKWh,
        chpThermalRecoveryKW:     apiEnergy.chpThermalRecoveryKW     ?? prev.energy?.chpThermalRecoveryKW,
        generators: Array.isArray(apiEnergy.generators) && apiEnergy.generators.length
          ? apiEnergy.generators
          : prev.energy?.generators ?? [],
      } : prev.energy;

      // ── resources{} — use API's full nested object
      const apiRes = apiData.resources;
      const resources = apiRes ? {
        ...prev.resources,
        fuelLevelPct:               apiRes.fuelLevelPct               ?? fuel,
        fuelCurrentLitres:          apiRes.fuelCurrentLitres          ?? prev.resources?.fuelCurrentLitres,
        fuelCapacityLitres:         apiRes.fuelCapacityLitres         ?? prev.resources?.fuelCapacityLitres,
        fuelBurnRateLPH:            apiRes.fuelBurnRateLPH            ?? prev.resources?.fuelBurnRateLPH,
        fuelDaysRemaining:          apiRes.fuelDaysRemaining          ?? prev.resources?.fuelDaysRemaining,
        fuelType:                   apiRes.fuelType                   ?? prev.resources?.fuelType,
        fuelStatus:                 apiRes.fuelStatus                 ?? prev.resources?.fuelStatus,
        waterLevelPct:              apiRes.waterLevelPct              ?? water,
        waterCurrentLitres:         apiRes.waterCurrentLitres         ?? prev.resources?.waterCurrentLitres,
        waterCapacityLitres:        apiRes.waterCapacityLitres        ?? prev.resources?.waterCapacityLitres,
        waterSource:                apiRes.waterSource                ?? prev.resources?.waterSource,
        waterDesalinationRateLPD:   apiRes.waterDesalinationRateLPD   ?? prev.resources?.waterDesalinationRateLPD,
        waterPurityTDS:             apiRes.waterPurityTDS             ?? prev.resources?.waterPurityTDS,
        waterPH:                    apiRes.waterPH                    ?? prev.resources?.waterPH,
        waterDailyUsageLitres:      apiRes.waterDailyUsageLitres      ?? prev.resources?.waterDailyUsageLitres,
        criticalResourceStatus:     apiRes.criticalResourceStatus     ?? prev.resources?.criticalResourceStatus,
        overallReserveSafetyMargin: apiRes.overallReserveSafetyMargin ?? prev.resources?.overallReserveSafetyMargin,
      } : prev.resources;

      // ── equipment[] — API already returns UI-ready shape (id, name, category, status, etc.)
      const equipment = Array.isArray(apiData.equipment) && apiData.equipment.length
        ? apiData.equipment
        : prev.equipment;

      // ── alerts[] — API already returns UI-ready shape (id, type, severity, message, etc.)
      const alerts = Array.isArray(apiData.alerts) && apiData.alerts.length
        ? apiData.alerts.map(a => ({
            ...a,
            // Normalise: API uses 'ack' or 'acknowledged'; UI uses 'ack'
            ack: a.ack ?? a.acknowledged ?? false,
          }))
        : prev.alerts;

      // ── historicalData[] — live 24h time-series from API replaces static data
      const historicalData = Array.isArray(apiData.historicalData) && apiData.historicalData.length
        ? apiData.historicalData
        : prev.historicalData;

      // ── Specialised subsystems — pass through directly if present
      const aerodynamicStructure = apiData.aerodynamicStructure ?? prev.aerodynamicStructure;
      const isroEarthStation     = apiData.isroEarthStation     ?? prev.isroEarthStation;
      const sciencePayloads      = Array.isArray(apiData.sciencePayloads) && apiData.sciencePayloads.length
        ? apiData.sciencePayloads
        : prev.sciencePayloads;

      // ── crewCapacity — API returns full object {current, maxWinter, maxSummer}
      const crewCapacity = apiData.crewCapacity ?? prev.crewCapacity;

      // ── coordinates & map pin — pass through directly
      const coordinates   = apiData.coordinates   ?? prev.coordinates;
      const mapCoordinates = apiData.mapCoordinates ?? prev.mapCoordinates;

      return {
        ...prev,
        // flat scalars
        temperature:         temp,
        windSpeed:           wind,
        battery:             bat,
        fuel,
        water,
        powerConsumption:    power,
        // status fields
        status:              apiData.status              ?? prev.status,
        riskLevel:           apiData.riskLevel           ?? prev.riskLevel,
        communicationStatus: apiData.communicationStatus ?? prev.communicationStatus,
        primaryAlert:        apiData.primaryAlert        ?? prev.primaryAlert,
        overallHealth:       apiData.overallHealth       ?? prev.overallHealth,
        lastUpdated:         apiData.lastUpdated         ?? new Date().toISOString(),
        // nested / array fields
        crewCapacity,
        coordinates,
        mapCoordinates,
        environment,
        energy,
        resources,
        equipment,
        alerts,
        historicalData,
        aerodynamicStructure,
        isroEarthStation,
        sciencePayloads,
      };
    });
    setLastUpdated(new Date().toISOString());
  }, []);

  // ─── POST a single field update to FastAPI (Bharati) ───────────────────────
  const updateBharatiField = useCallback(async (fieldUpdates) => {
    try {
      const res = await fetch(`${BHARATI_API_BASE}/stations/bharati/telemetry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fieldUpdates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.station) applyBharatiApiResponse(json.station);
    } catch (err) {
      console.warn("[TelemetryContext] POST bharati telemetry failed:", err);
    }
  }, [applyBharatiApiResponse]);

  // ─── Scenario control: POSTs scenario offsets to backend (sticks across polls)
  const setScenario = useCallback((scenarioKey) => {
    const scenario = SIMULATION_SCENARIOS[scenarioKey] || SIMULATION_SCENARIOS.NOMINAL;
    setActiveScenario(scenario);

    // Build and POST the Maitri payload derived from scenario offsets + baseline
    const mm = scenario.maitriMod;
    if (mm) {
      const maitriPayload = {
        temperature:      Number((MAITRI.temperature     + (mm.tempOffset  || 0)).toFixed(1)),
        windSpeed:        Number((MAITRI.windSpeed        + (mm.windOffset  || 0)).toFixed(1)),
        powerConsumption: Number((MAITRI.powerConsumption + (mm.powerOffset || 0)).toFixed(1)),
      };
      if (mm.commsStatus) maitriPayload.communicationStatus = mm.commsStatus;
      updateMaitriField(maitriPayload);
    }

    // Build and POST the Bharati payload
    const bm = scenario.bharatiMod;
    if (bm) {
      const bharatiPayload = {
        temperature:      Number((BHARATI.temperature     + (bm.tempOffset  || 0)).toFixed(1)),
        windSpeed:        Number((BHARATI.windSpeed        + (bm.windOffset  || 0)).toFixed(1)),
        powerConsumption: Number((BHARATI.powerConsumption + (bm.powerOffset || 0)).toFixed(1)),
      };
      // fuelLevel override is only present on FUEL_EMERGENCY
      if (bm.fuelLevel !== undefined) bharatiPayload.fuel = bm.fuelLevel;
      if (bm.commsStatus) bharatiPayload.communicationStatus = bm.commsStatus;
      updateBharatiField(bharatiPayload);
    }
  }, [updateMaitriField, updateBharatiField]);

  // ─── Reset: POSTs static baseline values to backend so reset survives polling
  const resetToNominal = useCallback(() => {
    setActiveScenario(SIMULATION_SCENARIOS.NOMINAL);
    updateMaitriField({
      temperature:         MAITRI.temperature,
      windSpeed:           MAITRI.windSpeed,
      fuel:                MAITRI.fuel,
      battery:             MAITRI.battery,
      water:               MAITRI.water,
      powerConsumption:    MAITRI.powerConsumption,
      communicationStatus: MAITRI.communicationStatus,
    });
    updateBharatiField({
      temperature:         BHARATI.temperature,
      windSpeed:           BHARATI.windSpeed,
      fuel:                BHARATI.fuel,
      battery:             BHARATI.battery,
      water:               BHARATI.water,
      powerConsumption:    BHARATI.powerConsumption,
      communicationStatus: BHARATI.communicationStatus,
    });
  }, [updateMaitriField, updateBharatiField]);

  // ─── History polling: Maitri — fetches from local Phase-1 backend ─────────
  useEffect(() => {
    let cancelled = false;

    const fetchMaitriHistory = async () => {
      try {
        const res = await fetch(`${LOCAL_API_BASE}/stations/maitri/history`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        if (Array.isArray(json.history) && json.history.length > 0) {
          setMaitriHistory(json.history.map(formatHistoryForCharts));
        }
      } catch {
        // Local backend unavailable — keep whatever history we already have
      }
    };

    fetchMaitriHistory();
    const interval = setInterval(fetchMaitriHistory, HISTORY_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ─── History polling: Bharati — fetches from local Phase-1 backend ──────
  useEffect(() => {
    let cancelled = false;

    const fetchBharatiHistory = async () => {
      try {
        const res = await fetch(`${LOCAL_API_BASE}/stations/bharati/history`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        if (Array.isArray(json.history) && json.history.length > 0) {
          setBharatiHistory(json.history.map(formatHistoryForCharts));
        }
      } catch {
        // Local backend unavailable — keep whatever history we already have
      }
    };

    fetchBharatiHistory();
    const interval = setInterval(fetchBharatiHistory, HISTORY_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ─── Anomaly polling: Maitri — IsolationForest results from local backend ──
  useEffect(() => {
    let cancelled = false;

    const fetchMaitriAnomaly = async () => {
      try {
        const res = await fetch(`${LOCAL_API_BASE}/stations/maitri/anomaly`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        // Accept both LEARNING and ACTIVE responses — store the full object
        if (json && json.station === 'maitri') {
          setMaitriAnomaly(json);
        }
      } catch {
        // Backend unavailable — keep the last successfully received result (no-op)
      }
    };

    fetchMaitriAnomaly();
    const interval = setInterval(fetchMaitriAnomaly, ANOMALY_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ─── Anomaly polling: Bharati — IsolationForest results from local backend ─
  useEffect(() => {
    let cancelled = false;

    const fetchBharatiAnomaly = async () => {
      try {
        const res = await fetch(`${LOCAL_API_BASE}/stations/bharati/anomaly`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        if (json && json.station === 'bharati') {
          setBharatiAnomaly(json);
        }
      } catch {
        // Backend unavailable — keep the last successfully received result (no-op)
      }
    };

    fetchBharatiAnomaly();
    const interval = setInterval(fetchBharatiAnomaly, ANOMALY_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ─── Forecast polling: Maitri — Phase 4B predictive engine ────────────────
  useEffect(() => {
    let cancelled = false;

    const fetchMaitriForecast = async () => {
      try {
        const res = await fetch(`${LOCAL_API_BASE}/stations/maitri/forecast`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        if (json && json.station === 'maitri') {
          setMaitriForecast(json);
        }
      } catch {
        // Backend unavailable — preserve last known successful result
      }
    };

    fetchMaitriForecast();
    const interval = setInterval(fetchMaitriForecast, FORECAST_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ─── Forecast polling: Bharati — Phase 4B predictive engine ───────────────
  useEffect(() => {
    let cancelled = false;

    const fetchBharatiForecast = async () => {
      try {
        const res = await fetch(`${LOCAL_API_BASE}/stations/bharati/forecast`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        if (json && json.station === 'bharati') {
          setBharatiForecast(json);
        }
      } catch {
        // Backend unavailable — preserve last known successful result
      }
    };

    fetchBharatiForecast();
    const interval = setInterval(fetchBharatiForecast, FORECAST_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ─── Decision polling: Maitri — Phase 5B operational intelligence ────────
  useEffect(() => {
    let cancelled = false;

    const fetchMaitriDecision = async () => {
      try {
        const res = await fetch(`${LOCAL_API_BASE}/stations/maitri/decision`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        if (json && json.station === 'maitri') {
          setMaitriDecision(json);
        }
      } catch {
        // Backend unavailable — preserve last known successful result
      }
    };

    fetchMaitriDecision();
    const interval = setInterval(fetchMaitriDecision, DECISION_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ─── Decision polling: Bharati — Phase 5B operational intelligence ───────
  useEffect(() => {
    let cancelled = false;

    const fetchBharatiDecision = async () => {
      try {
        const res = await fetch(`${LOCAL_API_BASE}/stations/bharati/decision`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (cancelled) return;
        if (json && json.station === 'bharati') {
          setBharatiDecision(json);
        }
      } catch {
        // Backend unavailable — preserve last known successful result
      }
    };

    fetchBharatiDecision();
    const interval = setInterval(fetchBharatiDecision, DECISION_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ─── Bharati: 3-second GET polling against FastAPI ─────────────────────────
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`${BHARATI_API_BASE}/stations/bharati`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        applyBharatiApiResponse(data);
        setBharatiConnectionStatus("LIVE");
        setBharatiSyncStatus("SYNCHRONIZED");

        if (bharatiStaleTimerRef.current) clearTimeout(bharatiStaleTimerRef.current);
        bharatiStaleTimerRef.current = setTimeout(() => {
          setBharatiSyncStatus("STALE");
        }, staleTimeoutMs);

      } catch (err) {
        if (cancelled) return;
        console.warn("[TelemetryContext] Bharati poll failed:", err.message);
        setBharatiConnectionStatus("DISCONNECTED");
        setBharatiSyncStatus("DISCONNECTED");
        if (bharatiStaleTimerRef.current) clearTimeout(bharatiStaleTimerRef.current);
      }
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (bharatiStaleTimerRef.current) clearTimeout(bharatiStaleTimerRef.current);
    };
  }, [applyBharatiApiResponse]);

  // ─── Maitri: 3-second GET polling against FastAPI ──────────────────────────
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`${MAITRI_API_BASE}/stations/maitri`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;

        applyApiResponse(data);
        setConnectionStatus("LIVE");
        setTwinSyncStatus("SYNCHRONIZED");

        // Mark STALE if no new poll arrives within staleTimeoutMs
        if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
        staleTimerRef.current = setTimeout(() => {
          setTwinSyncStatus("STALE");
        }, staleTimeoutMs);

      } catch (err) {
        if (cancelled) return;
        console.warn("[TelemetryContext] Maitri poll failed:", err.message);
        setConnectionStatus("DISCONNECTED");
        setTwinSyncStatus("DISCONNECTED");
        if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
      }
    };

    // Fire immediately, then on interval
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (staleTimerRef.current) clearTimeout(staleTimerRef.current);
    };
  }, [applyApiResponse]);

  return (
    <TelemetryContext.Provider value={{
      maitri,
      bharati,
      lastUpdated,
      activeScenario,
      scenarios: SIMULATION_SCENARIOS,
      setScenario,
      resetToNominal,
      connectionStatus,
      twinSyncStatus,
      updateMaitriField,
      bharatiConnectionStatus,
      bharatiSyncStatus,
      updateBharatiField,
      // ── Phase 2: live rolling history (empty [] until local backend responds)
      maitriHistory,
      bharatiHistory,
      // ── Phase 3B: ML anomaly results (null until local backend responds)
      maitriAnomaly,
      bharatiAnomaly,
      // ── Phase 4B: Predictive forecast results (null until local backend responds)
      maitriForecast,
      bharatiForecast,
      // ── Phase 5B: Operational decision results (null until local backend responds)
      maitriDecision,
      bharatiDecision,
    }}>
      {children}
    </TelemetryContext.Provider>
  );
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
}
