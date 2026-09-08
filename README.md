# 🇦🇶 Antarctic Digital Twin Platform (AIP-DT)

A dark-mode Antarctic research/control-room telemetry and Digital Twin platform built with **React**, **Vite**, **Tailwind CSS**, **React Router**, **Lucide React**, and **Recharts**.

---

## 🧭 Routes & Pages

The application is structured into **three separate, dedicated pages**:

1. **Maitri Station Dashboard** (`/maitri`)
   - Shows **only** Maitri information.
   - Schirmacher Oasis coordinates (`70°45′57″ S, 11°44′09″ E`).
   - Lake Priyadarshini sub-ice freshwater pumping, trace-heated pipeline temperature, storage reservoirs, and water purity (TDS/pH).
   - Atmospheric Dobson Ozone Spectrophotometer (stratospheric ozone column tracking).
   - 3x 62.5 kVA diesel generator microgrid telemetry and containerized habitat metrics.
   - 24-hour sensor trends (Temperature vs. Wind, Electrical Demand, Lake Reservoir Storage, Dobson Total Ozone).

2. **Bharati Station Dashboard** (`/bharati`)
   - Shows **only** Bharati information.
   - Larsemann Hills coordinates (`69°24′28″ S, 76°11′14″ E`).
   - Aerodynamic stilt structural health & 4.0m under-chassis snowdrift clearance telemetry.
   - ISRO 11-meter Radome Satellite Earth Ground Station (BGS) tracking Cartosat & RISAT with high-rate X/S-Band downlinks (1.2 Gbps).
   - Combined Heat & Power (CHP) automated thermal recovery loop (+88.4 kW exhaust heat capture).
   - Seawater reverse-osmosis desalination & bioreactor greywater recycling.
   - 24-hour sensor trends (Coastal Wind vs. Temp, Power Load vs. Heat Recovery, ISRO Downlink Throughput).

3. **Antarctic Digital Twin** (`/digital-twin`)
   - Unified operational state visualizer tracking **both** stations.
   - Interactive Polar Stereographic Tactical Radar Map with coordinates, radar sweep, 3,000 km inter-station comms mesh, and interactive station inspection.
   - **What-If Extreme Polar Scenario Simulator**:
     - *Nominal Operations*
     - *Katabatic Blizzard Gale (Category 4)*
     - *Geomagnetic Solar Storm (X2.4 Flare)*
     - *Maitri Gen-1 Trip / Priority Load Shed*
   - Side-by-side comparative twin matrix table with variance analytics.
   - Synchronized dual-station 24-hour temperature and wind curves.
   - Polar orbital satellite constellation tracker (GSAT-30, Cartosat-3, RISAT-2B, Iridium NEXT, NOAA-20).

---

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run local development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

3. **Build for production**:
   ```bash
   npm run build
   ```

---

## 📂 Project Architecture

```
digital-twin-antarctica/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── index.css                   # Cyber-tactical styles & radar animations
    ├── main.jsx                    # Application entry point
    ├── App.jsx                     # React Router definition (/maitri, /bharati, /digital-twin)
    ├── data/
    │   ├── maitriData.js           # Maitri-only telemetry & 24h history
    │   ├── bharatiData.js          # Bharati-only telemetry & 24h history
    │   └── digitalTwinData.js      # Global twin data, map nodes & simulation scenarios
    ├── components/
    │   ├── layout/
    │   │   ├── Navbar.jsx          # Live UTC polar clock, station badges, route switcher
    │   │   ├── FooterStatus.jsx    # Polar telemetry link status & encryption
    │   │   └── AppLayout.jsx       # Base layout wrapper
    │   ├── common/
    │   │   ├── MetricCard.jsx      # Telemetry metric card with glow & sparklines
    │   │   ├── StatusBadge.jsx     # Cyber-tactical status indicator
    │   │   ├── WeatherStation.jsx  # Automatic Weather Station (AWS) card
    │   │   ├── SubsystemGrid.jsx   # Microgrid, Life Support, and Comms telemetry
    │   │   ├── SensorChart.jsx     # Recharts polar telemetry charts
    │   │   └── AlertsPanel.jsx     # Real-time filterable alert feed with ACK actions
    │   ├── stations/
    │   │   ├── StationHeroHeader.jsx   # Station identity banner with coordinates
    │   │   ├── MaitriSpecialized.jsx   # Lake Priyadarshini, Dobson ozone, payloads
    │   │   └── BharatiSpecialized.jsx  # Aerodynamic stilts, ISRO 11m dish, CHP heat recovery
    │   └── digitalTwin/
    │       ├── AntarcticMapViewer.jsx      # Interactive polar tactical map & radar sweep
    │       ├── StationComparisonGrid.jsx  # Side-by-side comparative twin telemetry
    │       ├── TwinSimulationControl.jsx  # Extreme event scenario simulator
    │       └── OrbitalSatelliteTracker.jsx# Spacecraft constellation pass monitor
    └── pages/
        ├── MaitriPage.jsx          # Dedicated Maitri Dashboard
        ├── BharatiPage.jsx         # Dedicated Bharati Dashboard
        ├── DigitalTwinPage.jsx     # Unified Antarctic Digital Twin
        └── NotFoundPage.jsx        # 404 Polar coordinate fallback
```

