# CLAUDE PROJECT SUMMARY: Antarctic Indian Polar Digital Twin (AIP-DT)

> **Purpose of this file:** Complete onboarding reference for any Claude agent
> session. Read this first before touching any code. It explains the project
> architecture, every file's role, all changes made since the original build,
> and known limitations / gotchas to be aware of.

---

## 1. Project Identity

| Field | Value |
|---|---|
| Project name | Antarctic Indian Polar Digital Twin (AIP-DT) |
| Internal code | PS 26060 - Antarctica Command Twin |
| Sponsor | Indian Antarctic Research Program (NCPOR / NCAOR) |
| Framework | Vite + React 18 (NOT Next.js) |
| Language | JavaScript / JSX (no TypeScript) |
| Dev server port | 3000 (Vite) |
| Backend port | 8000 (FastAPI / Python) |
| Styling | Tailwind CSS with custom `polar-*` color palette |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router v6 |

The app runs entirely in the browser as a Vite SPA. There is **no Next.js, no
server-side rendering, no server/server.js, and no src/lib/maitri-data.ts** -
all of which were mentioned in an earlier brief but do not exist in this repo.

---

## 2. Complete File Tree

```
digital-twin/
├── CLAUDE_PROJECT_SUMMARY.md          ← you are here
└── digital twin Antarcitica/          ← workspace root (note the space in name)
    ├── .env                           ← real secrets (gitignored)
    ├── .env.example                   ← template
    ├── .gitignore
    ├── index.html
    ├── package.json                   ← Vite + React deps
    ├── package-lock.json
    ├── postcss.config.js
    ├── requirements.txt               ← Python backend deps
    ├── tailwind.config.js             ← custom polar/cyan/emerald palette
    ├── vite.config.js                 ← port 3000, auto-open
    ├── README.md
    │
    ├── backend/                       ← FastAPI Python server
    │   ├── main.py                    ← REST API + in-memory STATIONS_STORE + tick loop
    │   ├── ai_service.py              ← POLARIS-AI via Google Gemini
    │   ├── database.py                ← MongoDB client (optional, graceful fallback)
    │   └── config.py                  ← env var loader
    │
    └── src/                           ← React frontend
        ├── App.jsx                    ← router setup, wraps TelemetryProvider
        ├── main.jsx                   ← entry point
        ├── index.css                  ← global styles + Tailwind directives
        │
        ├── context/
        │   └── TelemetryContext.jsx   ← ★ CORE: all live state, polling, POST helpers
        │
        ├── data/
        │   ├── stationData.js         ← static MAITRI + BHARATI baseline objects
        │   ├── maitriData.js          ← re-export of MAITRI (thin wrapper)
        │   ├── bharatiData.js         ← re-export of BHARATI (thin wrapper)
        │   └── digitalTwinData.js     ← static chart/comparison/satellite data
        │
        ├── services/
        │   ├── simulationService.js   ← SIMULATION_SCENARIOS definitions + SimulationService class
        │   ├── useStationSimulation.js← hook that re-exports useTelemetry()
        │   └── websocket.js           ← legacy WebSocket class (NO LONGER USED by context)
        │
        ├── pages/
        │   ├── MaitriPage.jsx         ← /maitri route
        │   ├── BharatiPage.jsx        ← /bharati route
        │   ├── DigitalTwinPage.jsx    ← /digital-twin route
        │   └── NotFoundPage.jsx       ← 404
        │
        └── components/
            ├── common/
            │   ├── MetricCard.jsx     ← reusable KPI tile with progress bar
            │   ├── SensorChart.jsx    ← Recharts line/area/bar wrapper
            │   ├── StatusBadge.jsx    ← colored status pill (ONLINE/WARNING/etc)
            │   ├── AlertsPanel.jsx    ← collapsible alert list
            │   ├── SubsystemGrid.jsx  ← equipment grid layout
            │   └── WeatherStation.jsx ← weather summary widget
            │
            ├── layout/
            │   ├── AppLayout.jsx      ← nav + footer wrapper
            │   ├── Navbar.jsx         ← top navigation bar
            │   └── FooterStatus.jsx   ← bottom status bar
            │
            ├── maitri/                ← Maitri-specific dashboard sections
            │   ├── MaitriHeader.jsx
            │   ├── EnvironmentSection.jsx
            │   ├── EnergySection.jsx  ← ★ MODIFIED: has editable battery field
            │   ├── ResourcesSection.jsx← ★ MODIFIED: has editable fuel + water fields
            │   ├── EquipmentSection.jsx
            │   ├── AlertsSection.jsx
            │   └── ChartsSection.jsx
            │
            ├── bharati/               ← Bharati-specific dashboard sections
            │   ├── BharatiHeader.jsx
            │   ├── BharatiEnvironmentSection.jsx
            │   ├── BharatiEnergySection.jsx    ← ★ MODIFIED: editable battery
            │   ├── BharatiResourcesSection.jsx  ← ★ MODIFIED: editable fuel + water
            │   ├── BharatiEquipmentSection.jsx
            │   ├── BharatiAlertsSection.jsx
            │   └── BharatiChartsSection.jsx
            │
            ├── digitalTwin/           ← Digital Twin page sections
            │   ├── TwinHeader.jsx
            │   ├── TwinAntarcticMap2D.jsx
            │   ├── TwinStationCards.jsx
            │   ├── TwinSimulationControl.jsx
            │   ├── StationComparisonGrid.jsx
            │   ├── OrbitalSatelliteTracker.jsx
            │   └── AntarcticMapViewer.jsx
            │
            └── stations/              ← specialized subsystem panels
                ├── MaitriSpecialized.jsx   ← Lake Priyadarshini + science payloads
                ├── BharatiSpecialized.jsx  ← ISRO Earth Station + aerodynamic stilts
                └── StationHeroHeader.jsx
```

