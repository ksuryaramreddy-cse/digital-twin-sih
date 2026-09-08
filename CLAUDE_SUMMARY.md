# CLAUDE SUMMARY: Antarctic Indian Polar Digital Twin (AIP-DT)

> **Document Version:** 2.0  
> **Classification:** Operational Digital Twin Platform & Architecture Reference  
> **Target Audience:** Claude AI Agents, System Engineers, Full-Stack Developers  
> **Status:** Live & Production Synchronized (Vite 5 + FastAPI + Gemini AI)

---

## 1. Project Identity & Overview

| Field | Value |
|---|---|
| **Platform Name** | Antarctic Indian Polar Digital Twin (AIP-DT) |
| **System Code** | SIH / PS 26060 - Antarctica Command Twin |
| **Sponsor / Authority** | National Centre for Polar and Ocean Research (NCPOR) / Ministry of Earth Sciences |
| **Frontend Framework** | Vite v5.4 + React 18 (Pure SPA, JSX, Vanilla Tailwind CSS) |
| **Backend Framework** | FastAPI + Python 3.10+ (Uvicorn, Asynchronous Coroutines) |
| **AI / ML Stack** | Google Gemini Generative AI (1.5 Flash/Pro) + Statistical Anomaly Engine + Predictive Time-Series Forecaster |
| **Local Frontend Port** | `3000` (`http://localhost:3000/digital-twin`) |
| **Local Backend Port** | `8000` (`http://localhost:8000/`, Swagger UI: `http://localhost:8000/docs`) |
| **Primary Cloud Endpoints** | API: `https://maitri-backend-api-1.onrender.com` \| WS: `wss://matri-dashboard-4.onrender.com` |
| **GitHub Repository** | `https://github.com/ksuryaramreddy-cse/digital-twin-sih.git` |

