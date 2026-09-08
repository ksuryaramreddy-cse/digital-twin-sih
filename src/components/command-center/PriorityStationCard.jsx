import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Brain,
  Building2,
  ListOrdered,
  Clock,
  CheckCircle2,
} from 'lucide-react';

const RISK_CONFIG = {
  LOW: {
    label: 'LOW RISK',
    badge: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300',
    border: 'border-emerald-500/30',
    accentBg: 'bg-emerald-950/20',
    barColor: 'bg-emerald-400',
    textColor: 'text-emerald-400',
    icon: ShieldCheck,
  },
  MEDIUM: {
    label: 'MEDIUM RISK',
    badge: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
    border: 'border-amber-500/40',
    accentBg: 'bg-amber-950/20',
    barColor: 'bg-amber-400',
    textColor: 'text-amber-400',
    icon: AlertTriangle,
  },
  HIGH: {
    label: 'HIGH RISK',
    badge: 'bg-orange-950/70 border-orange-500/50 text-orange-300',
    border: 'border-orange-500/50',
    accentBg: 'bg-orange-950/25',
    barColor: 'bg-orange-400',
    textColor: 'text-orange-400',
    icon: AlertTriangle,
  },
  CRITICAL: {
    label: 'CRITICAL RISK',
    badge: 'bg-rose-950/80 border-rose-500/60 text-rose-300',
    border: 'border-rose-500/60',
    accentBg: 'bg-rose-950/30',
    barColor: 'bg-rose-400',
    textColor: 'text-rose-400',
    icon: AlertOctagon,
  },
};

/**
 * PriorityStationCard.jsx
 * =======================
 * The primary focal card answering: "What needs attention right now?"
 *
 * Props:
 *   priorityStation {object|null} - highestPriorityStation from commandCenterData
 */
export default function PriorityStationCard({ priorityStation }) {
  // If no priority station is active (learning state or no data)
  if (!priorityStation || !priorityStation.decision) {
    return (
      <section
        aria-label="Operational Priority Status"
        className="relative overflow-hidden rounded-2xl border border-polar-800 bg-polar-900/80 p-6 backdrop-blur-xl shadow-xl font-mono"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-polar-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-slate-400">
                OPERATIONAL PRIORITY STATUS
              </span>
              <h2 className="text-lg font-bold text-slate-200">
                All Polar Stations Nominal / Initializing
              </h2>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            SYNCING INTELLIGENCE
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-polar-950/60 border border-polar-850 text-sm text-slate-300 space-y-2">
          <p className="font-semibold text-slate-200">
            No active decision intelligence is currently available.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Priority ranking will activate once station decision engines complete telemetry ingestion and baseline neural/statistical model learning.
          </p>
        </div>
      </section>
    );
  }

  const { stationId, stationName, decision, telemetry } = priorityStation;
  const overallRisk = (decision?.overallRisk || 'LOW').toUpperCase();
  const riskConfig = RISK_CONFIG[overallRisk] || RISK_CONFIG.LOW;
  const RiskIcon = riskConfig.icon;
  const riskScore = decision?.riskScore !== null && decision?.riskScore !== undefined
    ? Math.round(decision.riskScore)
    : '-';
  const priorityLevel = decision?.priority || 'P4 - ROUTINE';
  const summary = decision?.summary || 'Operational state undergoing routine telemetry monitoring.';
  const actions = Array.isArray(decision?.recommendedActions) ? decision.recommendedActions : [];

  return (
    <section
      aria-label="Highest Operational Priority Station"
      className={`relative overflow-hidden rounded-2xl border ${riskConfig.border} bg-polar-900/90 backdrop-blur-xl shadow-2xl transition-all duration-300 font-mono`}
    >
      {/* Top Banner Alert Strip */}
      <div className={`px-5 py-3 border-b ${riskConfig.border} ${riskConfig.accentBg} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center space-x-2.5">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${riskConfig.barColor}`} />
            <span className={`relative inline-flex rounded-full h-3 w-3 ${riskConfig.barColor}`} />
          </span>
          <span className="text-xs font-bold tracking-widest uppercase text-slate-200 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            HIGHEST OPERATIONAL PRIORITY
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-md text-xs font-bold border ${riskConfig.badge} flex items-center gap-1.5`}>
            <RiskIcon className="w-3.5 h-3.5" />
            {riskConfig.label}
          </span>
          <span className="px-3 py-1 rounded-md text-xs font-bold bg-polar-950/80 border border-polar-750 text-slate-200">
            {priorityLevel}
          </span>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide uppercase">
                {stationName} STATION
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Sector: {stationId === 'maitri' ? 'Inland Oasis (Schirmacher)' : 'Coastal Maritime (Larsemann Hills)'} • Telemetry Status: <span className="text-cyan-400 font-semibold">{telemetry?.status || 'ONLINE'}</span>
            </p>
          </div>

          {/* Risk Score Gauge Display */}
          <div className="flex items-center space-x-4 bg-polar-950/70 px-4 py-3 rounded-xl border border-polar-800 shrink-0">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                Risk Score
              </div>
              <div className="text-2xl font-extrabold text-white">
                <span className={riskConfig.textColor}>{riskScore}</span>
                <span className="text-xs text-slate-500 font-normal"> / 100</span>
              </div>
            </div>
            <div className="w-24 bg-polar-900 h-2.5 rounded-full overflow-hidden border border-polar-750">
              <div
                className={`h-full ${riskConfig.barColor} transition-all duration-500`}
                style={{ width: `${typeof riskScore === 'number' ? Math.min(100, Math.max(0, riskScore)) : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Operational Reason / Summary Quote */}
        <div className="p-4 rounded-xl bg-polar-950/70 border border-polar-850 space-y-1.5">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            Decision Intelligence Assessment
          </div>
          <p className="text-sm sm:text-base text-slate-200 italic leading-relaxed border-l-2 border-cyan-400/60 pl-3">
            "{summary}"
          </p>
        </div>

        {/* Recommended Actions */}
        {actions.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
              RECOMMENDED ACTIONS
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {actions.map((action, idx) => {
                const actionText = typeof action === 'string' ? action : action?.action || action?.reason || 'Review system operations';
                const actionReason = typeof action === 'object' ? action?.reason : null;

                return (
                  <div
                    key={idx}
                    className="flex items-start space-x-2.5 p-3 rounded-lg bg-polar-950/50 border border-polar-800/80 text-xs text-slate-200"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="space-y-0.5">
                      <span className="leading-relaxed font-medium block">{actionText}</span>
                      {actionReason && actionReason !== actionText && (
                        <span className="text-[11px] text-slate-400 leading-snug block">
                          Reason: {actionReason}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Button to Dive into Station */}
        <div className="pt-2 flex justify-end">
          <Link
            to={`/${stationId}`}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold tracking-wider uppercase transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,243,255,0.2)]"
          >
            <span>Open {stationName} Full Operations Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