---

## 3. Routing

Defined in `src/App.jsx`. All routes are wrapped in `TelemetryProvider` then
`AppLayout`.

| Path | Component | Purpose |
|---|---|---|
| `/` | redirect | → `/digital-twin` |
| `/maitri` | `MaitriPage` | Maitri station full dashboard |
| `/bharati` | `BharatiPage` | Bharati station full dashboard |
| `/digital-twin` | `DigitalTwinPage` | Unified twin map, scenarios, comparison |
| `*` | `NotFoundPage` | 404 |

---

## 4. Data Architecture

### 4.1 Static Baseline (`src/data/stationData.js`)

Exports two large objects: `MAITRI` and `BHARATI`. These are the **static
baselines** - they define the starting/reset values. They are NOT the live
state. Key flat scalar fields that the backend mirrors:

```
temperature, windSpeed, humidity, pressure,
battery, fuel, water, powerConsumption,
generatorStatus, generatorLoad, communicationStatus,
status, riskLevel, primaryAlert, alerts
```

Each object also contains deeply nested display-only fields:
`environment{}`, `energy{}` (with `generators[]`), `resources{}`,
`equipment[]`, `alerts[]`, `historicalData[]`, and station-specific
subsystems (`lakePriyadarshini`, `sciencePayloads` for Maitri;
`aerodynamicStructure`, `isroEarthStation` for Bharati).

### 4.2 Live State (`src/context/TelemetryContext.jsx`)

**This is the single source of truth for all live UI state.**

- `maitri` state - driven by polling `GET /api/v1/stations/maitri` every 3s
- `bharati` state - driven by polling `GET /api/v1/stations/bharati` every 3s
- Both start as `cloneState(MAITRI)` / `cloneState(BHARATI)` on mount, then
  are overwritten by the first successful poll

### 4.3 Backend State (`backend/main.py` - `STATIONS_STORE`)

In-memory Python dict. A background `asyncio` task (`telemetry_tick_loop`)
runs every 4 seconds and applies micro-drift to all fields. The frontend polls
this every 3 seconds. The backend is authoritative - whatever value it holds
is what the frontend will display within 3 seconds.

**Field mapping - FastAPI flat fields → React nested state:**

