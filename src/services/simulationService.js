/**
 * Antarctic Digital Twin Simulation Service (AIP-DT)
 * 
 * Provides real-time polar telemetry simulation, extreme weather scenario injection,
 * dynamic risk assessment, and live pub/sub updates for Maitri and Bharati research stations.
 * 
 * Architecture:
 * - Single source of truth based on `src/data/stationData.js`
 * - Pub/Sub subscription pattern for real-time React UI updates
 * - Automated threshold evaluator for live alerts and risk levels
 * - FastAPI / WebSocket backend-ready abstraction layer
 */

import { MAITRI, BHARATI, stationData } from '../data/stationData';

// Deep clone helper for immutable state management
const cloneState = (obj) => JSON.parse(JSON.stringify(obj));

// Standard Defined Extreme Antarctic What-If Simulation Scenarios
export const SIMULATION_SCENARIOS = {
  NOMINAL: {
    id: "NOMINAL",
    name: "Nominal Polar Operations",
    description: "Standard mid-winter operations with nominal microgrid power generation, stable water extraction, and calm baseline katabatic breezes.",
    systemAlertLevel: "GREEN",
    maitriMod: { tempOffset: 0, windOffset: 0, powerOffset: 0, fuelDrainRate: 1.0, commsDegradation: false },
    bharatiMod: { tempOffset: 0, windOffset: 0, powerOffset: 0, fuelDrainRate: 1.0, commsDegradation: false }
  },
  KATABATIC_BLIZZARD: {
    id: "KATABATIC_BLIZZARD",
    name: "Katabatic Blizzard Gale (Category 4)",
    description: "Violent gravity-driven katabatic windstorm flowing from the polar ice sheet with gale gusts up to 135 km/h, intense wind chill, and zero visibility.",
    systemAlertLevel: "RED",
    maitriMod: { tempOffset: -8.5, windOffset: +45.0, powerOffset: +12.4, fuelDrainRate: 1.4, commsDegradation: false, alert: "KATABATIC GALE: WIND GUSTS > 120 km/h - STRUCTURAL TRACE HEATING AT MAXIMUM" },
    bharatiMod: { tempOffset: -6.2, windOffset: +52.5, powerOffset: +18.0, fuelDrainRate: 1.5, commsDegradation: false, alert: "COASTAL BLIZZARD: 4.0m STILT HYDRAULIC STABILIZERS ENGAGED" }
  },
  SOLAR_RADIO_BLACKOUT: {
    id: "SOLAR_RADIO_BLACKOUT",
    name: "Geomagnetic Solar Flare (Class X2.4)",
    description: "Severe ionospheric scintillation disrupting Ku/C-band high-frequency satellite links over polar cap, forcing automatic fallback to Iridium low-band mesh.",
    systemAlertLevel: "AMBER",
    maitriMod: { tempOffset: 0, windOffset: 0, powerOffset: 0, fuelDrainRate: 1.0, commsDegradation: true, commsStatus: "DEGRADED (Iridium Fallback)", alert: "GSAT-30 LINK DEGRADATION - SWITCHED TO IRIDIUM LOW-BAND MESH" },
    bharatiMod: { tempOffset: 0, windOffset: 0, powerOffset: 0, fuelDrainRate: 1.0, commsDegradation: true, commsStatus: "DEGRADED (Link Margin Drop)", alert: "ISRO GROUND TRACKING DISH LINK MARGIN REDUCED BY 6.2 dB" }
  },
  GEN_LOAD_SHED: {
    id: "GEN_LOAD_SHED",
    name: "Maitri Gen-1 Trip / Priority Load Shed",
    description: "Unexpected mechanical shutdown of Maitri Primary Generator GEN-01 with automatic bus transfer to Auxiliary GEN-02 and priority lab circuit load shedding.",
    systemAlertLevel: "AMBER",
    maitriMod: { tempOffset: 0, windOffset: 0, powerOffset: -14.2, gen1Status: "OFFLINE", gen2Status: "RUNNING", genLoadPct: 92, fuelDrainRate: 1.1, alert: "GEN-01 TRIP: AUX GEN-02 AUTO-STARTED - NON-ESSENTIAL HEATING LOADS SHED" },
    bharatiMod: { tempOffset: 0, windOffset: 0, powerOffset: 0, fuelDrainRate: 1.0, commsDegradation: false }
  },
  FUEL_EMERGENCY: {
    id: "FUEL_EMERGENCY",
    name: "Fuel Depletion Emergency (Bharati)",
    description: "Critical fuel shortage scenario testing emergency power conservation protocols, thermal recovery optimization, and relief tanker scheduling.",
    systemAlertLevel: "RED",
    maitriMod: { tempOffset: 0, windOffset: 0, powerOffset: 0, fuelDrainRate: 1.0 },
    bharatiMod: { tempOffset: 0, windOffset: 0, powerOffset: -22.0, fuelLevel: 14, fuelDaysRemaining: 18, alert: "CRITICAL FUEL LEVEL (14%): EMERGENCY LOAD-SHEDDING PROTOCOL ACTIVE" }
  }
};

