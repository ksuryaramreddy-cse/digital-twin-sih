/**
 * Centralized Antarctic Station Data Model (AIP-DT)
 * 
 * This model serves as the single source of truth for:
 * - Maitri Station Dashboard (/maitri)
 * - Bharati Station Dashboard (/bharati)
 * - Antarctic Digital Twin (/digital-twin)
 * 
 * Architecture Note:
 * This data structure can later be replaced or populated by a FastAPI backend
 * (e.g. GET /api/v1/stations or WebSocket /ws/telemetry) without requiring changes
 * to the UI components.
 */

export const MAITRI = {
  // Canonical Top-Level Properties
  stationId: "maitri",
  stationName: "MAITRI",
  subtitle: "Antarctic Research Station",
  code: "IND-MAITRI-02",
  type: "Inland Oasis Station",
  status: "ONLINE",
  riskLevel: "HIGH RISK", // Triggered by EXTREME COLD (-35°C / Chill -48.2°C)
  primaryAlert: "EXTREME COLD",
  overallHealth: 96.8,
  lastUpdated: new Date().toISOString(),

  // Key Telemetry Scalar Values
  temperature: -35.0,
  windSpeed: 52.0,
  humidity: 61,
  pressure: 984.0,
  battery: 78,
  fuel: 72,
  water: 84,
  powerConsumption: 48.6,
  generatorStatus: "NORMAL",
  generatorLoad: 78,
  communicationStatus: "ONLINE",

  // Coordinates & Map Placement (Polar Stereographic 800x600 coordinates)
  mapCoordinates: {
    x: 310,
    y: 215,
    sector: "Queen Maud Land (0° - 20° E Sector)"
  },
  coordinates: {
    lat: "70°45′57″ S",
    long: "11°44′09″ E",
    decimalLat: -70.765833,
    decimalLong: 11.735833,
    region: "Schirmacher Oasis, Queen Maud Land",
    elevation: "117 m above sea level"
  },
  established: "1989",
  crewCapacity: {
    current: 24,
    maxWinter: 25,
    maxSummer: 65
  },

  // Detailed Environmental Metrics
  environment: {
    temperature: -35.0,
    feelsLike: -48.2,
    windSpeed: 52.0,
    windGust: 74.0,
    windDirection: "SE (135°)",
    humidity: 61,
    pressure: 984.0,
    weatherCondition: "Extreme Cold / Katabatic Gale",
    visibility: 14.0,
    solarRadiation: 8.5,
    uvIndex: 0.6,
    snowAccumulation24h: 4.2
  },

  // Detailed Energy Metrics
  energy: {
    batteryLevel: 78,
    batteryCapacityKWh: 320,
    batteryStoredKWh: 249.6,
    batteryVoltage: 48.4,
    batteryRunTimeHours: 14.2,
    batteryHealth: "EXCELLENT",
    batteryStatus: "FLOATING",
    
    powerConsumptionKW: 48.6,
    powerGenerationKW: 62.5,
    generatorStatus: "NORMAL",
    generatorLoadPct: 78,
    gridVoltage: 415.2,
    gridFrequency: 50.08,
    dailyEnergyKWh: 1166.4,

    generators: [
      { id: "GEN-01", name: "Kirloskar 62.5 kVA (Primary)", status: "RUNNING", loadPct: 78, outputKW: 48.6, coolantTempC: 82, oilPressureBar: 4.2, rpm: 1500 },
      { id: "GEN-02", name: "Kirloskar 62.5 kVA (Auxiliary)", status: "HOT_STANDBY", loadPct: 0, outputKW: 0, coolantTempC: 58, oilPressureBar: 0, rpm: 0 },
      { id: "GEN-03", name: "Cummins 62.5 kVA (Emergency)", status: "COLD_STANDBY", loadPct: 0, outputKW: 0, coolantTempC: 22, oilPressureBar: 0, rpm: 0 }
    ]
  },

  // Detailed Resource Metrics
  resources: {
    fuelLevelPct: 72,
    fuelCurrentLitres: 48200,
    fuelCapacityLitres: 67000,
    fuelBurnRateLPH: 24.5,
    fuelDaysRemaining: 82,
    fuelType: "Jet-A1 Polar Low Pour Fuel",

    waterLevelPct: 84,
    waterCurrentLitres: 25200,
    waterCapacityLitres: 30000,
    waterSource: "Lake Priyadarshini Sub-Ice Pipeline",
    waterPumpFlowRateLPM: 18.5,
    waterPurityTDS: 16.4,
    waterPH: 7.3,
    waterDailyUsageLitres: 1450,

    criticalResourceStatus: "NOMINAL",
    overallReserveSafetyMargin: "SAFE (82+ Days Autonomy)"
  },

  // Equipment Fleet
  equipment: [
    {
      id: "EQ-GEN",
      name: "Generator System",
      category: "Power Generation",
      status: "NORMAL",
      operationalHealth: 98,
      primaryUnit: "Kirloskar 62.5 kVA Turbo",
      runtimeHours: 4280,
      nextMaintenance: "120 hrs",
      temperatureC: 82,
      details: "GEN-01 Active at 78% Load • 50.08 Hz • GEN-02 in Hot Standby"
    },
    {
      id: "EQ-HEAT",
      name: "Heating System",
      category: "Thermal Life Support",
      status: "OPTIMAL",
      operationalHealth: 97,
      primaryUnit: "Hydronic Radiant & Trace Heat",
      runtimeHours: 8760,
      nextMaintenance: "340 hrs",
      temperatureC: 21.4,
      details: "Main Habitat +21.4°C • Lake Pipeline Trace Heating +8.2°C • Storage +65°C"
    },
    {
      id: "EQ-POWER",
      name: "Power System",
      category: "Microgrid Distribution",
      status: "OPERATIONAL",
      operationalHealth: 99,
      primaryUnit: "415V 3-Phase Polar Bus",
      runtimeHours: 12450,
      nextMaintenance: "500 hrs",
      temperatureC: 32,
      details: "48.6 kW Active Load • 320 kWh LiFePO4 Battery Buffer Floating at 78%"
    },
    {
      id: "EQ-COMM",
      name: "Communication System",
      category: "Satellite & Telemetry",
      status: "ONLINE",
      operationalHealth: 96,
      primaryUnit: "GSAT-30 Ku-Band (ISRO)",
      runtimeHours: 6540,
      nextMaintenance: "210 hrs",
      temperatureC: 24,
      details: "18.5 Mbps Uplink • 35.0 Mbps Downlink • Iridium Certus Backup Live"
    }
  ],

  // Active Alerts
  alerts: [
    {
      id: "ALT-EXT-COLD",
      type: "Extreme Cold",
      severity: "warning",
      status: "ACTIVE WARNING",
      message: "Ambient temperature dropped to -35.0°C (Wind chill -48.2°C). Outdoor excursions restricted.",
      timestamp: "12:14 UTC",
      threshold: "Trigger: < -30.0°C",
      currentValue: "-35.0°C",
      ack: false
    },
    {
      id: "ALT-HIGH-WIND",
      type: "High Wind",
      severity: "warning",
      status: "ACTIVE ADVISORY",
      message: "Katabatic gale winds at 52.0 km/h with gusts exceeding 74.0 km/h from SE sector.",
      timestamp: "11:50 UTC",
      threshold: "Trigger: > 50.0 km/h",
      currentValue: "52.0 km/h (Gusts: 74 km/h)",
      ack: false
    },
    {
      id: "ALT-LOW-BATT",
      type: "Low Battery",
      severity: "normal",
      status: "NOMINAL",
      message: "Battery bank level at 78% (249.6 kWh). System is on floating charge from GEN-01.",
      timestamp: "11:00 UTC",
      threshold: "Trigger: < 40.0%",
      currentValue: "78% (Safe)",
      ack: true
    },
    {
      id: "ALT-LOW-FUEL",
      type: "Low Fuel",
      severity: "normal",
      status: "NOMINAL",
      message: "Diesel storage at 72% (48,200 Litres). 82 days of autonomy remaining.",
      timestamp: "09:30 UTC",
      threshold: "Trigger: < 30.0%",
      currentValue: "72% (48,200 L)",
      ack: true
    },
    {
      id: "ALT-EQ-WARN",
      type: "Equipment Warning",
      severity: "info",
      status: "INFO ADVISORY",
      message: "Lake Priyadarshini trace-heating loop 2 automated anti-freeze cycle active (+8.2°C).",
      timestamp: "08:15 UTC",
      threshold: "Trace Line < +4.0°C",
      currentValue: "+8.2°C (Optimal)",
      ack: true
    }
  ],

  // 24-Hour Historical Time-Series Data
  historicalData: [
    { time: "00:00", temp: -36.2, fuelPct: 73.2, fuelLitres: 49044, batteryPct: 80.0, powerKW: 46.2, genLoadPct: 74, wind: 44 },
    { time: "02:00", temp: -36.8, fuelPct: 73.0, fuelLitres: 48910, batteryPct: 79.2, powerKW: 45.4, genLoadPct: 73, wind: 46 },
    { time: "04:00", temp: -37.4, fuelPct: 72.8, fuelLitres: 48776, batteryPct: 78.5, powerKW: 45.0, genLoadPct: 72, wind: 50 },
    { time: "06:00", temp: -36.9, fuelPct: 72.6, fuelLitres: 48642, batteryPct: 77.8, powerKW: 49.2, genLoadPct: 79, wind: 54 },
    { time: "08:00", temp: -35.8, fuelPct: 72.4, fuelLitres: 48508, batteryPct: 77.0, powerKW: 52.8, genLoadPct: 84, wind: 56 },
    { time: "10:00", temp: -35.2, fuelPct: 72.2, fuelLitres: 48374, batteryPct: 77.5, powerKW: 51.5, genLoadPct: 82, wind: 55 },
    { time: "12:00", temp: -35.0, fuelPct: 72.0, fuelLitres: 48200, batteryPct: 78.0, powerKW: 48.6, genLoadPct: 78, wind: 52 },
    { time: "14:00", temp: -35.4, fuelPct: 71.8, fuelLitres: 48066, batteryPct: 78.4, powerKW: 50.2, genLoadPct: 80, wind: 49 },
    { time: "16:00", temp: -35.9, fuelPct: 71.6, fuelLitres: 47932, batteryPct: 78.0, powerKW: 51.0, genLoadPct: 82, wind: 51 },
    { time: "18:00", temp: -36.3, fuelPct: 71.4, fuelLitres: 47798, batteryPct: 77.6, powerKW: 49.8, genLoadPct: 80, wind: 53 },
    { time: "20:00", temp: -36.7, fuelPct: 71.2, fuelLitres: 47664, batteryPct: 77.2, powerKW: 48.0, genLoadPct: 77, wind: 50 },
    { time: "22:00", temp: -37.0, fuelPct: 71.0, fuelLitres: 47530, batteryPct: 77.0, powerKW: 46.5, genLoadPct: 74, wind: 48 }
  ],

  // Specialized Maitri Subsystems
  lakePriyadarshini: {
    lakeIceThicknessMeters: 1.92,
    subIceWaterTempC: 3.4,
    pipelineTraceHeatingTempC: 8.2,
    pumpStatus: "ACTIVE",
    flowRateLPM: 18.5,
    storageReservoirCapacityL: 30000,
    currentWaterStoredL: 25200,
    storagePercentage: 84.0,
    waterPurityTDS: 16.4,
    phLevel: 7.3
  },

  sciencePayloads: [
    { name: "Dobson Ozone Spectrophotometer", category: "Atmosphere", status: "ONLINE", value: "218 DU", health: "Optimal", metricLabel: "Total Column Ozone" },
    { name: "Digital Fluxgate Magnetometer", category: "Geomagnetism", status: "ONLINE", value: "42,850 nT", health: "Optimal", metricLabel: "Magnetic Field Intensity" },
    { name: "Broadband Digital Seismograph", category: "Seismology", status: "ONLINE", value: "0.02 mm/s", health: "Normal", metricLabel: "Crustal Micro-tremor" },
    { name: "GPS Solid Earth Geodetic Sensor", category: "Geodesy", status: "ONLINE", value: "+1.2 mm/yr", health: "Optimal", metricLabel: "Continental Drift Vector" },
    { name: "Aerosol Optical Depth LIDAR", category: "Climate", status: "CALIBRATING", value: "0.038 AOD", health: "Calibrating", metricLabel: "Optical Depth" }
  ]
};