| FastAPI field | React `maitri.` top-level | React nested |
|---|---|---|
| `temperature` | `.temperature` | `.environment.temperature` |
| `windSpeed` | `.windSpeed` | `.environment.windSpeed` |
| `humidity` | `.humidity` | `.environment.humidity` |
| `pressure` | `.pressure` | `.environment.pressure` |
| `battery` | `.battery` | `.energy.batteryLevel` |
| `fuel` | `.fuel` | `.resources.fuelLevelPct` |
| `water` | `.water` | `.resources.waterLevelPct` |
| `powerConsumption` | `.powerConsumption` | `.energy.powerConsumptionKW` |
| `generatorStatus` | - | `.energy.generatorStatus` |
| `status` | `.status` | - |
| `riskLevel` | `.riskLevel` | - |
| `communicationStatus` | `.communicationStatus` | - |
| `primaryAlert` | `.primaryAlert` | - |

Fields that exist in the React UI but have **no FastAPI equivalent** (kept
as static local values, not polled):
- Generator fleet detail (`generators[]` array - individual RPM, coolant temp, etc.)
- `lakePriyadarshini`, `sciencePayloads`, `aerodynamicStructure`, `isroEarthStation`
- `historicalData[]` (24h chart data - static, not updated by polling)
- `crewCapacity`, `coordinates`, `equipment[]`

---

## 5. Backend API Reference

Base URL: `http://localhost:8000`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/v1/stations` | All stations array |
| GET | `/api/v1/stations/maitri` | Maitri flat telemetry object |
| GET | `/api/v1/stations/bharati` | Bharati flat telemetry object |
| POST | `/api/v1/stations/maitri/telemetry` | Update any Maitri fields |
| POST | `/api/v1/stations/bharati/telemetry` | Update any Bharati fields |
| POST | `/api/v1/ai/analyze` | Gemini AI station diagnosis |

POST body for telemetry is a plain JSON dict of any fields to merge, e.g.:
```json
{ "fuel": 30, "battery": 55 }
```
The backend merges the dict into `STATIONS_STORE[station_id]` and returns
`{ "status": "SUCCESS", "station": { ...full updated object... } }`.

**Important:** The backend tick loop runs every 4 seconds and applies micro-
drift to `temperature` (±0.2), `windSpeed` (±1.0), `battery` (−0.15/tick),
`fuel` (−0.04/tick), `water` (±0.2), `powerConsumption` (±0.25). So any
value you POST will drift slightly over subsequent ticks - this is by design.

---

## 6. All Changes Made (Session History)

### Change Set 1 - Maitri: Replace WebSocket with FastAPI REST polling

**Files modified:**
- `src/context/TelemetryContext.jsx`
- `src/pages/MaitriPage.jsx`
- `src/components/maitri/EnergySection.jsx`
- `src/components/maitri/ResourcesSection.jsx`

**What changed:**

`TelemetryContext.jsx` - Before these changes the context connected to a
WebSocket at `ws://localhost:5000/ws/maitri` (via `TelemetryWebSocketService`
from `services/websocket.js`) to receive Maitri telemetry. That WebSocket
server does not exist - the only real backend is the FastAPI server on port
8000 which has no WebSocket endpoint.

The WebSocket code was removed entirely and replaced with:

1. `applyApiResponse(apiData)` - a `useCallback` that receives the flat
   FastAPI JSON and merges it into the nested `maitri` React state (maps
   `battery` → `energy.batteryLevel`, `fuel` → `resources.fuelLevelPct`, etc.)

2. `updateMaitriField(fieldUpdates)` - a `useCallback` that POSTs a partial
   update dict to `POST /api/v1/stations/maitri/telemetry` and on success
   calls `applyApiResponse` with the backend's authoritative response.

3. A polling `useEffect` that calls `GET /api/v1/stations/maitri` every
   3 seconds, calls `applyApiResponse` on success, sets `connectionStatus`
   to `"LIVE"` and `twinSyncStatus` to `"SYNCHRONIZED"`, and resets to
   `"STALE"` after 10 seconds of silence.

`MaitriPage.jsx` - Added `updateMaitriField` to the destructure from
`useTelemetry()`. Passes it as `onUpdate={updateMaitriField}` to
`<EnergySection>` and `<ResourcesSection>`.

