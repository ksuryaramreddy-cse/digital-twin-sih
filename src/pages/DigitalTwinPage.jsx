import React, { useState, useEffect, useMemo } from 'react';
import { Shield, Radio } from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';
import { digitalTwinData } from '../data/digitalTwinData';
import {
  buildStationCommandSummary,
  buildUnifiedCommandSummary,
} from '../utils/commandCenterUtils';

// ── Unified Operations Command Center Components (Phase 6B) ──────────────────
import CommandCenterHeader from '../components/command-center/CommandCenterHeader';
import MissionStatusBar from '../components/command-center/MissionStatusBar';
import PriorityStationCard from '../components/command-center/PriorityStationCard';
import StationCommandCard from '../components/command-center/StationCommandCard';
import CrossStationComparison from '../components/command-center/CrossStationComparison';
import IntelligenceReadiness from '../components/command-center/IntelligenceReadiness';
import ExecutiveSummary from '../components/command-center/ExecutiveSummary';

// ── Existing Digital Twin Components ─────────────────────────────────────────
import TwinHeader from '../components/digitalTwin/TwinHeader';
import TwinAntarcticMap2D from '../components/digitalTwin/TwinAntarcticMap2D';
import TwinStationCards from '../components/digitalTwin/TwinStationCards';
import TwinSimulationControl from '../components/digitalTwin/TwinSimulationControl';
import StationComparisonGrid from '../components/digitalTwin/StationComparisonGrid';
import OrbitalSatelliteTracker from '../components/digitalTwin/OrbitalSatelliteTracker';
import SensorChart from '../components/common/SensorChart';

// ── riskLevel helper for telemetry badge display ─────────────────────────────
const riskColor = (rl) => {
  if (!rl) return 'text-emerald-400';
  const r = rl.toUpperCase();
  if (r === 'RED' || r.includes('HIGH')) return 'text-rose-400';
  if (r === 'AMBER' || r.includes('MODERATE')) return 'text-amber-400';
  return 'text-emerald-400';
};

// ── Build a live comparison matrix from current context state ────────────────
const buildMatrix = (m, b) => [
  {
    metric: 'Operational Status',
    maitri: `${m.status || '-'} (${m.riskLevel || '-'})`,
    bharati: `${b.status || '-'} (${b.riskLevel || '-'})`,
    variance: 'Synchronized',
    status: 'good',
  },
  {
    metric: 'Current Personnel',
    maitri: `${m.crewCapacity?.current ?? 24} Crew (Wintering)`,
    bharati: `${b.crewCapacity?.current ?? 44} Crew (Wintering)`,
    variance: `${(m.crewCapacity?.current ?? 24) + (b.crewCapacity?.current ?? 44)} Total Personnel`,
    status: 'neutral',
  },
  {
    metric: 'Ambient Surface Temp',
    maitri: `${m.temperature ?? '-'} °C`,
    bharati: `${b.temperature ?? '-'} °C`,
    variance:
      m.temperature != null && b.temperature != null
        ? `Δ ${(b.temperature - m.temperature).toFixed(1)} °C (Maitri colder)`
        : '-',
    status: 'neutral',
  },
  {
    metric: 'Surface Wind Velocity',
    maitri: `${m.windSpeed ?? '-'} km/h`,
    bharati: `${b.windSpeed ?? '-'} km/h`,
    variance:
      m.windSpeed != null && b.windSpeed != null
        ? `Δ ${(m.windSpeed - b.windSpeed).toFixed(1)} km/h`
        : '-',
    status: 'neutral',
  },
  {
    metric: 'Power Grid Demand',
    maitri: `${m.powerConsumption ?? '-'} kW`,
    bharati: `${b.powerConsumption ?? '-'} kW`,
    variance:
      m.powerConsumption != null && b.powerConsumption != null
        ? `${(m.powerConsumption + b.powerConsumption).toFixed(1)} kW Total Load`
        : '-',
    status: 'good',
  },
  {
    metric: 'Fuel Reserves Remaining',
    maitri: `${m.fuel != null ? m.fuel.toFixed(1) : '-'}% (~${m.resources?.fuelDaysRemaining ?? Math.round((m.fuel ?? 0) * 1.1)} days)`,
    bharati: `${b.fuel != null ? b.fuel.toFixed(1) : '-'}%`,
    variance: b.fuel != null && b.fuel < 25 ? 'Bharati Needs Tanker Resupply' : 'Nominal',
    status: b.fuel != null && b.fuel < 25 ? 'warning' : 'good',
  },
  {
    metric: 'Battery Bank Level',
    maitri: `${m.battery != null ? m.battery.toFixed(1) : '-'}%`,
    bharati: `${b.battery != null ? b.battery.toFixed(1) : '-'}%`,
    variance: 'Dual Float Charge',
    status: 'good',
  },
  {
    metric: 'Fresh Water Level',
    maitri: `${m.water != null ? m.water.toFixed(1) : '-'}%`,
    bharati: `${b.water != null ? b.water.toFixed(1) : '-'}%`,
    variance: 'Dual Redundancy Types',
    status: 'good',
  },
  {
    metric: 'Communication Link',
    maitri: `${m.communicationStatus ?? 'ONLINE'}`,
    bharati: `${b.communicationStatus ?? 'ONLINE'}`,
    variance: 'GSAT-30 / Iridium Mesh',
    status: 'good',
  },
  {
    metric: 'Overall Health',
    maitri: `${m.overallHealth != null ? m.overallHealth.toFixed(1) : '-'}%`,
    bharati: `${b.overallHealth != null ? b.overallHealth.toFixed(1) : '-'}%`,
    variance: 'Live API computed',
    status: 'good',
  },
];