The platform models India's two active Antarctic research stations:
1. **Maitri Station** (Established 1989, Schirmacher Oasis, 70°45'57"S, 11°44'09"E, Elevation 130m) - Inland continental base featuring Lake Priyadarshini water management and atmospheric science payloads.
2. **Bharati Station** (Established 2012, Larsemann Hills, 69°24'28"S, 76°11'14"E, Elevation 35m) - Ultra-modern coastal aerodynamic architectural facility with integrated ISRO Earth Station (IMGEOS) satellite tracking antenna.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph Client ["React 18 Frontend SPA (Port 3000)"]
        UI[Unified Command Center / Station Dashboards]
        CTX[TelemetryContext.jsx - Central Reactive State]
        UTILS[commandCenterUtils.js - KPI & Risk Aggregations]
        SIM_UI[TwinSimulationControl.jsx - Scenario Triggers]
        EDIT[Interactive Editable Field Strips (Battery, Fuel, Water)]
    end

    subgraph Backend ["FastAPI Python Server (Port 8000)"]
        STORE[(In-Memory STATIONS_STORE & 24h Rolling History)]
        TICK[telemetry_tick_loop - 4s Micro-Drift Physics Engine]
        
        subgraph Intelligence_Engines ["AI & Analytical Microservices"]
            ANOM[Anomaly Detection Engine - z-score & thresholds]
            FORE[Predictive Forecasting Engine - Linear & Quadratic Decay]
            DEC[Autonomous Decision Engine - Multi-criteria Risk Matrix]
            SCEN[Physics Scenario Simulator - Stress & Overload Modifiers]
            GEMINI[POLARIS-AI - Google Gemini Diagnostic Assistant]
        end
        
        DB[(MongoDB Optional Database)]
    end

    UI --> CTX
    CTX --> UTILS
    SIM_UI --> CTX
    EDIT --> CTX
    
    CTX -- "3-sec Polling (GET /api/v1/stations/{id})" --> STORE
    CTX -- "Mutation POST (/telemetry, /simulate)" --> STORE
    
    STORE <--> TICK
    STORE --> ANOM
    STORE --> FORE
    STORE --> DEC
    STORE <--> SCEN
    STORE --> GEMINI
    STORE -.-> DB
```

---

## 3. Full Project Directory Structure

```
digital-twin/
├── CLAUDE_SUMMARY.md                          ← [NEW] Comprehensive system onboarding reference
├── digital twin Antarcitica/                  ← Active local working directory & runtime
│   ├── .env                                   ← Local environment secrets (gitignored)
│   ├── .env.example                           ← Environment configuration template
│   ├── .gitignore                             ← Git exclusion rules
│   ├── index.html                             ← HTML5 shell, modern viewport, SVG polar favicon
│   ├── package.json                           ← Frontend dependencies (React 18, Vite, Recharts, Lucide)
│   ├── package-lock.json
│   ├── postcss.config.js                      ← PostCSS pipeline for Tailwind CSS
│   ├── requirements.txt                       ← Python backend dependencies (FastAPI, Uvicorn, Pydantic)
│   ├── tailwind.config.js                     ← Polar visual system (custom polar-* color spectrum)
│   ├── vite.config.js                         ← Vite configuration (host 0.0.0.0, port 3000)
│   ├── README.md                              ← Public repository overview
│   ├── PROJECT_SUMMARY.md                     ← Historical development summary log
│   │
│   ├── backend/                               ← FastAPI Python REST & Intelligence Backend
│   │   ├── main.py                            ← Server entry, routes, STATIONS_STORE, tick coroutine
│   │   ├── config.py                          ← Environment variables & credentials loader
│   │   ├── database.py                        ← MongoDB connector with 500ms timeout & in-memory fallback
│   │   ├── ai_service.py                      ← Google Gemini POLARIS-AI analysis generator
│   │   ├── test_phase4a.py                    ← Test suite for predictive forecasting API
│   │   ├── test_phase5a.py                    ← Test suite for operational decision API
│   │   ├── test_phase7a.py                    ← Test suite for system integration & scenario injection
│   │   └── services/                          ← Backend intelligence modules
│   │       ├── __init__.py
│   │       ├── anomaly_detector.py            ← Rule-based and z-score anomaly detection engine
│   │       ├── forecasting_service.py         ← 6h/12h/24h predictive state forecaster
│   │       ├── decision_engine.py             ← Real-time operational decision & triage engine
│   │       └── scenario_simulation.py         ← Physics scenario stress injection logic
│   │
│   └── src/                                   ← React Frontend Source
│       ├── main.jsx                           ← React DOM mount
│       ├── App.jsx                            ← React Router setup, wrapped in TelemetryProvider
│       ├── index.css                          ← Tailored CSS design tokens, scrollbars, HUD animations
│       │
│       ├── context/
│       │   └── TelemetryContext.jsx           ← Core state hub: dual polling loops, stale timers, REST POSTs
│       │
│       ├── data/
│       │   ├── stationData.js                 ← Master static baselines for Maitri and Bharati
│       │   └── digitalTwinData.js             ← Satellite orbital tracks & geospatial datasets
│       │
│       ├── utils/
│       │   └── commandCenterUtils.js          ← Pure data transformation, KPI calculation & health scores
│       │
│       ├── services/
│       │   ├── simulationService.js           ← SIMULATION_SCENARIOS definitions & parameter maps
│       │   └── useStationSimulation.js        ← Convenience hook alias for useTelemetry()
│       │
│       ├── pages/
│       │   ├── DigitalTwinPage.jsx            ← Master Command Center & Unified 2D Antarctic Map
│       │   ├── MaitriPage.jsx                 ← Dedicated Maitri Station Deep-Dive Engineering Dashboard
│       │   ├── BharatiPage.jsx                ← Dedicated Bharati Station Deep-Dive Engineering Dashboard
│       │   ├── PrivacyPage.jsx                ← Institutional Data Privacy & Encryption Policy
│       │   ├── TermsPage.jsx                  ← Operational Use Guidelines & Defense Standard Terms
│       │   └── NotFoundPage.jsx               ← 404 Route with Navigation Fallback
│       │
│       └── components/
│           ├── command-center/                ← Phase 6B Unified Operations Command Center
│           │   ├── CommandCenterHeader.jsx    ← Command HUD header with status indicator & mode toggles
│           │   ├── MissionStatusBar.jsx       ← Polar Operations status ribbon (Threat levels, sync health)
│           │   ├── PriorityStationCard.jsx    ← Focus card highlighting station needing primary attention
│           │   ├── StationCommandCard.jsx     ← High-density telemetry cards for individual stations
│           │   ├── CrossStationComparison.jsx ← Differential variance analysis between Maitri & Bharati
│           │   ├── IntelligenceReadiness.jsx  ← Live status of 4 AI sub-engines (Anomaly, Forecast, AI, Sim)
│           │   └── ExecutiveSummary.jsx       ← Fleet-wide summaries, fuel reserves & power efficiency
│           │
│           ├── common/                        ← Reusable intelligence & telemetry widgets
│           │   ├── AnomalyIntelligenceCard.jsx← Live anomaly feed, classification & severity tags
│           │   ├── PredictiveForecastCard.jsx ← Multi-horizon forecast projections & trend slopes
│           │   ├── OperationalDecisionCard.jsx← Automated action directives, rationale & risk impacts
│           │   ├── ScenarioSimulator.jsx      ← Stress scenario activator with parameter previews
│           │   ├── MetricCard.jsx             ← Standardized KPI metric tile with progress bar
│           │   ├── SensorChart.jsx            ← Recharts wrapper for telemetry time series
│           │   └── StatusBadge.jsx            ← Semantic status pill badge
│           │
│           ├── digitalTwin/                   ← Digital Twin page specialized components
│           │   ├── TwinHeader.jsx             ← Polar Command navigation & title banner
│           │   ├── TwinAntarcticMap2D.jsx     ← High-contrast vector polar map with station coordinates
│           │   ├── TwinStationCards.jsx       ← Dual station telemetry glance cards
│           │   ├── TwinSimulationControl.jsx  ← Scenario trigger buttons and status chips
│           │   ├── StationComparisonGrid.jsx  ← Side-by-side metric matrix comparing stations
│           │   └── OrbitalSatelliteTracker.jsx← Live ISRO/Polar orbit satellite pass schedule
│           │
│           ├── layout/                        ← Global layout containers
│           │   ├── AppLayout.jsx              ← Master layout with header, navigation & footer
│           │   ├── Navbar.jsx                 ← Top navigation bar with station routes & live clock
│           │   └── FooterStatus.jsx           ← Bottom telemetry status strip with sync status
│           │
│           ├── maitri/                        ← Maitri-specific engineering panels
│           │   ├── MaitriHeader.jsx           ← Station banner, coordinates, weather chip
│           │   ├── EnvironmentSection.jsx     ← Temperature, pressure, wind velocity metrics
│           │   ├── EnergySection.jsx          ← Power generation, microgrid load & editable battery field
│           │   ├── ResourcesSection.jsx       ← Water/Fuel storage tanks with interactive update strips
│           │   ├── EquipmentSection.jsx       ← HVAC, Life Support, Generator fleet telemetry
│           │   ├── AlertsSection.jsx          ← Priority alerts and environmental notices
│           │   └── ChartsSection.jsx          ← 24-hour environmental trend graphs
│           │
│           ├── bharati/                       ← Bharati-specific engineering panels
│           │   ├── BharatiHeader.jsx          ← Station banner, Larsemann Hills coordinates
│           │   ├── BharatiEnvironmentSection.jsx
│           │   ├── BharatiEnergySection.jsx   ← Energy microgrid & editable battery input
│           │   ├── BharatiResourcesSection.jsx← Water/Fuel storage with interactive update strips
│           │   ├── BharatiEquipmentSection.jsx← Aerodynamic stilts, HVAC, microgrid telemetry
│           │   ├── BharatiAlertsSection.jsx
│           │   └── BharatiChartsSection.jsx
│           │
│           └── stations/                      ← Station specialized scientific payload panels
│               ├── MaitriSpecialized.jsx      ← Lake Priyadarshini water management & science payloads
│               └── BharatiSpecialized.jsx     ← ISRO IMGEOS Earth Station & aerodynamic stilt hydraulics
│
└── digital-twin-sih/                          ← Clean GitHub clone mirroring ksuryaramreddy-cse/digital-twin-sih
```

---

## 4. Frontend Routing System

Configured in `src/App.jsx` using `react-router-dom` v6. All routes are enclosed within `TelemetryProvider` and `AppLayout`.

| Path | Component | Description |
|---|---|---|
| `/` | `Navigate` | Automatic redirect to `/digital-twin` |
| `/digital-twin` | `DigitalTwinPage` | Master command center, 2D vector polar map, orbital pass tracker, scenario simulator, cross-station variance |
| `/maitri` | `MaitriPage` | Maitri engineering telemetry, Lake Priyadarshini water levels, life support, interactive resource inputs |
| `/bharati` | `BharatiPage` | Bharati engineering telemetry, ISRO ground station satellite links, structural load, interactive resource inputs |
| `/privacy` | `PrivacyPage` | Polar Operations privacy policy, AES-256 telemetry encryption guidelines, institutional compliance |
| `/terms` | `TermsPage` | Polar digital twin operations terms of use, simulation safety disclaimers, NCPOR operational protocol |
| `*` | `NotFoundPage` | 404 handler with fallback navigation to Command Center |

---

## 5. State Management & Live Telemetry Architecture

### 5.1 Single Source of Truth (`src/context/TelemetryContext.jsx`)
All live state is held and distributed by `TelemetryProvider`. Components consume state via the `useTelemetry()` hook.

Key state fields managed:
- `maitri`: Deep nested state object representing Maitri station telemetry
- `bharati`: Deep nested state object representing Bharati station telemetry
- `activeScenario`: Current simulated scenario key (`NOMINAL`, `KATABATIC_BLIZZARD`, `SOLAR_RADIO_BLACKOUT`, `GEN_LOAD_SHED`, `FUEL_EMERGENCY`)
- `connectionStatus` / `twinSyncStatus`: Connection health for Maitri (`LIVE`, `CONNECTING`, `STALE`, `DISCONNECTED`)
- `bharatiConnectionStatus` / `bharatiSyncStatus`: Independent connection health for Bharati
- `updateMaitriField(payload)` / `updateBharatiField(payload)`: Mutator functions that send asynchronous HTTP POST requests to backend and optimistically sync responses
- `setScenario(scenarioKey)`: Injects target physical telemetry modifications into backend `STATIONS_STORE`
- `resetToNominal()`: Restores baseline nominal physical parameters across both stations

### 5.2 Polling & Stale Detection Mechanism
- **Polling Rate:** 3,000 ms (independent `setInterval` for Maitri and Bharati)
- **Endpoint:** `GET /api/v1/stations/{stationId}`
- **Stale Failover:** If no valid response is received within 10,000 ms (`staleTimeoutMs`), status drops to `STALE` and then `DISCONNECTED`
- **Fallback:** If backend is unreachable, the UI gracefully retains the last known state or initializes from static baselines in `stationData.js`.

### 5.3 Interactive Telemetry Overrides (`EditableField`)
Available in Energy and Resource sections of both stations:
- **Maitri:** Battery Level (%), Fuel Reserve (%), Water Storage (%)
- **Bharati:** Battery Level (%), Fuel Reserve (%), Water Storage (%)
- Users can input numbers within valid bounds (0–100%); clicking "Update" fires a `POST /api/v1/stations/{stationId}/telemetry` with immediate feedback ("Saved" or "Error").

---

## 6. Backend Intelligence Engines & API Reference

The backend (`backend/main.py`) runs on FastAPI at port `8000` and provides 10 high-performance REST endpoints.

### 6.1 Backend API Endpoint Reference

| Method | Endpoint | Description | Request Body | Response Shape |
|---|---|---|---|---|
| `GET` | `/` | Root Health & Identity | None | `{"platform": "...", "status": "ONLINE", "gemini_ai_configured": bool}` |
| `GET` | `/api/v1/stations` | Fleet Station Summary | None | `[{"stationId": "maitri", ...}, {"stationId": "bharati", ...}]` |
| `GET` | `/api/v1/stations/{id}` | Real-Time Telemetry Object | None | Flat telemetry dictionary (temp, wind, fuel, battery, water, alerts) |
| `GET` | `/api/v1/stations/{id}/history` | 24-Hour Telemetry Time Series | None | Array of 24 time-series snapshots for charts |
| `GET` | `/api/v1/stations/{id}/anomaly` | Anomaly Detection Analysis | None | `{"stationId": "...", "anomalyCount": int, "anomalies": [...], "status": "NOMINAL/ALERT"}` |
| `GET` | `/api/v1/stations/{id}/forecast` | Predictive Forecaster (6h/12h/24h) | None | Forecast trajectories for temp, wind, fuel, battery, power |
| `GET` | `/api/v1/stations/{id}/decision` | Autonomous Decision Engine | None | `{"primaryAction": "...", "priority": "P1-P4", "recommendedActions": [...], "riskAssessment": "..."}` |
| `POST` | `/api/v1/stations/{id}/simulate` | Physics Scenario Injection | `{"scenario": "KATABATIC_BLIZZARD", "durationHours": 6}` | `{"status": "SIMULATION_ACTIVE", "scenario": "...", "projectedImpact": {...}}` |
| `POST` | `/api/v1/stations/{id}/telemetry` | Mutate Specific Telemetry Fields | `{"fuel": 45.0, "battery": 80.0}` | `{"status": "SUCCESS", "station": {...}}` |
| `POST` | `/api/v1/ai/analyze` | Gemini Diagnostic Assistant | `{"stationId": "maitri", "prompt": "..."}` | `{"stationId": "maitri", "analysis": "..."}` |

### 6.2 The 4 Intelligence Microservices

#### 1. Anomaly Detector (`backend/services/anomaly_detector.py`)
- Evaluates telemetry data against both static safety envelopes and dynamic z-score statistical variations.
- Identifies critical thresholds: Extreme freeze (<-40°C), hurricane winds (>80 km/h), rapid fuel depletion, and power microgrid spikes.
- Emits structured anomaly alerts with severity (`info`, `warning`, `critical`) and actionable remediation suggestions.

#### 2. Forecasting Service (`backend/services/forecasting_service.py`)
- Projects forward estimates over 6-hour, 12-hour, and 24-hour operational horizons.
- Models temperature drops, wind velocity shifts, battery depletion curves, and estimated hours of fuel autonomy remaining.

#### 3. Autonomous Decision Engine (`backend/services/decision_engine.py`)
- Multi-criteria decision engine synthesizing environmental risks, power stability, and life support health.
- Outputs prioritized operational directives (P1 Emergency to P4 Advisory) including generator load-shedding, thermal conservation, and antenna stowage.

#### 4. Scenario Simulation Engine (`backend/services/scenario_simulation.py`)
- Models extreme polar stress conditions and injects calculated environmental offsets into the station's physical state.
- Supports five scenarios:
  - `NOMINAL`: Clear polar conditions, standard operations.
  - `KATABATIC_BLIZZARD`: Temp drops -8.5°C, winds surge +45 km/h, power load spikes.
  - `SOLAR_RADIO_BLACKOUT`: Ionospheric storm degrades satellite and radio communication.
  - `GEN_LOAD_SHED`: Generator fleet trip drops available microgrid power.
  - `FUEL_EMERGENCY`: Fuel levels critically depleted; initiates survival conservation protocol.

---

## 7. UI Design System & Standards

The user interface follows strict military, aerospace, and scientific HUD design guidelines:
- **Tailwind Palette:** Custom `polar-*` spectrum (`polar-950`, `polar-900`, `polar-800`, `polar-750`, `polar-700`) paired with functional HUD accents (`cyan-400` telemetry stream, `emerald-400` nominal health, `amber-400` warning alerts, `rose-400` emergency risks).
- **Typography:** Modern clean sans-serif paired with monospaced data fonts (`font-mono`) for precision telemetry values and coordinates.
- **Editorial Standards:** Zero emojis and zero em dashes in code or UI labels. Clean text, technical acronyms, and SVG icons from `lucide-react`.
- **Responsive Layout:** Optimized for widescreen Command Center displays (1920x1080) and scalable down to tablets and laptops.

---

## 8. Development & Execution Guide

### 8.1 Prerequisites
- Node.js 18+ and npm
- Python 3.10+ with `pip`
- Git (configured with credentials)

### 8.2 Starting the Servers

#### Frontend Dev Server (Vite)
```powershell
cd "digital twin Antarcitica"
npm install
npm run dev
# Running on http://localhost:3000/digital-twin
```

#### Backend API Server (FastAPI)
```powershell
cd "digital twin Antarcitica\backend"
pip install -r ..\requirements.txt
python main.py
# Running on http://localhost:8000
# Documentation at http://localhost:8000/docs
```

### 8.3 Building for Production
```powershell
cd "digital twin Antarcitica"
npm run build
```
Build output is generated cleanly in `dist/` with zero lint or bundling errors.

### 8.4 Verification Test Scripts
The `backend/` directory contains automated test suites:
- `python test_phase4a.py` - Verifies forecasting calculations and schema output.
- `python test_phase5a.py` - Validates autonomous decision matrix and priority levels.
- `python test_phase7a.py` - Runs complete end-to-end integration and scenario stress testing.

---

## 9. Environment Variables Specification

File: `digital twin Antarcitica/.env`

```ini
# Google Gemini Generative AI Credentials
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_gemini_api_key_here

# FastAPI Backend Configuration
PORT=8000
HOST=0.0.0.0
ENVIRONMENT=development

# MongoDB Connection (Optional: in-memory fallback engages automatically if unavailable)
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=antarctic_digital_twin

# Remote Cloud Production Endpoints
VITE_WS_URL=wss://matri-dashboard-4.onrender.com
VITE_API_URL=https://maitri-backend-api-1.onrender.com
```

---

## 10. Git Synchronization & Version History

- **Commit `da94ebe`**: Pruned unused legacy components (`AlertsPanel`, `SubsystemGrid`, `WeatherStation`, `AntarcticMapViewer`, `StationHeroHeader`, `bharatiData`, `maitriData`, `websocket.js`), optimized MongoDB client fallback timeout (500ms), and streamlined station data exports.
- **Commit `0459d5d`**: Imported missing Compass icon in command center and bound Vite server to `0.0.0.0`.
- **Commit `a41398a`**: Enforced design standards (eliminated emojis and em dashes), created privacy and terms pages, and configured SVG polar favicon.
- **Commit `11b611d`**: Completed unified command center with 4 AI engines (Anomaly, Forecasting, Decision, Scenario).
- **Remote Origin**: Synced with `origin/main` at `https://github.com/ksuryaramreddy-cse/digital-twin-sih.git`.
