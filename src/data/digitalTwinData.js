import { MAITRI, BHARATI, getDigitalTwinSummary } from './stationData';

const summary = getDigitalTwinSummary();

export const digitalTwinData = {
  systemName: "Antarctic Indian Polar Digital Twin (AIP-DT)",
  platformVersion: "v2.8.4-POLARIS",
  syncState: "SYNCHRONIZED",
  globalUtcTime: new Date().toISOString(),
  
  // Dynamically derived from centralized stationData model
  totalPersonnelInAntarctica: summary.totalPersonnel, // 24 at Maitri + 44 at Bharati
  totalAntarcticPowerOutputKW: summary.totalPowerKW, // 48.6 kW + 118.5 kW = 167.1 kW
  totalFuelReserveLitres: summary.totalFuelL, // 48,200 L + 20,160 L = 68,360 L
  averageContinentHealthPct: summary.averageHealth,
  interStationDistanceKm: 3000,
  tacticalCommsMesh: "ACTIVE (Inter-station Iridium / GSAT-30 relay)",

  // Station Geographic Reference for Tactical SVG Map (polar stereographic projection relative)
  stationsMap: [
    {
      id: "maitri",
      name: MAITRI.stationName + " Station",
      tag: "IND-02",
      coordinates: MAITRI.coordinates,
      region: MAITRI.coordinates.region,
      mapX: 310,
      mapY: 215,
      type: MAITRI.type,
      status: MAITRI.status,
      riskLevel: MAITRI.riskLevel,
      temp: MAITRI.temperature,
      windSpeed: MAITRI.windSpeed,
      powerKW: MAITRI.powerConsumption,
      crew: MAITRI.crewCapacity.current,
      health: MAITRI.overallHealth,
      color: "#00f3ff",
      route: "/maitri"
    },
    {
      id: "bharati",
      name: BHARATI.stationName + " Station",
      tag: "IND-03",
      coordinates: BHARATI.coordinates,
      region: BHARATI.coordinates.region,
      mapX: 580,
      mapY: 260,
      type: BHARATI.type,
      status: BHARATI.status,
      riskLevel: BHARATI.riskLevel,
      temp: BHARATI.temperature,
      windSpeed: BHARATI.windSpeed,
      powerKW: BHARATI.powerConsumption,
      crew: BHARATI.crewCapacity.current,
      health: BHARATI.overallHealth,
      color: "#38bdf8",
      route: "/bharati"
    },
    {
      id: "south_pole",
      name: "Geographic South Pole (Amundsen-Scott Reference)",
      tag: "REF-SP",
      coordinates: { lat: "90°00′00″ S", long: "00°00′00″ E" },
      region: "Polar Plateau",
      mapX: 400,
      mapY: 340,
      type: "Plateau Reference",
      status: "REFERENCE",
      riskLevel: "LOW",
      temp: -54.2,
      windSpeed: 22.0,
      powerKW: 0,
      crew: 48,
      health: 100,
      color: "#94a3b8",
      route: null
    }
  ],

  // Live Polar Satellites Passing Over Antarctica
  satellites: [
    { id: "SAT-01", name: "GSAT-30 (ISRO)", type: "Geostationary Polar Uplink", elevation: "44.2°", az: "012°", status: "LOCKED", latency: "440 ms", throughput: "120 Mbps", health: "Nominal" },
    { id: "SAT-02", name: "Cartosat-3 (ISRO)", type: "Sun-Synchronous Polar LEO", elevation: "68.5°", az: "145°", status: "TRACKING_PASS", latency: "12 ms", throughput: "1.2 Gbps", health: "Optimal" },
    { id: "SAT-03", name: "RISAT-2B (ISRO)", type: "Radar Imaging Polar LEO", elevation: "18.2°", az: "210°", status: "ACQUIRING", latency: "24 ms", throughput: "650 Mbps", health: "Nominal" },
    { id: "SAT-04", name: "Iridium NEXT #144", type: "Low Earth Orbit Mesh", elevation: "82.0°", az: "330°", status: "LOCKED", latency: "85 ms", throughput: "700 Kbps", health: "Optimal" },
    { id: "SAT-05", name: "NOAA-20 (JPSS)", type: "Polar Climate Weather MetOp", elevation: "52.4°", az: "088°", status: "DOWNLINKING", latency: "18 ms", throughput: "15 Mbps", health: "Nominal" }
  ],

  // Side-by-Side Comparative Twin Analytics Matrix dynamically mapped
  comparativeMatrix: [
    { metric: "Operational Status", maitri: `${MAITRI.status} (${MAITRI.riskLevel} Risk)`, bharati: `${BHARATI.status} (${BHARATI.riskLevel} Risk)`, variance: "Synchronized", status: "good" },
    { metric: "Current Personnel", maitri: `${MAITRI.crewCapacity.current} Crew (Wintering)`, bharati: `${BHARATI.crewCapacity.current} Crew (Wintering)`, variance: `${MAITRI.crewCapacity.current + BHARATI.crewCapacity.current} Total Personnel`, status: "neutral" },
    { metric: "Ambient Surface Temp", maitri: `${MAITRI.temperature} °C`, bharati: `${BHARATI.temperature} °C`, variance: `Δ ${(BHARATI.temperature - MAITRI.temperature).toFixed(1)} °C (Maitri colder)`, status: "neutral" },
    { metric: "Surface Wind Velocity", maitri: `${MAITRI.windSpeed} km/h (SE)`, bharati: `${BHARATI.windSpeed} km/h (ENE)`, variance: `Δ ${(MAITRI.windSpeed - BHARATI.windSpeed).toFixed(1)} km/h (Maitri higher)`, status: "neutral" },
    { metric: "Power Grid Demand", maitri: `${MAITRI.powerConsumption} kW / ${MAITRI.energy.powerGenerationKW} kW`, bharati: `${BHARATI.powerConsumption} kW / ${BHARATI.energy.powerGenerationKW} kW`, variance: `${(MAITRI.powerConsumption + BHARATI.powerConsumption).toFixed(1)} kW Total Load`, status: "good" },
    { metric: "Fuel Reserves Remaining", maitri: `${MAITRI.resources.fuelLevelPct}% (${MAITRI.resources.fuelDaysRemaining} days)`, bharati: `${BHARATI.resources.fuelLevelPct}% (${BHARATI.resources.fuelDaysRemaining} days - CRITICAL)`, variance: "Bharati Needs Tanker Resupply", status: "warning" },
    { metric: "Battery Bank Level", maitri: `${MAITRI.battery}% (${MAITRI.energy.batteryStoredKWh} kWh)`, bharati: `${BHARATI.battery}% (${BHARATI.energy.batteryStoredKWh} kWh)`, variance: "Dual Float Charge", status: "good" },
    { metric: "Primary Water Source", maitri: `${MAITRI.resources.waterSource} (${MAITRI.water}%)`, bharati: `${BHARATI.resources.waterSource} (${BHARATI.water}%)`, variance: "Dual Redundancy Types", status: "good" },
    { metric: "Communication Link", maitri: `${MAITRI.communicationStatus} (${MAITRI.equipment[3].primaryUnit})`, bharati: `${BHARATI.communicationStatus} (${BHARATI.equipment[2].primaryUnit})`, variance: "Bharati 1.2 Gbps Downlink Hub", status: "good" },
    { metric: "Heating & Thermal Loop", maitri: MAITRI.equipment[1].status + " (Trace Heated)", bharati: BHARATI.equipment[1].status + " (CHP Radiators)", variance: "CHP Recovers 88.4 kW", status: "good" }
  ],

  // Multi-Station Synchronized 24h Telemetry Curves merged from centralized historicalData
  synchronizedTelemetryTimeline: MAITRI.historicalData.map((mPoint, i) => {
    const bPoint = BHARATI.historicalData[i] || {};
    return {
      time: mPoint.time,
      maitriTemp: mPoint.temp,
      bharatiTemp: bPoint.temp,
      maitriWind: mPoint.wind,
      bharatiWind: bPoint.wind,
      maitriPower: mPoint.powerKW,
      bharatiPower: bPoint.powerKW
    };
  }),

  // Simulation Profiles for Testing Extreme Antarctic Event Scenarios in the Digital Twin
  simulationScenarios: {
    NORMAL: {
      id: "NORMAL",
      name: "Nominal Operations",
      description: "Standard mid-winter polar operations with nominal power generation and weather parameters.",
      systemAlertLevel: "GREEN",
      maitriMod: { tempOffset: 0, windOffset: 0, powerOffset: 0, health: MAITRI.overallHealth, alert: null },
      bharatiMod: { tempOffset: 0, windOffset: 0, powerOffset: 0, health: BHARATI.overallHealth, alert: null }
    },
    KATABATIC_BLIZZARD: {
      id: "KATABATIC_BLIZZARD",
      name: "Katabatic Blizzard Gale (Category 4)",
      description: "Severe katabatic storm flowing from Antarctic ice sheet with gale gusts up to 135 km/h and extreme wind chill.",
      systemAlertLevel: "RED",
      maitriMod: { tempOffset: -8.5, windOffset: +68.0, powerOffset: +12.4, health: 88.2, alert: "HIGH WIND SHEAR / TRACE HEATER MAXIMUM ACTIVE" },
      bharatiMod: { tempOffset: -6.2, windOffset: +74.5, powerOffset: +18.0, health: 87.0, alert: "AERODYNAMIC STILT HYDRAULIC STABILIZER ENGAGED" }
    },
    SOLAR_RADIO_BLACKOUT: {
      id: "SOLAR_RADIO_BLACKOUT",
      name: "Geomagnetic Solar Storm (X2.4 Flare)",
      description: "Severe ionospheric scintillation affecting Ku/C-band high-frequency satellite links over polar cap.",
      systemAlertLevel: "AMBER",
      maitriMod: { tempOffset: 0, windOffset: 0, powerOffset: 0, health: 89.5, alert: "GSAT-30 LINK DEGRADATION - SWITCHED TO IRIDIUM LOW-BAND" },
      bharatiMod: { tempOffset: 0, windOffset: 0, powerOffset: 0, health: 88.4, alert: "ISRO GROUND TRACKING DISH LINK MARGIN REDUCED BY 6.2 dB" }
    },
    GEN_LOAD_SHED: {
      id: "GEN_LOAD_SHED",
      name: "Maitri Gen-1 Trip / Auto Load Shed",
      description: "Simulated unexpected mechanical shutdown of Maitri Primary Generator GEN-01 with automatic bus transfer to GEN-02.",
      systemAlertLevel: "AMBER",
      maitriMod: { tempOffset: 0, windOffset: 0, powerOffset: -14.2, health: 84.0, alert: "GEN-01 OFFLINE - AUX GEN-02 AUTO-STARTED - NON-ESSENTIAL LABS SHED" },
      bharatiMod: { tempOffset: 0, windOffset: 0, powerOffset: 0, health: BHARATI.overallHealth, alert: null }
    }
  }
};

export default digitalTwinData;