export default function DigitalTwinPage() {
  const {
    maitri,
    bharati,
    lastUpdated,
    activeScenario,
    scenarios,
    setScenario,
    resetToNominal,
    connectionStatus,
    twinSyncStatus,
    maitriAnomaly,
    bharatiAnomaly,
    maitriForecast,
    bharatiForecast,
    maitriDecision,
    bharatiDecision,
  } = useTelemetry();

  // ── Unified Command Center Data Orchestration (Phase 6A & 6B) ────────────
  const commandCenterData = useMemo(() => {
    const mSummary = buildStationCommandSummary({
      stationId: 'maitri',
      telemetry: maitri,
      anomaly: maitriAnomaly,
      forecast: maitriForecast,
      decision: maitriDecision,
    });
    const bSummary = buildStationCommandSummary({
      stationId: 'bharati',
      telemetry: bharati,
      anomaly: bharatiAnomaly,
      forecast: bharatiForecast,
      decision: bharatiDecision,
    });
    return buildUnifiedCommandSummary(mSummary, bSummary);
  }, [
    maitri,
    bharati,
    maitriAnomaly,
    bharatiAnomaly,
    maitriForecast,
    bharatiForecast,
    maitriDecision,
    bharatiDecision,
  ]);

  // Strict station-independent extraction
  const maitriSummary = useMemo(() => {
    return commandCenterData.stations.find((s) => s.stationId === 'maitri') || null;
  }, [commandCenterData]);

  const bharatiSummary = useMemo(() => {
    return commandCenterData.stations.find((s) => s.stationId === 'bharati') || null;
  }, [commandCenterData]);

  // Live comparison matrix - recomputed on every render from current API state
  const liveMatrix = buildMatrix(maitri, bharati);

  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const updateSeconds = () => {
      if (lastUpdated) {
        const diff = Math.floor((new Date() - new Date(lastUpdated)) / 1000);
        setSecondsAgo(Math.max(0, diff));
      }
    };
    updateSeconds();
    const interval = setInterval(updateSeconds, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="space-y-8 pb-16">
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* ANTARCTIC OPERATIONS COMMAND CENTER (PHASE 6B UI HIERARCHY) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      {/* 1. COMMAND CENTER HEADER */}
      <CommandCenterHeader
        readinessPercent={commandCenterData.averageReadinessPercent}
        connectionStatus={connectionStatus}
      />

      {/* 2. MISSION STATUS BAR */}
      <MissionStatusBar data={commandCenterData} />

      {/* 3. HIGHEST OPERATIONAL PRIORITY STATION */}
      <PriorityStationCard priorityStation={commandCenterData.highestPriorityStation} />

      {/* 4. STATION COMMAND CARDS (SIDE-BY-SIDE ON DESKTOP, STACKED ON MOBILE) */}
      <section aria-label="Station Operations Command Cards" className="space-y-3">
        <div className="flex items-center justify-between pb-1 border-b border-polar-800">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            POLAR RESEARCH STATION COMMAND CARDS
          </h2>
          <span className="text-xs font-mono text-cyan-400">
            Autonomous Dual-Station Intelligence
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StationCommandCard station={maitriSummary} />
          <StationCommandCard station={bharatiSummary} />
        </div>
      </section>

      {/* 5. CROSS-STATION OPERATIONAL COMPARISON */}
      <CrossStationComparison comparison={commandCenterData.crossStationComparison} />

      {/* 6. INTELLIGENCE PIPELINE READINESS & OPERATIONAL EXECUTIVE SUMMARY */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <IntelligenceReadiness data={commandCenterData} />
        <ExecutiveSummary
          priorityStation={commandCenterData.highestPriorityStation}
          readinessPercent={commandCenterData.averageReadinessPercent}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* EXISTING DIGITAL TWIN VISUALIZATION & SPATIAL CONTROL LAYER */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="pt-8 border-t border-polar-800 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-polar-800">
          <div>
            <h2 className="text-base sm:text-lg font-mono font-extrabold uppercase tracking-widest text-cyan-400 flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-400" />
              CONTINENTAL DIGITAL TWIN & SIMULATION SYSTEM
            </h2>
            <p className="text-xs font-mono text-slate-400">
              Interactive 2D spatial terrain radar, satellite ephemeris, and what-if stress-testing
            </p>
          </div>
          <div className="text-[11px] font-mono text-slate-500 bg-polar-950/60 px-3 py-1.5 rounded border border-polar-850 self-start sm:self-auto">
            Synoptic Layer Active
          </div>
        </div>

        {/* Real-time Telemetry & Ingestion Status Panel */}
        <div className="bg-polar-900/90 border border-cyan-500/30 rounded-2xl p-5 sm:p-6 font-mono shadow-2xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-polar-800 gap-4">
            <div>
              <div className="flex items-center space-x-2 text-cyan-400 font-bold">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      connectionStatus === 'LIVE'
                        ? 'bg-emerald-400'
                        : connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      connectionStatus === 'LIVE'
                        ? 'bg-emerald-400'
                        : connectionStatus === 'CONNECTING' || connectionStatus === 'RECONNECTING'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                </span>
                <span className="text-sm tracking-wider uppercase">
                  DIGITAL TWIN TELEMETRY STREAM: {connectionStatus}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Active telemetry consumer feed via REST polling - Render backend
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="bg-polar-950/60 px-3 py-1.5 rounded border border-polar-800 flex items-center space-x-2">
                <span className="text-slate-400">Twin Status:</span>
                <span
                  className={`font-bold uppercase ${
                    twinSyncStatus === 'SYNCHRONIZED'
                      ? 'text-emerald-400'
                      : twinSyncStatus === 'STALE'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {twinSyncStatus}
                </span>
              </div>
              <div className="bg-polar-950/60 px-3 py-1.5 rounded border border-polar-800 flex items-center space-x-2">
                <span className="text-slate-400">Data Source:</span>
                <span className="text-slate-200 font-bold">LIVE (REST POLLING)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-polar-950/60 p-3 rounded-lg border border-polar-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Latitude</span>
              <span className="text-xs font-bold text-slate-100">
                {maitri.coordinates?.decimalLat ? maitri.coordinates.decimalLat.toFixed(4) : '-70.7600'}
              </span>
            </div>
            <div className="bg-polar-950/60 p-3 rounded-lg border border-polar-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Longitude</span>
              <span className="text-xs font-bold text-slate-100">
                {maitri.coordinates?.decimalLong ? maitri.coordinates.decimalLong.toFixed(4) : '11.7200'}
              </span>
            </div>
            <div className="bg-polar-950/60 p-3 rounded-lg border border-polar-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Temperature</span>
              <span className="text-xs font-bold text-cyan-400">{maitri.temperature} °C</span>
            </div>
            <div className="bg-polar-950/60 p-3 rounded-lg border border-polar-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Wind Speed</span>
              <span className="text-xs font-bold text-sky-400">{maitri.windSpeed} m/s</span>
            </div>
            <div className="bg-polar-950/60 p-3 rounded-lg border border-polar-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Humidity</span>
              <span className="text-xs font-bold text-blue-400">{maitri.humidity} %</span>
            </div>
            <div className="bg-polar-950/60 p-3 rounded-lg border border-polar-800 text-center">
              <span className="text-[10px] text-slate-400 block uppercase">Pressure</span>
              <span className="text-xs font-bold text-teal-400">{maitri.pressure} hPa</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
            <div className="bg-polar-950/60 p-3 rounded-lg border border-polar-800 flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[10px]">Risk:</span>
              <span
                className={`font-bold ${
                  maitri.riskLevel ? riskColor(maitri.riskLevel) : 'text-emerald-400'
                }`}
              >
                {maitri.riskLevel?.replace(' RISK', '') || 'LOW'}
              </span>
            </div>
            <div className="bg-polar-950/60 p-3 rounded-lg border border-polar-800 flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[10px]">Risk Score:</span>
              <span className="text-slate-200 font-bold">{maitri.riskScore || '0.21'}</span>
            </div>
            <div className="bg-polar-950/60 p-3 rounded-lg border border-polar-800 flex justify-between items-center">
              <span className="text-slate-400 uppercase text-[10px]">Station Status:</span>
              <span
                className={`font-bold ${
                  maitri.status === 'CRITICAL'
                    ? 'text-rose-400'
                    : maitri.status === 'WARNING'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {maitri.status}
              </span>
            </div>
          </div>

          <div className="bg-polar-950/80 p-2 px-3 rounded border border-polar-850 flex items-center justify-between text-[11px] gap-2">
            <span className="text-slate-400">Last Datastream Update:</span>
            <span className="text-cyan-400 font-bold font-mono">
              {twinSyncStatus === 'DISCONNECTED'
                ? 'Waiting for Maitri telemetry...'
                : `${new Date(maitri.lastUpdated).toLocaleTimeString()} (${secondsAgo}s ago)`}
            </span>
          </div>
        </div>

        {/* Antarctic Digital Twin Visual Title & Continent Stats */}
        <TwinHeader maitri={maitri} bharati={bharati} />

        {/* Antarctic 2D Terrain & Radar Map */}
        <TwinAntarcticMap2D maitri={maitri} bharati={bharati} />

        {/* Polar What-If Scenario Simulator */}
        <TwinSimulationControl
          scenarios={scenarios}
          activeScenarioKey={activeScenario?.id || 'NOMINAL'}
          onSelectScenario={(key) => setScenario(key)}
          onReset={() => resetToNominal()}
        />

        {/* Existing Twin Station Cards */}
        <TwinStationCards maitri={maitri} bharati={bharati} />

        {/* Synchronized Dual-Station 24h Sensor Curves */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-polar-800 gap-2">
            <div>
              <h3 className="font-mono font-bold text-sm sm:text-base text-white uppercase tracking-wider">
                Synchronized Dual-Station 24h Sensor Curves
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Direct telemetry comparison between Inland Oasis (Maitri) and Coastal Maritime (Bharati)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Temperature Comparison */}
            <SensorChart
              title="Inland vs. Coastal Temperature Profile (°C)"
              subtitle="Maitri (-35.0°C Inland) vs. Bharati (-24.0°C Coastal)"
              data={digitalTwinData.synchronizedTelemetryTimeline}
              type="line"
              series={[
                { key: 'maitriTemp', name: 'Maitri (°C)', color: '#00f3ff' },
                { key: 'bharatiTemp', name: 'Bharati (°C)', color: '#38bdf8' },
              ]}
              height={250}
              yAxisUnit="°C"
            />

            {/* Wind Velocity Comparison */}
            <SensorChart
              title="Katabatic vs. Coastal Marine Wind Velocity (km/h)"
              subtitle="Maitri (52 km/h Katabatic) vs. Bharati (41 km/h Marine)"
              data={digitalTwinData.synchronizedTelemetryTimeline}
              type="area"
              series={[
                { key: 'maitriWind', name: 'Maitri Wind (km/h)', color: '#ffb703' },
                { key: 'bharatiWind', name: 'Bharati Wind (km/h)', color: '#10e796' },
              ]}
              height={250}
              yAxisUnit="km/h"
            />
          </div>
        </div>

        {/* Comparative Twin Telemetry Matrix */}
        <StationComparisonGrid matrix={liveMatrix} />

        {/* Polar Orbital Satellite Constellation Tracker */}
        <OrbitalSatelliteTracker satellites={digitalTwinData.satellites} />
      </div>
    </div>
  );
}
