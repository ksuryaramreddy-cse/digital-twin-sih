import React from 'react';
import {
  Radio,
  Radar,
  TrendingUp,
  Brain,
  ShieldCheck,
  AlertTriangle,
  Gauge,
} from 'lucide-react';

/**
 * IntelligenceReadiness.jsx
 * =========================
 * Pipeline health and operational readiness overview across all 4 intelligence subsystems:
 * 1. Telemetry Ingestion Network
 * 2. Anomaly Detection (Isolation Forest)
 * 3. Predictive Forecasting Engine (Linear / Exp Smoothing)
 * 4. Decision Intelligence Engine (Explainable Risk & Directives)
 *
 * Props:
 *   data {object} - commandCenterData from Phase 6A
 */
export default function IntelligenceReadiness({ data = {} }) {
  const stations = Array.isArray(data?.stations) ? data.stations : [];
  const totalStations = Number.isFinite(data?.totalStations) && data.totalStations > 0 ? data.totalStations : 2;

  // Calculate telemetry readiness from station readiness objects
  const activeTelemetry = stations.filter((s) => s?.readiness?.telemetryReady).length;
  const activeAnomaly = Number.isFinite(data?.activeAnomalyEngines) ? data.activeAnomalyEngines : 0;
  const activeForecast = Number.isFinite(data?.activeForecastEngines) ? data.activeForecastEngines : 0;
  const activeDecision = Number.isFinite(data?.activeDecisionEngines) ? data.activeDecisionEngines : 0;

  const overallReadiness = Number.isFinite(data?.averageReadinessPercent)
    ? Math.min(100, Math.max(0, Math.round(data.averageReadinessPercent)))
    : 0;

  const subsystems = [
    {
      id: 'telemetry',
      name: 'Telemetry Ingestion',
      count: activeTelemetry,
      total: totalStations,
      icon: Radio,
      desc: 'REST & Stream polling',
    },
    {
      id: 'anomaly',
      name: 'Anomaly Detection',
      count: activeAnomaly,
      total: totalStations,
      icon: Radar,
      desc: 'Isolation Forest (ML)',
    },
    {
      id: 'forecast',
      name: 'Forecast Engine',
      count: activeForecast,
      total: totalStations,
      icon: TrendingUp,
      desc: 'Time-series extrapolation',
    },
    {
      id: 'decision',
      name: 'Decision Intelligence',
      count: activeDecision,
      total: totalStations,
      icon: Brain,
      desc: 'Rule & priority synthesis',
    },
  ];

  const isHealthy = overallReadiness >= 80;
  const isWarning = overallReadiness >= 50 && overallReadiness < 80;

  return (
    <section
      aria-label="System Intelligence Readiness"
      className="rounded-2xl border border-polar-800 bg-polar-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-5 font-mono"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-polar-800 gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            INTELLIGENCE PIPELINE READINESS
          </h3>
          <p className="text-xs text-slate-400">
            Real-time status of multi-layer operational AI pipelines across research stations
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="text-xs text-slate-400">NETWORK SCORE:</span>
          <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full border ${
            isHealthy
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
              : isWarning
              ? 'bg-amber-950/70 border-amber-500/40 text-amber-300'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
          }`}>
            {overallReadiness}%
          </span>
        </div>
      </div>

      {/* Subsystems Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {subsystems.map((sub) => {
          const SubIcon = sub.icon;
          const ratio = sub.total > 0 ? (sub.count / sub.total) * 100 : 0;
          const isFullyReady = sub.count === sub.total && sub.total > 0;

          return (
            <div
              key={sub.id}
              className="p-3.5 rounded-xl bg-polar-950/60 border border-polar-850 flex flex-col justify-between space-y-2.5 transition-all hover:border-cyan-500/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <SubIcon className="w-4 h-4 text-cyan-400" />
                  {sub.name}
                </span>
                <span className={`text-xs font-bold font-mono ${isFullyReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {sub.count} / {sub.total}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-polar-900 rounded-full overflow-hidden border border-polar-800">
                <div
                  className={`h-full transition-all duration-500 ${isFullyReady ? 'bg-emerald-400' : 'bg-amber-400'}`}
                  style={{ width: `${ratio}%` }}
                />
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>{sub.desc}</span>
                <span className="font-semibold text-slate-300">{Math.round(ratio)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
