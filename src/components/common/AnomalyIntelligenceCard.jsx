/**
 * AnomalyIntelligenceCard.jsx
 * ============================
 * Displays the real IsolationForest ML anomaly result from the local backend.
 *
 * Props
 * -----
 *   anomalyData  {object|null}  — raw response from GET /api/v1/stations/{id}/anomaly
 *                                  null  = not yet received (LOADING)
 *   stationName  {string}       — "Maitri" | "Bharati" (display label only)
 *
 * States rendered
 * ---------------
 *   LOADING   anomalyData === null
 *   LEARNING  anomalyData.status === "LEARNING"
 *   NORMAL    anomalyData.status === "ACTIVE" && severity === "NORMAL"
 *   WARNING   anomalyData.status === "ACTIVE" && severity === "WARNING"
 *   CRITICAL  anomalyData.status === "ACTIVE" && severity === "CRITICAL"
 *
 * Design rules
 * ------------
 *   • Matches existing design system: tactical-panel, polar-* classes, font-mono
 *   • Uses only Tailwind + Lucide — no new dependencies
 *   • Never invents scores or fake values — only renders what the backend returns
 *   • topDeviationFactors are labelled honestly as statistical deviations,
 *     NOT "AI feature importance" or "root cause"
 */

import React from 'react';
import {
  Brain,
  Activity,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Loader2,
  BookOpen,
  Thermometer,
  Wind,
  Droplets,
  Gauge,
  BatteryMedium,
  Fuel,
  Waves,
  Zap,
  Settings2,
  HelpCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Feature name → human-readable label + icon
// ---------------------------------------------------------------------------
const FEATURE_META = {
  temperature:      { label: 'Temperature',        icon: Thermometer },
  windSpeed:        { label: 'Wind Speed',          icon: Wind        },
  humidity:         { label: 'Humidity',            icon: Droplets    },
  pressure:         { label: 'Pressure',            icon: Gauge       },
  battery:          { label: 'Battery',             icon: BatteryMedium },
  fuel:             { label: 'Fuel Level',          icon: Fuel        },
  water:            { label: 'Water Level',         icon: Waves       },
  powerConsumption: { label: 'Power Consumption',   icon: Zap         },
  generatorLoad:    { label: 'Generator Load',      icon: Settings2   },
};

function featureMeta(key) {
  return FEATURE_META[key] ?? { label: key, icon: HelpCircle };
}

// ---------------------------------------------------------------------------
// Severity → colour scheme (matches existing design token vocabulary)
// ---------------------------------------------------------------------------
const SEVERITY_SCHEME = {
  NORMAL: {
    border:      'border-emerald-500/30',
    headerBg:    'bg-emerald-950/40',
    headerText:  'text-emerald-300',
    headerBorder:'border-emerald-500/20',
    dotColor:    'bg-emerald-400',
    dotPing:     'bg-emerald-400',
    scoreBar:    'bg-emerald-500',
    icon:        CheckCircle2,
    iconColor:   'text-emerald-400',
    badgeBg:     'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
    label:       'NORMAL',
  },
  WARNING: {
    border:      'border-amber-500/40',
    headerBg:    'bg-amber-950/40',
    headerText:  'text-amber-300',
    headerBorder:'border-amber-500/20',
    dotColor:    'bg-amber-400',
    dotPing:     'bg-amber-400',
    scoreBar:    'bg-amber-500',
    icon:        AlertTriangle,
    iconColor:   'text-amber-400',
    badgeBg:     'bg-amber-950/70 border-amber-500/40 text-amber-300',
    label:       'WARNING',
  },
  CRITICAL: {
    border:      'border-rose-500/50',
    headerBg:    'bg-rose-950/40',
    headerText:  'text-rose-300',
    headerBorder:'border-rose-500/20',
    dotColor:    'bg-rose-400',
    dotPing:     'bg-rose-400',
    scoreBar:    'bg-rose-500',
    icon:        AlertOctagon,
    iconColor:   'text-rose-400',
    badgeBg:     'bg-rose-950/70 border-rose-500/40 text-rose-300',
    label:       'CRITICAL',
  },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Pulsing status dot (reuses the same pattern as StatusBadge.jsx) */
function PulsingDot({ colorClass }) {
  return (
    <span className="relative flex h-2 w-2 flex-shrink-0">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClass} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colorClass}`} />
    </span>
  );
}

/** 0-100 horizontal anomaly score bar */
function AnomalyScoreBar({ score, colorClass }) {
  const pct = Math.min(100, Math.max(0, score ?? 0));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 uppercase tracking-wider">Anomaly Index</span>
        <span className="text-slate-100 font-bold">
          {pct.toFixed(1)} <span className="text-slate-400 font-normal">/ 100</span>
        </span>
      </div>
      <div className="w-full bg-polar-900 rounded-full h-2 border border-polar-750 overflow-hidden">
        {/* Track colour zones: 0-54 green, 55-74 amber, 75-100 rose */}
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] font-mono text-slate-500">
        <span>0 — Normal</span>
        <span>100 — Highly Anomalous</span>
      </div>
    </div>
  );
}

/** One deviation factor row */
function DeviationRow({ factor }) {
  const { label, icon: Icon } = featureMeta(factor.feature);
  const devStr = typeof factor.deviation === 'number'
    ? `${factor.deviation.toFixed(2)}σ`
    : '—';
  const devHigh = (factor.deviation ?? 0) >= 3;

  return (
    <div className="flex items-start space-x-3 py-2.5 border-b border-polar-800 last:border-0">
      <div className="p-1.5 rounded-md bg-polar-800/80 border border-polar-750 text-slate-400 flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-mono font-semibold text-slate-200 truncate">{label}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[11px] font-mono text-slate-400">
          <span>Current: <span className="text-slate-200">{factor.currentValue}</span></span>
          <span>Baseline avg: <span className="text-slate-200">{factor.baselineAverage}</span></span>
        </div>
      </div>
      <div className={`text-xs font-mono font-bold flex-shrink-0 ${devHigh ? 'text-rose-400' : 'text-amber-400'}`}>
        {devStr}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STATE: LOADING
// ---------------------------------------------------------------------------
function LoadingState() {
  return (
    <div className="tactical-panel rounded-xl border border-cyan-500/20">
      {/* Header */}
      <div className="flex items-center space-x-3 px-5 py-4 border-b border-polar-800 bg-cyan-950/20 rounded-t-xl">
        <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/30">
          <Brain className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
            AI Operational Intelligence
          </h3>
          <p className="text-[11px] font-mono text-slate-400">IsolationForest · Multi-Sensor Anomaly Detection</p>
        </div>
      </div>
      {/* Body */}
      <div className="px-5 py-6 flex flex-col items-center justify-center space-y-3 text-center">
        <Loader2 className="w-7 h-7 text-cyan-500 animate-spin" />
        <p className="text-sm font-mono text-slate-300">Connecting to anomaly detection engine…</p>
        <p className="text-xs font-mono text-slate-500">
          <span className="inline-flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-600 animate-pulse" />
            <span>Waiting for ML analysis</span>
          </span>
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STATE: LEARNING
// ---------------------------------------------------------------------------
function LearningState({ data }) {
  const used    = data.samplesUsed           ?? 0;
  const minimum = data.minimumSamplesRequired ?? 30;
  const pct     = Math.min(100, Math.round((used / minimum) * 100));

  // Progress bar fill segments
  const filledCells  = Math.round(pct / 5);   // 20 cells total
  const totalCells   = 20;

  return (
    <div className="tactical-panel rounded-xl border border-sky-500/30">
      {/* Header */}
      <div className="flex items-center space-x-3 px-5 py-4 border-b border-polar-800 bg-sky-950/20 rounded-t-xl">
        <div className="p-2 rounded-lg bg-sky-950/70 border border-sky-500/30">
          <BookOpen className="w-5 h-5 text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
            AI Learning Operational Baseline
          </h3>
          <p className="text-[11px] font-mono text-slate-400">IsolationForest · Establishing normal behaviour profile</p>
        </div>
        <span className="flex-shrink-0 inline-flex items-center space-x-1.5 rounded-full font-mono font-semibold border bg-sky-950/70 border-sky-500/40 text-sky-300 text-[11px] px-2 py-0.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-sky-400" />
          </span>
          <span>LEARNING</span>
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-4">
        <p className="text-xs font-mono text-slate-300 leading-relaxed">
          {data.message ?? 'Collecting telemetry to understand normal station behaviour.'}
        </p>

        {/* Sample progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider">Samples collected</span>
            <span className="text-sky-300 font-bold">{used} / {minimum}</span>
          </div>

          {/* Block-style progress bar */}
          <div className="flex space-x-0.5">
            {Array.from({ length: totalCells }).map((_, i) => (
              <div
                key={i}
                className={`h-3 flex-1 rounded-sm transition-all duration-300 ${
                  i < filledCells ? 'bg-sky-500' : 'bg-polar-800 border border-polar-750'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0</span>
            <span className="text-sky-400 font-semibold">{pct}%</span>
            <span>{minimum} samples required</span>
          </div>
        </div>

        <p className="text-[11px] font-mono text-slate-500 border-t border-polar-800 pt-3">
          Anomaly detection will activate once sufficient telemetry history has been collected.
          Model: IsolationForest · contamination = 5%
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STATE: ACTIVE (NORMAL / WARNING / CRITICAL)
// ---------------------------------------------------------------------------
function ActiveState({ data, stationName }) {
  const severity  = data.severity ?? 'NORMAL';
  const scheme    = SEVERITY_SCHEME[severity] ?? SEVERITY_SCHEME.NORMAL;
  const SevIcon   = scheme.icon;
  const score     = data.anomalyScore ?? 0;
  const factors   = Array.isArray(data.topDeviationFactors) ? data.topDeviationFactors : [];

  return (
    <div className={`tactical-panel rounded-xl border ${scheme.border}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b ${scheme.headerBorder} ${scheme.headerBg} rounded-t-xl`}>
        <div className="flex items-center space-x-3 min-w-0">
          <div className={`p-2 rounded-lg bg-polar-900/80 border ${scheme.headerBorder}`}>
            <Brain className={`w-5 h-5 ${scheme.iconColor}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
              AI Anomaly Intelligence
            </h3>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              {stationName} · IsolationForest · {data.samplesUsed ?? 0} samples analysed
            </p>
          </div>
        </div>

        {/* Severity badge */}
        <span className={`flex-shrink-0 inline-flex items-center space-x-1.5 rounded-full font-mono font-semibold border text-[11px] px-2.5 py-1 ${scheme.badgeBg}`}>
          <span className="relative flex h-1.5 w-1.5">
            {severity !== 'NORMAL' && (
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${scheme.dotPing} opacity-75`} />
            )}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${scheme.dotColor}`} />
          </span>
          <span>{scheme.label}</span>
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-5">

        {/* Severity + message */}
        <div className="flex items-start space-x-3">
          <SevIcon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${scheme.iconColor}`} />
          <div className="space-y-0.5">
            <p className={`text-sm font-mono font-semibold ${scheme.headerText}`}>
              {severity === 'NORMAL'   && 'Station operating within learned baseline'}
              {severity === 'WARNING'  && 'Unusual multi-sensor operational pattern detected'}
              {severity === 'CRITICAL' && 'Significant deviation from learned operational behaviour'}
            </p>
            {data.message && data.message !== (
              severity === 'NORMAL'
                ? 'Station operating within learned baseline'
                : 'Unusual multi-sensor operational pattern detected'
            ) && (
              <p className="text-xs font-mono text-slate-400">{data.message}</p>
            )}
          </div>
        </div>

        {/* Anomaly score bar */}
        <AnomalyScoreBar score={score} colorClass={scheme.scoreBar} />

        {/* Metadata strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="bg-polar-900/60 rounded-lg border border-polar-800 px-3 py-2">
            <p className="text-slate-500 uppercase tracking-wider text-[10px]">Model</p>
            <p className="text-slate-200 font-semibold mt-0.5">{data.model ?? 'IsolationForest'}</p>
          </div>
          <div className="bg-polar-900/60 rounded-lg border border-polar-800 px-3 py-2">
            <p className="text-slate-500 uppercase tracking-wider text-[10px]">Contamination</p>
            <p className="text-slate-200 font-semibold mt-0.5">
              {data.contamination != null ? `${(data.contamination * 100).toFixed(0)}%` : '5%'}
            </p>
          </div>
          <div className="bg-polar-900/60 rounded-lg border border-polar-800 px-3 py-2 col-span-2 sm:col-span-1">
            <p className="text-slate-500 uppercase tracking-wider text-[10px]">Samples Used</p>
            <p className="text-slate-200 font-semibold mt-0.5">{data.samplesUsed ?? '—'}</p>
          </div>
        </div>

        {/* Top deviation factors */}
        {factors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 pb-1 border-b border-polar-800">
              <Activity className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                Top Unusual Deviations
              </p>
              <span className="text-[10px] font-mono text-slate-600 ml-auto">
                σ = std deviations from historical avg
              </span>
            </div>
            <div>
              {factors.map((f, i) => (
                <DeviationRow key={`${f.feature}-${i}`} factor={f} />
              ))}
            </div>
            <p className="text-[10px] font-mono text-slate-600 leading-relaxed">
              These are statistical deviations from the station's learned historical baseline.
              They indicate which sensors are furthest from normal — not a diagnosis of failure cause.
            </p>
          </div>
        )}

        {/* isAnomaly confirmation */}
        <div className={`flex items-center space-x-2 rounded-lg px-3 py-2 border text-xs font-mono ${
          data.isAnomaly
            ? 'bg-rose-950/30 border-rose-500/20 text-rose-300'
            : 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300'
        }`}>
          {data.isAnomaly
            ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            : <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          }
          <span>
            {data.isAnomaly
              ? 'IsolationForest classified this reading as anomalous'
              : 'IsolationForest classified this reading as within normal range'
            }
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export — decides which state to render
// ---------------------------------------------------------------------------
export default function AnomalyIntelligenceCard({ anomalyData, stationName = '' }) {
  // STATE 1 — LOADING: no response received yet
  if (anomalyData === null || anomalyData === undefined) {
    return <LoadingState />;
  }

  // STATE 2 — LEARNING: backend hasn't accumulated enough history
  if (anomalyData.status === 'LEARNING') {
    return <LearningState data={anomalyData} />;
  }

  // STATE 3/4/5 — ACTIVE: NORMAL / WARNING / CRITICAL
  if (anomalyData.status === 'ACTIVE') {
    return <ActiveState data={anomalyData} stationName={stationName} />;
  }

  // Fallback — unknown status from backend, show neutral loading
  return <LoadingState />;
}
