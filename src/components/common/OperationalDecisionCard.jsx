/**
 * OperationalDecisionCard.jsx
 * =============================
 * Situational Risk & Operational Decision Intelligence Card.
 *
 * Integrates real multi-sensor ML anomaly detection, predictive operational
 * forecasting, and explainable rule-based synthesis into categorical risks,
 * overall risk assessment, and prioritized operational action directives.
 *
 * Props:
 *   decisionData {object|null} - Raw response from /api/v1/stations/{id}/decision
 *   stationName  {string}      - "Maitri" | "Bharati"
 *
 * States:
 *   - LOADING   (decisionData === null)
 *   - LEARNING  (decisionData.status === "LEARNING")
 *   - ACTIVE    (decisionData.status === "ACTIVE")
 */

import React from 'react';
import {
  Brain,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  BookOpen,
  Zap,
  Package,
  CloudSnow,
  Cpu,
  ArrowRight,
  Info,
  Clock,
  Activity,
  CheckCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Risk Level Color & Badge Mapping (Presentation Only)
// ---------------------------------------------------------------------------
const RISK_SCHEMES = {
  LOW: {
    border: 'border-emerald-500/30',
    headerBg: 'bg-emerald-950/20',
    headerText: 'text-emerald-300',
    headerBorder: 'border-emerald-500/20',
    dotColor: 'bg-emerald-400',
    dotPing: 'bg-emerald-400',
    badge: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
    barColor: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    icon: ShieldCheck,
    label: 'LOW RISK',
  },
  MEDIUM: {
    border: 'border-amber-500/40',
    headerBg: 'bg-amber-950/20',
    headerText: 'text-amber-300',
    headerBorder: 'border-amber-500/20',
    dotColor: 'bg-amber-400',
    dotPing: 'bg-amber-400',
    badge: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
    barColor: 'bg-amber-500',
    textColor: 'text-amber-400',
    icon: AlertTriangle,
    label: 'MEDIUM RISK',
  },
  HIGH: {
    border: 'border-orange-500/40',
    headerBg: 'bg-orange-950/20',
    headerText: 'text-orange-300',
    headerBorder: 'border-orange-500/20',
    dotColor: 'bg-orange-400',
    dotPing: 'bg-orange-400',
    badge: 'bg-orange-950/70 border-orange-500/40 text-orange-300',
    barColor: 'bg-orange-500',
    textColor: 'text-orange-400',
    icon: AlertTriangle,
    label: 'HIGH RISK',
  },
  CRITICAL: {
    border: 'border-rose-500/50',
    headerBg: 'bg-rose-950/20',
    headerText: 'text-rose-300',
    headerBorder: 'border-rose-500/20',
    dotColor: 'bg-rose-400',
    dotPing: 'bg-rose-400',
    badge: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
    barColor: 'bg-rose-500',
    textColor: 'text-rose-400',
    icon: ShieldAlert,
    label: 'CRITICAL RISK',
  },
};

function getRiskScheme(level) {
  const key = String(level || '').toUpperCase();
  return RISK_SCHEMES[key] || RISK_SCHEMES.LOW;
}

// ---------------------------------------------------------------------------
// Priority Action Badge Helper
// ---------------------------------------------------------------------------
function getPriorityBadge(priorityNum) {
  const p = Number(priorityNum) || 4;
  if (p === 1) {
    return {
      label: 'P1 - CRITICAL',
      classes: 'bg-rose-950/70 border-rose-500/50 text-rose-300',
      dot: 'bg-rose-400',
    };
  } else if (p === 2) {
    return {
      label: 'P2 - HIGH',
      classes: 'bg-orange-950/70 border-orange-500/50 text-orange-300',
      dot: 'bg-orange-400',
    };
  } else if (p === 3) {
    return {
      label: 'P3 - MEDIUM',
      classes: 'bg-amber-950/70 border-amber-500/50 text-amber-300',
      dot: 'bg-amber-400',
    };
  } else {
    return {
      label: 'P4 - ROUTINE',
      classes: 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300',
      dot: 'bg-emerald-400',
    };
  }
}

// ---------------------------------------------------------------------------
// Category Metadata Helper
// ---------------------------------------------------------------------------
const CATEGORY_META = {
  energy: { label: 'ENERGY', icon: Zap, color: 'text-yellow-400' },
  resources: { label: 'RESOURCES', icon: Package, color: 'text-amber-400' },
  environment: { label: 'ENVIRONMENT', icon: CloudSnow, color: 'text-cyan-400' },
  infrastructure: { label: 'INFRASTRUCTURE', icon: Cpu, color: 'text-blue-400' },
};

// ---------------------------------------------------------------------------
// Sub-component: Category Card
// ---------------------------------------------------------------------------
function CategoryCard({ catKey, data }) {
  const meta = CATEGORY_META[catKey] || { label: catKey.toUpperCase(), icon: Activity, color: 'text-slate-400' };
  const Icon = meta.icon;
  const level = data?.level || 'LOW';
  const score = data?.score ?? 0;
  const factors = Array.isArray(data?.factors) ? data.factors : [];
  const scheme = getRiskScheme(level);

  return (
    <div className="bg-polar-900/70 rounded-xl border border-polar-800 p-4 flex flex-col justify-between space-y-3 hover:border-polar-750 transition-colors">
      <div>
        {/* Header: Icon + Category Name + Level Badge */}
        <div className="flex items-center justify-between pb-2 border-b border-polar-800/80">
          <div className="flex items-center space-x-2">
            <Icon className={`w-4 h-4 ${meta.color}`} />
            <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
              {meta.label}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${scheme.badge}`}>
            {level}
          </span>
        </div>

        {/* Score Row */}
        <div className="mt-3 flex items-baseline justify-between font-mono">
          <span className="text-[11px] text-slate-400">Risk Score:</span>
          <span className="text-base font-bold text-slate-100">
            {score} <span className="text-slate-500 text-xs font-normal">/ 100</span>
          </span>
        </div>

        {/* Mini Score Bar */}
        <div className="w-full bg-polar-950 rounded-full h-1.5 border border-polar-800 overflow-hidden mt-1.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${scheme.barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>

      {/* Triggered Factors List */}
      <div className="pt-2 border-t border-polar-800/80 text-[11px] font-mono">
        <span className="text-[10px] uppercase text-slate-500 tracking-wider block mb-1">
          Triggered Factors:
        </span>
        {factors.length > 0 ? (
          <ul className="space-y-1">
            {factors.map((factor, idx) => (
              <li key={idx} className="flex items-start space-x-1.5 text-slate-300 leading-snug">
                <span className="text-amber-400 flex-shrink-0 mt-0.5">•</span>
                <span className="text-[11px]">{factor}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500 italic text-[11px]">No elevated risk factors detected.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STATE 1: LOADING
// ---------------------------------------------------------------------------
function LoadingState({ stationName }) {
  return (
    <div className="tactical-panel rounded-xl border border-cyan-500/20">
      <div className="flex items-center space-x-3 px-5 py-4 border-b border-polar-800 bg-cyan-950/20 rounded-t-xl">
        <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/30">
          <Brain className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
            Operational Decision Intelligence
          </h3>
          <p className="text-[11px] font-mono text-slate-400">
            {stationName ? `${stationName} Station • ` : ''}Synthesizing Multi-Sensor & Forecast Intelligence
          </p>
        </div>
      </div>
      <div className="px-5 py-8 flex flex-col items-center justify-center space-y-3 text-center">
        <Loader2 className="w-7 h-7 text-cyan-500 animate-spin" />
        <p className="text-sm font-mono text-slate-300">Connecting to operational decision engine…</p>
        <p className="text-xs font-mono text-slate-500">
          <span className="inline-flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span>Awaiting telemetry, anomaly, and forecast synthesis</span>
          </span>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STATE 2: LEARNING
// ---------------------------------------------------------------------------
function LearningState({ data, stationName }) {
  return (
    <div className="tactical-panel rounded-xl border border-sky-500/30">
      <div className="flex items-center justify-between px-5 py-4 border-b border-polar-800 bg-sky-950/20 rounded-t-xl">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-lg bg-sky-950/70 border border-sky-500/30">
            <BookOpen className="w-5 h-5 text-sky-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider truncate">
              Operational Decision Intelligence
            </h3>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              {stationName} Station • Learning Operational Baseline
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 inline-flex items-center space-x-1.5 rounded-md font-mono font-semibold border bg-sky-950/70 border-sky-500/40 text-sky-300 text-[11px] px-2.5 py-0.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-400" />
          </span>
          <span>LEARNING</span>
        </span>
      </div>

      <div className="px-5 py-5 space-y-4">
        <p className="text-xs font-mono text-slate-300 leading-relaxed">
          {data.message || 'Operational intelligence is collecting sufficient telemetry data before generating risk assessments.'}
        </p>

        {/* Status of Upstream Intelligence Engines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="bg-polar-900/60 rounded-lg p-3 border border-polar-800 flex items-center justify-between">
            <span className="text-slate-400">Anomaly Engine:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
              data.anomalyStatus === 'ACTIVE'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                : 'bg-sky-950/70 border-sky-500/40 text-sky-300'
            }`}>
              {data.anomalyStatus || 'LEARNING'}
            </span>
          </div>

          <div className="bg-polar-900/60 rounded-lg p-3 border border-polar-800 flex items-center justify-between">
            <span className="text-slate-400">Forecast Engine:</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
              data.forecastStatus === 'ACTIVE'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                : 'bg-sky-950/70 border-sky-500/40 text-sky-300'
            }`}>
              {data.forecastStatus || 'LEARNING'}
            </span>
          </div>
        </div>

        <p className="text-[11px] font-mono text-slate-500 border-t border-polar-800 pt-3">
          Risk scores and prioritized action directives will activate once upstream anomaly and forecasting engines establish verified operational profiles.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STATE 3: ACTIVE
// ---------------------------------------------------------------------------
function ActiveState({ data, stationName }) {
  const overallRisk = data.overallRisk || 'LOW';
  const scheme = getRiskScheme(overallRisk);
  const SevIcon = scheme.icon;
  const score = typeof data.riskScore === 'number' ? data.riskScore : 0;
  const clampedScore = Math.min(100, Math.max(0, score));
  const priority = data.priority || 'P4 - ROUTINE';
  const summary = data.summary || 'Operational conditions are currently stable with no major predictive risks detected.';

  // Categories
  const categories = data.riskCategories || {};

  // Recommended actions (non-mutating sort by priority ascending)
  const actions = Array.isArray(data.recommendedActions)
    ? [...data.recommendedActions].sort((a, b) => (Number(a.priority) || 0) - (Number(b.priority) || 0))
    : [];

  // Formatted generated time
  let formattedTime = '';
  if (data.generatedAt) {
    try {
      formattedTime = new Date(data.generatedAt).toLocaleTimeString();
    } catch {
      formattedTime = data.generatedAt;
    }
  }

  return (
    <div className={`tactical-panel rounded-xl border ${scheme.border}`}>
      {/* 1. Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${scheme.headerBorder} ${scheme.headerBg} rounded-t-xl`}>
        <div className="flex items-center space-x-3 min-w-0">
          <div className={`p-2 rounded-lg bg-polar-900/80 border ${scheme.headerBorder}`}>
            <Brain className={`w-5 h-5 ${scheme.textColor}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider truncate">
              OPERATIONAL DECISION INTELLIGENCE
            </h3>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              {stationName} Station • Situational Risk & Decision Protocol
              {formattedTime ? ` • ${formattedTime}` : ''}
            </p>
          </div>
        </div>

        {/* Live Engine Indicator */}
        <span className="flex-shrink-0 inline-flex items-center space-x-1.5 rounded-md font-mono font-semibold border bg-emerald-950/70 border-emerald-500/40 text-emerald-300 text-[11px] px-2.5 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span>LIVE DECISION ENGINE</span>
        </span>
      </div>

      {/* 2. Body */}
      <div className="p-5 space-y-6">

        {/* Overall Risk Banner */}
        <div className="bg-polar-900/80 rounded-xl border border-polar-800 p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              <SevIcon className={`w-6 h-6 flex-shrink-0 ${scheme.textColor}`} />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                  Overall Operational Risk
                </span>
                <div className="flex items-center space-x-2 mt-0.5">
                  <span className={`text-lg font-mono font-bold ${scheme.textColor}`}>
                    {overallRisk}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${scheme.badge}`}>
                    {priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Numerical Score */}
            <div className="font-mono text-right sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Synthesized Score</span>
              <span className="text-xl font-bold text-white">
                {score.toFixed(1)} <span className="text-slate-500 text-xs font-normal">/ 100</span>
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-polar-950 rounded-full h-2.5 border border-polar-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${scheme.barColor}`}
                style={{ width: `${clampedScore}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0 - Stable Routine</span>
              <span>50 - Elevated Risk</span>
              <span>100 - Critical Hazard</span>
            </div>
          </div>

          {/* Explainable Summary */}
          <div className="bg-polar-950/60 rounded-lg p-3 border border-polar-800/80 text-xs font-mono text-slate-200 leading-relaxed">
            <span className="text-cyan-400 font-bold mr-1">ASSESSMENT:</span>
            {summary}
          </div>
        </div>

        {/* 3. Four Risk Category Panels */}
        <div className="space-y-2">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Categorical Operational Risk Breakdown
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <CategoryCard catKey="energy" data={categories.energy} />
            <CategoryCard catKey="resources" data={categories.resources} />
            <CategoryCard catKey="environment" data={categories.environment} />
            <CategoryCard catKey="infrastructure" data={categories.infrastructure} />
          </div>
        </div>

        {/* 4. Prioritized Operational Actions */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>PRIORITIZED OPERATIONAL ACTIONS</span>
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              {actions.length} Action Directive{actions.length !== 1 ? 's' : ''}
            </span>
          </div>

          {actions.length > 0 ? (
            <div className="space-y-2.5">
              {actions.map((act, index) => {
                const priorityBadge = getPriorityBadge(act.priority);
                return (
                  <div
                    key={index}
                    className="bg-polar-900/80 rounded-xl border border-polar-800 p-3.5 space-y-2 hover:border-polar-750 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center space-x-1 ${priorityBadge.classes}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${priorityBadge.dot}`} />
                          <span>{priorityBadge.label}</span>
                        </span>
                        <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                          [{act.category || 'OPERATION'}]
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 font-mono">
                      <p className="text-xs font-bold text-slate-100 flex items-start space-x-2">
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                        <span>{act.action}</span>
                      </p>
                      {act.reason && (
                        <p className="text-[11px] text-slate-400 pl-5 leading-relaxed">
                          <span className="text-slate-500">Reason:</span> {act.reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 flex items-center space-x-3 text-emerald-300">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-400" />
              <div className="text-xs font-mono">
                <p className="font-bold">No immediate intervention required.</p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Station subsystems are operating stably. Continue routine monitoring of station systems.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 5. Explainability Footer */}
        <div className="mt-4 pt-3 border-t border-polar-800/80 flex items-start space-x-2.5 text-[11px] font-mono text-slate-400">
          <Info className="w-4 h-4 text-cyan-400/80 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              Decision Explainability Architecture
            </p>
            <p className="text-slate-400">
              This assessment combines live telemetry, anomaly detection, predictive forecasting, and station-specific operational risk rules.
            </p>
            <p className="text-slate-500 text-[10px]">
              Risk recommendations are generated from the specific factors detected for this station.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------
export default function OperationalDecisionCard({ decisionData, stationName = '' }) {
  // STATE 1 - LOADING: no decision received yet
  if (decisionData === null || decisionData === undefined) {
    return <LoadingState stationName={stationName} />;
  }

  // STATE 2 - LEARNING: engine is accumulating baseline samples
  if (decisionData.status === 'LEARNING') {
    return <LearningState data={decisionData} stationName={stationName} />;
  }

  // STATE 3 - ACTIVE: decision intelligence ready
  if (decisionData.status === 'ACTIVE') {
    return <ActiveState data={decisionData} stationName={stationName} />;
  }

  // Neutral fallback
  return <LoadingState stationName={stationName} />;
}
