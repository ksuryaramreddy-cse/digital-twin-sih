import React from 'react';
import {
  FileText,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Brain,
  Building2,
  Info,
} from 'lucide-react';

const RISK_BADGES = {
  LOW: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
  MEDIUM: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
  HIGH: 'bg-orange-950/70 border-orange-500/40 text-orange-300',
  CRITICAL: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
};

/**
 * ExecutiveSummary.jsx
 * ====================
 * Transparent summary of existing backend intelligence for operational commanders.
 *
 * Props:
 *   priorityStation {object|null} - highestPriorityStation from commandCenterData
 *   readinessPercent {number}     - average readiness across polar network
 */
export default function ExecutiveSummary({ priorityStation, readinessPercent = 0 }) {
  const hasPriority = Boolean(priorityStation && priorityStation.decision);

  return (
    <section
      aria-label="Operational Executive Summary"
      className="rounded-2xl border border-polar-800 bg-polar-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-4 font-mono"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-polar-800 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
              OPERATIONAL EXECUTIVE SUMMARY
            </h3>
            <p className="text-[11px] text-slate-400">
              Deterministic operational briefing synthesized from real telemetry, ML anomalies, and forecasts
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400">Pipeline Status:</span>
          <span className="text-cyan-300 font-semibold">{readinessPercent}% Ready</span>
        </div>
      </div>

      {hasPriority ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Focus & Risk */}
            <div className="p-4 rounded-xl bg-polar-950/60 border border-polar-850 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                PRIMARY OPERATIONAL FOCUS
              </span>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-white uppercase flex items-center gap-1.5">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  {priorityStation.stationName} STATION
                </span>
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                  RISK_BADGES[priorityStation.decision.overallRisk?.toUpperCase()] || RISK_BADGES.LOW
                }`}>
                  {priorityStation.decision.overallRisk || 'LOW'} RISK
                </span>
              </div>
              <div className="text-xs text-slate-400 pt-1">
                Priority Ranking: <span className="text-slate-200 font-semibold">{priorityStation.decision.priority || 'P4 - ROUTINE'}</span>
                {' • '}
                Risk Score: <span className="text-cyan-400 font-bold">{Math.round(priorityStation.decision.riskScore || 0)}/100</span>
              </div>
            </div>

            {/* Recommended Action Directive */}
            <div className="p-4 rounded-xl bg-polar-950/60 border border-polar-850 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                IMMEDIATE ACTION DIRECTIVE
              </span>
              <div className="text-sm font-semibold text-amber-300 leading-snug">
                {(() => {
                  const actions = priorityStation.decision.recommendedActions;
                  if (Array.isArray(actions) && actions.length > 0) {
                    const first = actions[0];
                    return typeof first === 'string' ? first : first?.action || first?.reason || 'Maintain continuous automated telemetry surveillance.';
                  }
                  return 'Maintain continuous automated telemetry surveillance and power reserve monitoring.';
                })()}
              </div>
              {priorityStation.decision.recommendedActions?.length > 1 && (
                <div className="text-[11px] text-slate-400">
                  +{priorityStation.decision.recommendedActions.length - 1} additional recommended procedures available on station dashboard.
                </div>
              )}
            </div>
          </div>

          {/* Operational Rationale / Reason */}
          <div className="p-4 rounded-xl bg-polar-950/40 border border-polar-850">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              OPERATIONAL RATIONALE
            </span>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic border-l-2 border-cyan-400/50 pl-3">
              "{priorityStation.decision.summary || 'All monitored subsystems demonstrate stable operational envelopes.'}"
            </p>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-xl bg-polar-950/60 border border-polar-850 flex items-start space-x-3 text-xs text-slate-300">
          <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-slate-200">
              Decision intelligence is still learning from operational telemetry.
            </div>
            <p className="text-slate-400 leading-relaxed">
              Both polar stations are operating within baseline parameters or telemetry history is accumulating to establish statistical baselines. Executive summaries update dynamically as live conditions fluctuate.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
