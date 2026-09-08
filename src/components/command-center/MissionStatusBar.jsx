import React from 'react';
import {
  Compass,
  Radar,
  TrendingUp,
  Brain,
  Gauge,
} from 'lucide-react';

/**
 * MissionStatusBar.jsx
 * ====================
 * Concise horizontal operational status strip displaying monitored stations,
 * active intelligence engines, and overall readiness percentage.
 *
 * Props:
 *   data {object} - commandCenterData from Phase 6A:
 *     - totalStations {number}
 *     - activeAnomalyEngines {number}
 *     - activeForecastEngines {number}
 *     - activeDecisionEngines {number}
 *     - averageReadinessPercent {number}
 */
export default function MissionStatusBar({ data = {} }) {
  const totalStations = Number.isFinite(data?.totalStations) ? data.totalStations : 2;
  const activeAnomaly = Number.isFinite(data?.activeAnomalyEngines) ? data.activeAnomalyEngines : 0;
  const activeForecast = Number.isFinite(data?.activeForecastEngines) ? data.activeForecastEngines : 0;
  const activeDecision = Number.isFinite(data?.activeDecisionEngines) ? data.activeDecisionEngines : 0;
  const readiness = Number.isFinite(data?.averageReadinessPercent) ? data.averageReadinessPercent : 0;

  const items = [
    {
      id: 'stations',
      label: 'Stations Monitored',
      value: `${totalStations}`,
      sub: 'Maitri & Bharati',
      icon: Compass,
      color: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'bg-cyan-950/20',
    },
    {
      id: 'anomaly',
      label: 'Active Anomaly Engines',
      value: `${activeAnomaly} / ${totalStations}`,
      sub: 'Isolation Forest',
      icon: Radar,
      color: activeAnomaly > 0 ? 'text-emerald-400' : 'text-slate-400',
      border: 'border-polar-800',
      bg: 'bg-polar-950/60',
    },
    {
      id: 'forecast',
      label: 'Active Forecast Engines',
      value: `${activeForecast} / ${totalStations}`,
      sub: 'Linear / Exp Smoothing',
      icon: TrendingUp,
      color: activeForecast > 0 ? 'text-emerald-400' : 'text-slate-400',
      border: 'border-polar-800',
      bg: 'bg-polar-950/60',
    },
    {
      id: 'decision',
      label: 'Active Decision Engines',
      value: `${activeDecision} / ${totalStations}`,
      sub: 'Operational Risk & Directives',
      icon: Brain,
      color: activeDecision > 0 ? 'text-emerald-400' : 'text-slate-400',
      border: 'border-polar-800',
      bg: 'bg-polar-950/60',
    },
    {
      id: 'readiness',
      label: 'Intelligence Readiness',
      value: `${readiness}%`,
      sub: readiness >= 80 ? 'Optimal' : readiness >= 50 ? 'Subsystem degraded' : 'Learning phase',
      icon: Gauge,
      color: readiness >= 80 ? 'text-emerald-400' : readiness >= 50 ? 'text-amber-400' : 'text-rose-400',
      border: readiness >= 80 ? 'border-emerald-500/30' : 'border-amber-500/30',
      bg: 'bg-polar-950/60',
    },
  ];

  return (
    <section aria-label="Mission Status Bar" className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border ${item.border} ${item.bg} backdrop-blur-md flex flex-col justify-between transition-all duration-200 hover:border-cyan-500/40`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider line-clamp-1">
                  {item.label}
                </span>
                <Icon className={`w-4 h-4 ${item.color} shrink-0`} />
              </div>
              <div>
                <div className={`text-lg sm:text-xl font-mono font-bold ${item.color}`}>
                  {item.value}
                </div>
                <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                  {item.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