export const BHARATI = {
  // Canonical Top-Level Properties
  stationId: "bharati",
  stationName: "BHARATI",
  subtitle: "Antarctic Research Station",
  code: "IND-BHARATI-03",
  type: "Modern Aerodynamic Coastal Station",
  status: "ONLINE",
  riskLevel: "HIGH RISK", // Triggered by LOW FUEL (18% < 25% critical threshold)
  primaryAlert: "LOW FUEL",
  overallHealth: 94.2,
  lastUpdated: new Date().toISOString(),

  // Key Telemetry Scalar Values
  temperature: -24.0,
  windSpeed: 41.0,
  humidity: 54,
  pressure: 992.0,
  battery: 68,
  fuel: 18, // CRITICAL VALUE
  water: 76,
  powerConsumption: 118.5,
  generatorStatus: "NORMAL",
  generatorLoad: 83,
  communicationStatus: "ONLINE",

  // Coordinates & Map Placement (Polar Stereographic 800x600 coordinates)
  mapCoordinates: {
    x: 580,
    y: 260,
    sector: "Larsemann Hills, Prydz Bay (70° - 80° E Sector)"
  },
  coordinates: {
    lat: "69°24′28″ S",
    long: "76°11′14″ E",
    decimalLat: -69.407778,
    decimalLong: 76.187222,
    region: "Larsemann Hills, Prydz Bay",
    elevation: "35 m above sea level"
  },
  established: "2012",
  crewCapacity: {
    current: 44,
    maxWinter: 47,
    maxSummer: 72
  },

  // Detailed Environmental Metrics
  environment: {
    temperature: -24.0,
    feelsLike: -36.4,
    windSpeed: 41.0,
    windGust: 62.0,
    windDirection: "ENE (070°)",
    humidity: 54,
    pressure: 992.0,
    weatherCondition: "Coastal Blizzard / Freezing Fog Over Bay",
    visibility: 18.0,
    solarRadiation: 38.5,
    uvIndex: 1.2,
    snowAccumulation24h: 1.8
  },

  // Detailed Energy Metrics
  energy: {
    batteryLevel: 68,
    batteryCapacityKWh: 500,
    batteryStoredKWh: 340.0,
    batteryVoltage: 400.0,
    batteryRunTimeHours: 11.5,
    batteryHealth: "GOOD",
    batteryStatus: "FLOATING",

    powerConsumptionKW: 118.5,
    powerGenerationKW: 142.0,
    generatorStatus: "NORMAL",
    generatorLoadPct: 83,
    gridVoltage: 400.0,
    gridFrequency: 50.02,
    dailyEnergyKWh: 2844.0,
    chpThermalRecoveryKW: 88.4,

    generators: [
      { id: "CHP-GEN-01", name: "Volvo Penta 100 kVA (Primary)", status: "RUNNING", loadPct: 85, outputKW: 68.2, coolantTempC: 88, oilPressureBar: 4.5, rpm: 1500, heatRecoveryEfficiencyPct: 91 },
      { id: "CHP-GEN-02", name: "Volvo Penta 100 kVA (Co-Gen)", status: "RUNNING", loadPct: 58, outputKW: 46.5, coolantTempC: 82, oilPressureBar: 4.2, rpm: 1500, heatRecoveryEfficiencyPct: 88 },
      { id: "CHP-GEN-03", name: "Volvo Penta 100 kVA (Standby)", status: "HOT_STANDBY", loadPct: 0, outputKW: 0, coolantTempC: 55, oilPressureBar: 0, rpm: 0, heatRecoveryEfficiencyPct: 0 },
      { id: "H2-FUELCELL-01", name: "Experimental PEM Fuel Cell", status: "RUNNING", loadPct: 76, outputKW: 3.8, coolantTempC: 42, oilPressureBar: 0, rpm: 0, heatRecoveryEfficiencyPct: 94 }
    ]
  },

  // Detailed Resource Metrics (Fuel at 18% -> CRITICAL)
  resources: {
    fuelLevelPct: 18,
    fuelCurrentLitres: 20160,
    fuelCapacityLitres: 112000,
    fuelBurnRateLPH: 32.0,
    fuelDaysRemaining: 26,
    fuelType: "Jet-A1 Polar Low Pour Diesel",
    fuelStatus: "CRITICAL",

    waterLevelPct: 76,
    waterCurrentLitres: 33440,
    waterCapacityLitres: 44000,
    waterSource: "Reverse-Osmosis Seawater Desalination",
    waterDesalinationRateLPD: 2200,
    waterPurityTDS: 28.0,
    waterPH: 7.2,
    waterDailyUsageLitres: 1850,

    criticalResourceStatus: "WARNING: LOW FUEL RESERVES (18%)",
    overallReserveSafetyMargin: "RESERVES CRITICAL (< 30 Days Supply)"
  },

  // Equipment Fleet
  equipment: [
    {
      id: "EQ-BH-GEN",
      name: "Generator System (CHP)",
      category: "Combined Heat & Power",
      status: "NORMAL",
      operationalHealth: 96,
      primaryUnit: "Volvo Penta D7A-T Dual Genset",
      runtimeHours: 6120,
      nextMaintenance: "80 hrs",
      temperatureC: 88,
      details: "GEN-01 & GEN-02 Active in Parallel • 88.4 kW Heat Recovers to Building Radiant Loop"
    },
    {
      id: "EQ-BH-HEAT",
      name: "Heating System",
      category: "District Radiator & CHP Loop",
      status: "OPTIMAL",
      operationalHealth: 98,
      primaryUnit: "Automated CHP Exhaust Heat Exchanger",
      runtimeHours: 14200,
      nextMaintenance: "260 hrs",
      temperatureC: 22.0,
      details: "Habitat Radiator Delivery +22.0°C • Exhaust Heat Recovery Efficiency 91%"
    },
    {
      id: "EQ-BH-COMM",
      name: "Communication System",
      category: "ISRO Earth Station & Satellite",
      status: "ONLINE",
      operationalHealth: 99,
      primaryUnit: "11m Radome Antenna + GSAT-30",
      runtimeHours: 8900,
      nextMaintenance: "180 hrs",
      temperatureC: 22,
      details: "1.2 Gbps Cartosat/RISAT Downlink • 65 Mbps Uplink • Inmarsat Global Xpress Ready"
    },
    {
      id: "EQ-BH-POWER",
      name: "Power Systems",
      category: "400V Microgrid Distribution",
      status: "OPERATIONAL",
      operationalHealth: 95,
      primaryUnit: "400V 3-Phase Bus + 500 kWh BESS",
      runtimeHours: 16800,
      nextMaintenance: "420 hrs",
      temperatureC: 34,
      details: "118.5 kW Active Load • 500 kWh Battery Bank at 68% • PEM Fuel Cell 3.8 kW Online"
    }
  ],

  // Active Alerts
  alerts: [
    {
      id: "ALT-BH-FUEL",
      type: "Low Fuel",
      severity: "critical",
      status: "CRITICAL ALERT",
      message: "Diesel storage dropped to 18% (20,160 L remaining). Estimated 26 days autonomy. Prioritize load-shedding and schedule summer tanker resupply.",
      timestamp: "12:20 UTC",
      threshold: "Critical Threshold: < 25.0%",
      currentValue: "18% (20,160 L)",
      ack: false
    },
    {
      id: "ALT-BH-WEATHER",
      type: "Extreme Weather",
      severity: "warning",
      status: "ACTIVE ADVISORY",
      message: "Coastal wind at 41.0 km/h with gusts to 62.0 km/h and marine freezing fog over Prydz Bay.",
      timestamp: "11:45 UTC",
      threshold: "Trigger: Gusts > 60.0 km/h",
      currentValue: "41.0 km/h (Gusts: 62 km/h)",
      ack: false
    },
    {
      id: "ALT-BH-BATT",
      type: "Low Battery",
      severity: "normal",
      status: "NOMINAL",
      message: "Battery buffer operating at 68% (340.0 kWh). Healthy floating charge buffer from CHP generators.",
      timestamp: "10:30 UTC",
      threshold: "Trigger: < 40.0%",
      currentValue: "68% (Safe Nominal)",
      ack: true
    },
    {
      id: "ALT-BH-EQ",
      type: "Equipment Warning",
      severity: "info",
      status: "INFO ADVISORY",
      message: "Aerodynamic Stilt-North hydraulic damper active under 41 km/h wind shear load (128.4 kN).",
      timestamp: "09:10 UTC",
      threshold: "Stilt Load > 180 kN",
      currentValue: "128.4 kN (Nominal Load)",
      ack: true
    },
    {
      id: "ALT-BH-COMM",
      type: "Communication Warning",
      severity: "normal",
      status: "ONLINE / NOMINAL",
      message: "ISRO 11m tracking antenna locked on Cartosat-3 pass. High-rate downlink established at 1.2 Gbps.",
      timestamp: "08:40 UTC",
      threshold: "Link Margin < 3.0 dB",
      currentValue: "+15.4 dB Link Margin",
      ack: true
    }
  ],

  // 24-Hour Historical Time-Series Data
  historicalData: [
    { time: "00:00", temp: -25.2, fuelPct: 19.8, fuelLitres: 22176, batteryPct: 70.0, powerKW: 110.0, chpHeatKW: 82.0, wind: 38 },
    { time: "02:00", temp: -25.8, fuelPct: 19.5, fuelLitres: 21840, batteryPct: 69.2, powerKW: 108.0, chpHeatKW: 81.0, wind: 39 },
    { time: "04:00", temp: -26.1, fuelPct: 19.2, fuelLitres: 21504, batteryPct: 68.5, powerKW: 109.5, chpHeatKW: 83.0, wind: 40 },
    { time: "06:00", temp: -25.5, fuelPct: 18.9, fuelLitres: 21168, batteryPct: 68.0, powerKW: 116.0, chpHeatKW: 86.0, wind: 42 },
    { time: "08:00", temp: -24.6, fuelPct: 18.6, fuelLitres: 20832, batteryPct: 67.5, powerKW: 124.0, chpHeatKW: 92.0, wind: 45 },
    { time: "10:00", temp: -24.2, fuelPct: 18.3, fuelLitres: 20496, batteryPct: 67.8, powerKW: 128.0, chpHeatKW: 94.0, wind: 43 },
    { time: "12:00", temp: -24.0, fuelPct: 18.0, fuelLitres: 20160, batteryPct: 68.0, powerKW: 118.5, chpHeatKW: 88.4, wind: 41 },
    { time: "14:00", temp: -24.3, fuelPct: 17.7, fuelLitres: 19824, batteryPct: 68.4, powerKW: 122.0, chpHeatKW: 90.0, wind: 40 },
    { time: "16:00", temp: -24.8, fuelPct: 17.4, fuelLitres: 19488, batteryPct: 68.0, powerKW: 120.0, chpHeatKW: 89.0, wind: 42 },
    { time: "18:00", temp: -25.2, fuelPct: 17.1, fuelLitres: 19152, batteryPct: 67.6, powerKW: 121.0, chpHeatKW: 88.0, wind: 44 },
    { time: "20:00", temp: -25.6, fuelPct: 16.8, fuelLitres: 18816, batteryPct: 67.2, powerKW: 119.0, chpHeatKW: 87.0, wind: 43 },
    { time: "22:00", temp: -25.9, fuelPct: 16.5, fuelLitres: 18480, batteryPct: 67.0, powerKW: 114.0, chpHeatKW: 84.0, wind: 40 }
  ],

  // Specialized Bharati Subsystems
  aerodynamicStructure: {
    groundClearanceMeters: 4.0,
    stiltLoadShear: [
      { stiltId: "Stilt-North-1", loadKN: 128.4, vibrationHz: 1.4, tiltDeg: 0.02, health: "Optimal" },
      { stiltId: "Stilt-North-2", loadKN: 131.2, vibrationHz: 1.5, tiltDeg: 0.03, health: "Optimal" },
      { stiltId: "Stilt-South-1", loadKN: 122.8, vibrationHz: 1.2, tiltDeg: 0.01, health: "Optimal" },
      { stiltId: "Stilt-South-2", loadKN: 125.0, vibrationHz: 1.3, tiltDeg: 0.02, health: "Optimal" }
    ],
    snowDriftClearanceUnderneath: "100% Free / No Drift Accumulation",
    windShearDeflectionMm: 2.1,
    structuralSafetyFactor: "4.1x Rated Limit"
  },

  isroEarthStation: {
    antenna11Meters: {
      dishId: "ISRO-BGS-ANT-01 (11.0m Radome)",
      status: "TRACKING_ACTIVE",
      targetSatellite: "Cartosat-3 (Pass #14882)",
      trackingBand: "X-Band / S-Band",
      azimuth: 144.6,
      elevation: 41.2,
      linkMarginDb: 15.4,
      dataDownlinkThroughputGbps: 1.2,
      nextScheduledPass: "RISAT-2B in 28 mins"
    },
    antennaAuxiliary: {
      dishId: "ISRO-BGS-ANT-02 (7.5m Open)",
      status: "STANDBY_READY",
      targetSatellite: "Oceansat-3",
      trackingBand: "Ka-Band",
      azimuth: 0.0,
      elevation: 90.0,
      linkMarginDb: 0.0,
      dataDownlinkThroughputGbps: 0.0,
      nextScheduledPass: "Oceansat-3 in 1 hr 14 min"
    }
  },

  sciencePayloads: [
    { name: "ISRO Earth Observation Ground Station", category: "Space Science", status: "ONLINE", value: "1.2 Gbps", health: "Optimal", metricLabel: "Data Downlink Rate" },
    { name: "Prydz Bay Acoustic Doppler Current Profiler", category: "Oceanography", status: "ONLINE", value: "0.42 m/s", health: "Optimal", metricLabel: "Current Velocity" },
    { name: "Automatic Weather Station (AWS)", category: "Meteorology", status: "ONLINE", value: "992.0 hPa", health: "Optimal", metricLabel: "Surface Pressure" },
    { name: "Cryosphere Glacier Mass Balance Radar", category: "Glaciology", status: "ONLINE", value: "-0.04 m/a", health: "Optimal", metricLabel: "Ice Mass Balance" },
    { name: "High-Resolution Air Sampling Mass Spec", category: "Atmosphere", status: "ONLINE", value: "419.2 ppm", health: "Optimal", metricLabel: "Ambient CO2" }
  ]
};

// Centralized Station Dictionary
export const stationData = {
  maitri: MAITRI,
  bharati: BHARATI
};

/**
 * Centralized Summary Accessor
 */

export function getDigitalTwinSummary() {
  const totalPersonnel = MAITRI.crewCapacity.current + BHARATI.crewCapacity.current;
  const totalPowerKW = Number((MAITRI.powerConsumption + BHARATI.powerConsumption).toFixed(1));
  const totalFuelL = MAITRI.resources.fuelCurrentLitres + BHARATI.resources.fuelCurrentLitres;
  const averageHealth = Number(((MAITRI.overallHealth + BHARATI.overallHealth) / 2).toFixed(1));

  return {
    totalPersonnel,
    totalPowerKW,
    totalFuelL,
    averageHealth,
    stations: [MAITRI, BHARATI]
  };
}

export default stationData;