`EnergySection.jsx` - Added local `EditableField` component (controlled
number input + Update button with Saved/Error flash states). Battery
`MetricCard` is now wrapped in a `flex-col` div with the `EditableField`
strip below it. POSTs `{ battery: value }`.

`ResourcesSection.jsx` - Same `EditableField` pattern. Fuel and Water
`MetricCard`s each get an editable strip. POSTs `{ fuel: value }` or
`{ water: value }`.

---

### Change Set 2 - Bharati: Same polling integration

**Files modified:**
- `src/context/TelemetryContext.jsx`
- `src/pages/BharatiPage.jsx`
- `src/components/bharati/BharatiEnergySection.jsx`
- `src/components/bharati/BharatiResourcesSection.jsx`

**What changed:**

Previously, Bharati was driven by a local 5-second `setInterval` simulation
timer inside `TelemetryContext`. This was replaced with the same FastAPI
polling pattern as Maitri.

Added to `TelemetryContext.jsx`:
- `bharatiConnectionStatus` + `bharatiSyncStatus` state + `bharatiStaleTimerRef`
  (separate from Maitri's equivalents - fully independent)
- `applyBharatiApiResponse(apiData)` - same mapping logic as Maitri but calls
  `setBharati` instead of `setMaitri`
- `updateBharatiField(fieldUpdates)` - POSTs to `.../stations/bharati/telemetry`
- A second independent polling `useEffect` for Bharati (own interval, own
  cancelled flag, own stale timer)
- All four new values exposed on the context value object

`BharatiPage.jsx`, `BharatiEnergySection.jsx`, `BharatiResourcesSection.jsx`
- same pattern as Maitri equivalents.

---

### Change Set 3 - Bug fixes from code audit

**Files modified:**
- `src/context/TelemetryContext.jsx`
- `src/pages/DigitalTwinPage.jsx`

**Three bugs fixed:**

**Bug 1 - Cosmetic: wrong data source label in DigitalTwinPage**
The connection status panel said "LIVE WEBSOCKET" and "SIMULATED TELEMETRY
VIA WEBSOCKET". Changed to "LIVE (REST POLLING)" and
"LIVE TELEMETRY VIA REST POLLING (3s)".

**Bug 2 - setScenario wrote local state that polling immediately overwrote**
The old implementation called `setBharati(prev => updateStationTelemetry(...))`
which directly mutated React local state. The next poll (≤3s away) would
overwrite it with backend values, making scenario injection effectively
a no-op.

Fixed by converting `setScenario` to a `useCallback` that:
- Computes the concrete target values by adding each scenario's offsets
  (`tempOffset`, `windOffset`, `powerOffset`) to the static MAITRI/BHARATI
  baseline numbers from `stationData.js`
- Calls `updateMaitriField(payload)` and `updateBharatiField(payload)` to
  POST the values into the backend's `STATIONS_STORE`
- The backend tick loop then drifts around those new values, and all
  subsequent polls pick up the scenario state correctly

Conditional fields:
- `communicationStatus` - only included when the scenario defines `commsStatus`
- `fuel` override - only included when `fuelLevel` is explicitly defined
  (only `FUEL_EMERGENCY` scenario has this)
- Generator detail fields (`gen1Status`, `gen2Status`, `genLoadPct` from
  `GEN_LOAD_SHED`) are intentionally NOT sent - the backend `STATIONS_STORE`
  has no schema for these flat fields. The generator fleet cards will not
  reflect GEN-01 OFFLINE until the backend model is extended.

**Bug 3 - resetToNominal wrote local state that polling overwrote**
Same root cause as Bug 2. The old implementation called
`setMaitri(cloneState(MAITRI))` and `setBharati(cloneState(BHARATI))` which
lasted only until the next poll.

Fixed by converting `resetToNominal` to a `useCallback` that POSTs all six
key baseline fields (`temperature`, `windSpeed`, `fuel`, `battery`, `water`,
`powerConsumption`, `communicationStatus`) to both station endpoints. The
backend adopts the baseline values and the next poll reflects them.

**Declaration order fix:** `setScenario` and `resetToNominal` were initially
placed before `updateMaitriField` / `updateBharatiField` in the component
body, causing a runtime reference error (calling `useCallback` values before
their `const` declarations). Moved them to after `updateBharatiField`.

---

### End-to-End Verification (Live Backend Test)

After Change Set 3, the scenario system was verified against the running
backend:

- Baseline captured: Maitri temp -34.5°C / wind 59.9 / power 49.1 kW
- KATABATIC_BLIZZARD POSTed: Maitri → temp -43.5°C / wind 97 / power 61 kW
- After 6 seconds (2 poll cycles): Maitri -43.3°C / 98.0 / 61.3 ✅ (small
  drift from backend tick, anchored at blizzard level - NOT reverted)
- resetToNominal POSTed baseline values
- After 6 seconds: Maitri -35.4°C / 50.2 / 47.6 ✅ (drifting around baseline)

Scenario injection and reset both survive poll cycles. Fix confirmed working.

---

## 7. TelemetryContext.jsx - Current Structure (Reference)

The component body of `TelemetryProvider` now follows this order:

```
useState: maitri, bharati, lastUpdated, activeScenario
useState: connectionStatus, twinSyncStatus  (Maitri)
useRef:   staleTimerRef                     (Maitri)
useState: bharatiConnectionStatus, bharatiSyncStatus  (Bharati)
useRef:   bharatiStaleTimerRef                        (Bharati)
const:    staleTimeoutMs = 10000

── applyApiResponse (useCallback)           ← maps API → setMaitri
── updateMaitriField (useCallback)          ← POST → maitri telemetry
── applyBharatiApiResponse (useCallback)    ← maps API → setBharati
── updateBharatiField (useCallback)         ← POST → bharati telemetry
── setScenario (useCallback)                ← POSTs scenario offsets to both
── resetToNominal (useCallback)             ← POSTs baseline to both

── useEffect: Bharati 3s polling loop
── useEffect: Maitri 3s polling loop

Context value exposed:
  maitri, bharati, lastUpdated,
  activeScenario, scenarios,
  setScenario, resetToNominal,
  connectionStatus, twinSyncStatus,        ← Maitri
  updateMaitriField,
  bharatiConnectionStatus, bharatiSyncStatus,  ← Bharati
  updateBharatiField
```

`updateStationTelemetry()` - the old local simulation function - is still
defined at module scope (outside the component). It is no longer called by
any `useEffect` but it is still used conceptually as reference logic. It can
be removed in a future cleanup.

`websocket.js` - still exists in `services/` but is no longer imported by
`TelemetryContext.jsx`. Safe to delete in a future cleanup.

---

## 8. EditableField Component Pattern

The same `EditableField` component is duplicated locally in four files:
- `src/components/maitri/EnergySection.jsx` - battery
- `src/components/maitri/ResourcesSection.jsx` - fuel, water
- `src/components/bharati/BharatiEnergySection.jsx` - battery
- `src/components/bharati/BharatiResourcesSection.jsx` - fuel, water

It is NOT a shared component (no separate file). Props:
`label`, `fieldKey`, `currentValue`, `unit`, `min`, `max`, `onUpdate`

Behavior:
- Controlled input (`value={draft}`) - sends `parseFloat(draft)`, never a
  stale value
- `useEffect` resets `draft` to `''` when `currentValue` changes (safe -
  only resets if user hasn't typed, since draft starts at `''`)
- Client-side range validation before any fetch
- `setSending(true)` disables the button during in-flight request
- Flash states: `'ok'` → green "Saved" for 1.5s, `'err'` → red "Error" for
  1.5s (covers both network failure and out-of-range input)
- `onUpdate` is optional - if not passed, the strip does not render (graceful
  degradation if the component is reused in a non-editable context)

---

## 9. SIMULATION_SCENARIOS Reference

Defined in `src/services/simulationService.js`. Each scenario has
`maitriMod` and `bharatiMod` objects.

| Scenario key | Alert level | Maitri effect | Bharati effect |
|---|---|---|---|
| `NOMINAL` | GREEN | no offsets | no offsets |
| `KATABATIC_BLIZZARD` | RED | temp −8.5, wind +45, power +12.4 | temp −6.2, wind +52.5, power +18.0 |
| `SOLAR_RADIO_BLACKOUT` | AMBER | comms DEGRADED | comms DEGRADED |
| `GEN_LOAD_SHED` | AMBER | power −14.2 (Maitri only) | no numeric change |
| `FUEL_EMERGENCY` | RED | no numeric change | power −22.0, fuel → 14% |

Fields in scenario mods that `setScenario` maps to POST payload:

| Mod field | POSTed as | Notes |
|---|---|---|
| `tempOffset` | `temperature: baseline + offset` | always included |
| `windOffset` | `windSpeed: baseline + offset` | always included |
| `powerOffset` | `powerConsumption: baseline + offset` | always included |
| `commsStatus` | `communicationStatus: value` | only if defined |
| `fuelLevel` | `fuel: value` | only if defined (FUEL_EMERGENCY only) |
| `gen1Status`, `gen2Status`, `genLoadPct` | **NOT sent** | no backend schema |
| `fuelDrainRate` | **NOT sent** | backend has fixed drain rate |
| `commsDegradation` | **NOT sent** | use `commsStatus` instead |

---

## 10. Known Limitations & Future Work

1. **Generator fleet detail not scenario-injectable** - `GEN_LOAD_SHED` has
   `gen1Status: "OFFLINE"` etc. but `STATIONS_STORE` in `main.py` has no
   such fields. To make this work, the backend would need to store and return
   per-generator state, and the frontend mapping would need to apply it to
   `energy.generators[]`.

2. **`updateStationTelemetry()` is dead code** - the local simulation
   function is still defined in `TelemetryContext.jsx` but never called.
   Can be deleted. `services/websocket.js` is also unused.

3. **`historicalData[]` is static** - The 24-hour chart data in the Bharati
   and Maitri chart sections uses the static arrays from `stationData.js`.
   It does not update as live values change. A future enhancement would
   append new readings to a rolling time-series buffer on each poll.

4. **`setScenario` resets comms to ONLINE for next poll** - When a scenario
   with `commsStatus: "DEGRADED"` is active, the backend does not have
   a persistent `degraded` state - the tick loop does not touch
   `communicationStatus`. So the degraded status will persist until
   `resetToNominal` is called, which is correct behavior. However, if the
   backend is restarted, it resets to `"ONLINE"`.

5. **Battery/fuel continue drifting down even after scenario** - The backend
   tick always applies `battery -= 0.15` and `fuel -= 0.04` per tick
   regardless of scenario. There is no way to "pause" drain from the frontend.

6. **`VITE_WS_URL` env var** - still present in `.env.example` but is no
   longer read by any active code (websocket.js is unused). Safe to remove.

7. **MongoDB is optional** - if `MONGODB_URI` is not reachable, the backend
   silently falls back to in-memory only. Telemetry history is lost on restart.

---

## 11. How to Run

### Frontend
```bash
cd "digital twin Antarcitica"
npm install        # first time only
npm run dev        # starts on http://localhost:3000
```

### Backend
```bash
cd "digital twin Antarcitica/backend"
pip install -r ../requirements.txt   # first time only
python main.py                        # starts on http://localhost:8000
```

Both must be running simultaneously for live data. If the backend is not
running, the frontend falls back to the static baseline data from
`stationData.js` and shows `connectionStatus: "DISCONNECTED"`.

### API docs (auto-generated by FastAPI)
```
http://localhost:8000/docs       ← Swagger UI
http://localhost:8000/redoc      ← ReDoc
```

---

## 12. Environment Variables

```bash
# .env (in "digital twin Antarcitica/" folder)

GEMINI_API_KEY=your_key_here     # Required for AI analysis
GOOGLE_API_KEY=your_key_here     # Fallback alias

PORT=8000
HOST=0.0.0.0
ENVIRONMENT=development

MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=antarctic_digital_twin

# VITE_WS_URL is no longer used - websocket.js is not imported by any active code
```

---

*Last updated: August 2026. Reflects all changes through Change Set 3.*