class SimulationService {
  constructor() {
    this.currentScenarioKey = "NOMINAL";
    this.listeners = new Set();
    this.timerId = null;
    this.isRunning = false;
    this.tickIntervalMs = 3000;

    // Live mutable station states initialized from centralized stationData model
    this.liveState = {
      maitri: cloneState(MAITRI),
      bharati: cloneState(BHARATI),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get current live simulated station data
   */
  getStations() {
    return this.liveState;
  }

  getStation(stationId) {
    const key = (stationId || "").toLowerCase();
    return this.liveState[key] || null;
  }

  getActiveScenario() {
    return SIMULATION_SCENARIOS[this.currentScenarioKey] || SIMULATION_SCENARIOS.NOMINAL;
  }

  /**
   * Subscribe to live telemetry stream updates
   */
  subscribe(listener) {
    if (typeof listener === 'function') {
      this.listeners.add(listener);
      // Immediately send current state on subscribe
      listener(this.liveState, this.getActiveScenario());
    }
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all registered listeners with updated state
   */
  notify() {
    this.liveState.lastUpdated = new Date().toISOString();
    const scenario = this.getActiveScenario();
    this.listeners.forEach((listener) => {
      try {
        listener(this.liveState, scenario);
      } catch (err) {
        console.error("Simulation listener error:", err);
      }
    });
  }

  /**
   * Set and apply a specific simulation scenario
   */
  setScenario(scenarioKey) {
    if (!SIMULATION_SCENARIOS[scenarioKey]) {
      console.warn(`Scenario ${scenarioKey} not recognized. Reverting to NOMINAL.`);
      this.currentScenarioKey = "NOMINAL";
    } else {
      this.currentScenarioKey = scenarioKey;
    }
    this.applyScenarioModifiers();
    this.notify();
  }

  /**
   * Apply scenario offsets and evaluate threshold risk levels
   */
  applyScenarioModifiers() {
    const scenario = this.getActiveScenario();
    const baseMaitri = cloneState(MAITRI);
    const baseBharati = cloneState(BHARATI);

    // Apply Maitri Modifiers
    if (scenario.maitriMod) {
      const mod = scenario.maitriMod;
      this.liveState.maitri.temperature = Number((baseMaitri.temperature + (mod.tempOffset || 0)).toFixed(1));
      this.liveState.maitri.windSpeed = Number((baseMaitri.windSpeed + (mod.windOffset || 0)).toFixed(1));
      this.liveState.maitri.powerConsumption = Number((baseMaitri.powerConsumption + (mod.powerOffset || 0)).toFixed(1));
      
      if (mod.commsStatus) {
        this.liveState.maitri.communicationStatus = mod.commsStatus;
      } else {
        this.liveState.maitri.communicationStatus = baseMaitri.communicationStatus;
      }

      if (mod.alert) {
        this.liveState.maitri.primaryAlert = mod.alert.split(':')[0];
      } else {
        this.liveState.maitri.primaryAlert = baseMaitri.primaryAlert;
      }
    }

    // Apply Bharati Modifiers
    if (scenario.bharatiMod) {
      const mod = scenario.bharatiMod;
      this.liveState.bharati.temperature = Number((baseBharati.temperature + (mod.tempOffset || 0)).toFixed(1));
      this.liveState.bharati.windSpeed = Number((baseBharati.windSpeed + (mod.windOffset || 0)).toFixed(1));
      this.liveState.bharati.powerConsumption = Number((baseBharati.powerConsumption + (mod.powerOffset || 0)).toFixed(1));

      if (mod.fuelLevel !== undefined) {
        this.liveState.bharati.fuel = mod.fuelLevel;
        this.liveState.bharati.resources.fuelLevelPct = mod.fuelLevel;
      } else {
        this.liveState.bharati.fuel = baseBharati.fuel;
        this.liveState.bharati.resources.fuelLevelPct = baseBharati.resources.fuelLevelPct;
      }

      if (mod.commsStatus) {
        this.liveState.bharati.communicationStatus = mod.commsStatus;
      } else {
        this.liveState.bharati.communicationStatus = baseBharati.communicationStatus;
      }

      if (mod.alert) {
        this.liveState.bharati.primaryAlert = mod.alert.split(':')[0];
      } else {
        this.liveState.bharati.primaryAlert = baseBharati.primaryAlert;
      }
    }

    // Evaluate live risk indicators
    this.evaluateRiskLevels();
  }

  /**
   * Automated Risk Assessment Engine
   * Dynamically assigns risk levels based on telemetry rules:
   * - Fuel < 20% -> HIGH RISK (Critical)
   * - Temperature < -30°C -> HIGH RISK
   * - Wind > 50 km/h -> HIGH RISK / ADVISORY
   */
  evaluateRiskLevels() {
    ['maitri', 'bharati'].forEach((stationKey) => {
      const station = this.liveState[stationKey];
      let riskScore = 0;

      // Rule 1: Extreme Temperature
      if (station.temperature <= -35.0) riskScore += 2;
      else if (station.temperature <= -28.0) riskScore += 1;

      // Rule 2: High Wind Velocity
      if (station.windSpeed >= 50.0) riskScore += 2;
      else if (station.windSpeed >= 40.0) riskScore += 1;

      // Rule 3: Fuel Reserve Depletion
      if (station.fuel <= 20) riskScore += 3;
      else if (station.fuel <= 35) riskScore += 1;

      // Rule 4: Battery Buffer
      if (station.battery <= 40) riskScore += 2;

      // Rule 5: Comms State
      if (station.communicationStatus.includes("DEGRADED") || station.communicationStatus.includes("OFFLINE")) {
        riskScore += 2;
      }

      // Assign final evaluated Risk Level
      if (riskScore >= 3) {
        station.riskLevel = "HIGH RISK";
      } else if (riskScore >= 2) {
        station.riskLevel = "MODERATE RISK";
      } else {
        station.riskLevel = "LOW RISK";
      }
    });
  }

  /**
   * Perform a single tick of randomized live sensor micro-fluctuations
   */
  stepSimulationTick() {
    ['maitri', 'bharati'].forEach((stationKey) => {
      const station = this.liveState[stationKey];
      
      // Minor micro-fluctuations simulating real-time digital twin telemetry
      const tempDelta = Number(((Math.random() - 0.5) * 0.2).toFixed(2));
      const windDelta = Number(((Math.random() - 0.5) * 0.8).toFixed(1));
      const powerDelta = Number(((Math.random() - 0.5) * 0.4).toFixed(1));

      station.temperature = Number((station.temperature + tempDelta).toFixed(1));
      station.windSpeed = Math.max(10, Number((station.windSpeed + windDelta).toFixed(1)));
      station.powerConsumption = Math.max(20, Number((station.powerConsumption + powerDelta).toFixed(1)));
      station.lastUpdated = new Date().toISOString();
    });

    this.notify();
  }

  /**
   * Start periodic simulation background clock
   */
  startSimulation(intervalMs = 3000) {
    if (this.isRunning) return;
    this.tickIntervalMs = intervalMs;
    this.isRunning = true;
    this.timerId = setInterval(() => {
      this.stepSimulationTick();
    }, this.tickIntervalMs);
  }

  /**
   * Stop periodic simulation
   */
  stopSimulation() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.isRunning = false;
  }

  /**
   * Reset all station data to nominal baseline
   */
  resetToNominal() {
    this.currentScenarioKey = "NOMINAL";
    this.liveState = {
      maitri: cloneState(MAITRI),
      bharati: cloneState(BHARATI),
      lastUpdated: new Date().toISOString()
    };
    this.evaluateRiskLevels();
    this.notify();
  }

  /**
   * Injects custom telemetry updates directly for a specific station
   */
  injectCustomTelemetry(stationId, updates = {}) {
    const key = (stationId || "").toLowerCase();
    if (this.liveState[key]) {
      this.liveState[key] = {
        ...this.liveState[key],
        ...updates
      };
      this.evaluateRiskLevels();
      this.notify();
    }
  }

  /**
   * -------------------------------------------------------------
   * FastAPI / REST / WebSocket Backend Integration Layer
   * -------------------------------------------------------------
   */
  async fetchStationFromBackend(stationId, baseUrl = "/api/v1") {
    try {
      const res = await fetch(`${baseUrl}/stations/${stationId}`);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data = await res.json();
      this.injectCustomTelemetry(stationId, data);
      return data;
    } catch (err) {
      console.warn(`[FastAPI Bridge] Backend endpoint unreachable for ${stationId}. Using in-browser simulation.`);
      return this.getStation(stationId);
    }
  }

  connectWebSocket(wsUrl = "ws://localhost:8000/ws/telemetry") {
    try {
      const socket = new WebSocket(wsUrl);
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload && payload.stationId) {
          this.injectCustomTelemetry(payload.stationId, payload);
        }
      };
      socket.onerror = (err) => {
        console.warn("[WebSocket Bridge] Connection failed, using in-browser simulation engine.");
      };
      return socket;
    } catch (err) {
      console.warn("[WebSocket Bridge] WebSocket initialization error:", err);
      return null;
    }
  }
}

// Export singleton instance
export const simulationService = new SimulationService();
export default simulationService;

