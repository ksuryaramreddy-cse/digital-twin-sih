/**
 * PredictiveForecastCard.jsx
 * ===========================
 * Displays the real operational forecast intelligence from the local backend
 * predictive forecasting engine (GET /api/v1/stations/{station_id}/forecast).
 *
 * Props
 * -----
 *   forecastData {object|null}  - raw response from /api/v1/stations/{station_id}/forecast
 *                                 null = not yet received (LOADING)
 *   stationName  {string}       - "Maitri" | "Bharati"
 *
 * States rendered
 * ---------------
 *   LOADING   forecastData === null
 *   LEARNING  forecastData.status === "LEARNING"
 *   ACTIVE    forecastData.status === "ACTIVE"
 *
 * Design rules
 * ------------
 *   • Matches existing design system: tactical-panel, polar-* classes, font-mono
 *   • Strictly uses real data from backend - never invents or hardcodes forecast values
 *   • Renders direction indicators: INCREASING (↑), DECREASING (↓), STABLE (→)
 *   • Labels confidence honestly as "Trend Confidence" (R² correlation)
 */

import React from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Minus,
  BatteryMedium,
  Fuel,
  Zap,
  Thermometer,
  Clock,
  Loader2,
  BookOpen,
  Info,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Confidence Badge configuration
// ---------------------------------------------------------------------------
const CONFIDENCE_SCHEMES = {
  HIGH: {
    badge: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
    dot: 'bg-emerald-400',
    text: 'text-emerald-400',
    label: 'HIGH',
  },
  MEDIUM: {
    badge: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
    dot: 'bg-amber-400',
    text: 'text-amber-400',
    label: 'MEDIUM',
  },
  LOW: {
    badge: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
    dot: 'bg-rose-400',
    text: 'text-rose-400',
    label: 'LOW',
  },
};

function getConfidenceScheme(confidence) {
  const key = String(confidence || '').toUpperCase();
  return CONFIDENCE_SCHEMES[key] || {
    badge: 'bg-slate-800 border-slate-700 text-slate-400',
    dot: 'bg-slate-500',
    text: 'text-slate-400',
    label: key || 'UNKNOWN',
  };
}

// ---------------------------------------------------------------------------
// Trend direction helper
// ---------------------------------------------------------------------------
function getTrendInfo(trend) {
  switch (trend) {
    case 'INCREASING':
      return {
        arrow: '↑',
        icon: TrendingUp,
        label: 'INCREASING',
        color: 'text-rose-400',
        bg: 'bg-rose-950/40 border-rose-500/30',
      };
    case 'DECREASING':
      return {
        arrow: '↓',
        icon: TrendingDown,
        label: 'DECREASING',
        color: 'text-amber-400',
        bg: 'bg-amber-950/40 border-amber-500/30',
      };
    case 'STABLE':
    default:
      return {
        arrow: '→',
        icon: Minus,
        label: 'STABLE',
        color: 'text-cyan-400',
        bg: 'bg-cyan-950/40 border-cyan-500/30',
      };
  }
}

// ---------------------------------------------------------------------------
// Method name humanizer for Temperature SES
// ---------------------------------------------------------------------------
function humanizeMethod(method) {
  if (!method) return 'Statistical Projection';
  if (method === 'simple_exponential_smoothing') return 'Simple Exponential Smoothing';
  if (method === 'fallback_latest') return 'Latest Observed Value';
  return method
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// ---------------------------------------------------------------------------
// Sub-component: Confidence Tag
// ---------------------------------------------------------------------------
function ConfidenceTag({ confidence }) {
  const scheme = getConfidenceScheme(confidence);
  return (
    <span
      className={`inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold border ${scheme.badge}`}
      title="Trend Confidence based on R² goodness-of-fit"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${scheme.dot}`} />
      <span>{scheme.label}</span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// STATE 1: LOADING
// ---------------------------------------------------------------------------
function LoadingState({ stationName }) {
  return (
    <div className="tactical-panel rounded-xl border border-cyan-500/20">
      {/* Header */}
      <div className="flex items-center space-x-3 px-5 py-4 border-b border-polar-800 bg-cyan-950/20 rounded-t-xl">
        <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/30">
          <Sparkles className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider">
            Predictive Forecast Intelligence
          </h3>
          <p className="text-[11px] font-mono text-slate-400">
            {stationName ? `${stationName} Station • ` : ''}Next 24 Hours Operational Trend Analysis
          </p>
        </div>
      </div>
      {/* Body */}
      <div className="px-5 py-8 flex flex-col items-center justify-center space-y-3 text-center">
        <Loader2 className="w-7 h-7 text-cyan-500 animate-spin" />
        <p className="text-sm font-mono text-slate-300">Connecting to predictive forecasting engine...</p>
        <p className="text-xs font-mono text-slate-500">
          <span className="inline-flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span>Awaiting telemetry trend projection</span>
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
  const used = data.samplesUsed ?? 0;
  const minimum = data.minimumSamplesRequired ?? 20;
  const pct = Math.min(100, Math.round((used / minimum) * 100));
  const spanHours = data.timeSpanHours;
  const minSpanHours = data.minimumTimeSpanHours;

  const totalCells = 20;
  const filledCells = Math.min(totalCells, Math.round((used / minimum) * totalCells));

  return (
    <div className="tactical-panel rounded-xl border border-cyan-500/30">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-polar-800 bg-cyan-950/20 rounded-t-xl">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/30">
            <BookOpen className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider truncate">
              Predictive Forecast Intelligence
            </h3>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              {stationName} Station • Forecast Engine Learning
            </p>
          </div>
        </div>
        <span className="flex-shrink-0 inline-flex items-center space-x-1.5 rounded-md font-mono font-semibold border bg-cyan-950/70 border-cyan-500/40 text-cyan-300 text-[11px] px-2.5 py-0.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400" />
          </span>
          <span>LEARNING</span>
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-5 space-y-4">
        <p className="text-xs font-mono text-slate-300 leading-relaxed">
          {data.message ?? 'Collecting telemetry history to establish reliable operational trends.'}
        </p>

        {/* Telemetry Learning Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 uppercase tracking-wider">Telemetry Learning</span>
            <span className="text-cyan-300 font-bold">{used} / {minimum} samples</span>
          </div>

          {/* Block-style progress bar */}
          <div className="flex space-x-0.5">
            {Array.from({ length: totalCells }).map((_, i) => (
              <div
                key={i}
                className={`h-3 flex-1 rounded-sm transition-all duration-300 ${
                  i < filledCells ? 'bg-cyan-500' : 'bg-polar-800 border border-polar-750'
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>0</span>
            <span className="text-cyan-400 font-semibold">{pct}%</span>
            <span>{minimum} samples required</span>
          </div>
        </div>

        {/* Time span information if available */}
        {spanHours != null && minSpanHours != null && (
          <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 bg-polar-900/60 rounded-lg p-2.5 border border-polar-800">
            <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span>
              Recorded Span: <span className="text-slate-200 font-bold">{(spanHours * 60).toFixed(1)} min</span> /{' '}
              <span className="text-slate-400">{(minSpanHours * 60).toFixed(0)} min required</span>
            </span>
          </div>
        )}

        <p className="text-[11px] font-mono text-slate-500 border-t border-polar-800 pt-3">
          Predictive forecasts will activate once sufficient telemetry history and elapsed time span are recorded.
          Models: Linear Regression (OLS) · Simple Exponential Smoothing (SES)
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// STATE 3: ACTIVE
// ---------------------------------------------------------------------------
function ActiveState({ data, stationName }) {
  const battery = data.battery || {};
  const fuel = data.fuel || {};
  const power = data.powerConsumption || {};
  const temp = data.temperature || {};

  const battTrend = getTrendInfo(battery.trend);
  const fuelTrend = getTrendInfo(fuel.trend);
  const powerTrend = getTrendInfo(power.trend);
  const tempTrend = getTrendInfo(temp.trend);

  const autonomyHours = fuel.estimatedAutonomyHours;

  return (
    <div className="tactical-panel rounded-xl border border-cyan-500/30">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-cyan-950/20 rounded-t-xl">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-lg bg-polar-900/80 border border-cyan-500/30">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h3 className="font-mono font-bold text-sm text-white uppercase tracking-wider flex items-center space-x-2 truncate">
              <span>PREDICTIVE FORECAST INTELLIGENCE</span>
            </h3>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              {stationName} Station • Next 24 Hours • {data.samplesUsed ?? 0} samples analyzed
            </p>
          </div>
        </div>

        {/* Live Forecast Engine Badge */}
        <span className="flex-shrink-0 inline-flex items-center space-x-1.5 rounded-md font-mono font-semibold border bg-emerald-950/70 border-emerald-500/40 text-emerald-300 text-[11px] px-2.5 py-1">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
          </span>
          <span>LIVE FORECAST ENGINE</span>
        </span>
      </div>

      {/* Body: 4 Forecasting Metric Panels */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. BATTERY FORECAST */}
          <div className="bg-polar-900/70 rounded-xl border border-polar-800 p-4 flex flex-col justify-between space-y-3 hover:border-polar-750 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BatteryMedium className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Battery
                  </span>
                </div>
                <ConfidenceTag confidence={battery.confidence} />
              </div>

              {/* Current -> 24H Forecast */}
              <div className="mt-3 flex items-baseline justify-between font-mono">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Current</p>
                  <p className="text-lg font-bold text-slate-200">
                    {typeof battery.current === 'number' ? `${battery.current}%` : '-'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 mx-1 self-center" />
                <div className="text-right">
                  <p className="text-[10px] text-cyan-400 uppercase tracking-wider">24H Forecast</p>
                  <p className="text-lg font-bold text-cyan-300">
                    {typeof battery.forecast === 'number' ? `${battery.forecast}%` : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Trend & Rate */}
            <div className="space-y-1.5 pt-2 border-t border-polar-800 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Trend:</span>
                <span className={`font-semibold flex items-center space-x-1 ${battTrend.color}`}>
                  <span>{battTrend.arrow}</span>
                  <span>{battTrend.label}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rate:</span>
                <span className="text-slate-200 font-semibold">
                  {typeof battery.ratePerHour === 'number'
                    ? `${battery.ratePerHour > 0 ? '+' : ''}${battery.ratePerHour.toFixed(2)} %/hr`
                    : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>R² Correlation:</span>
                <span className="font-mono text-slate-400">
                  {typeof battery.rSquared === 'number' ? battery.rSquared.toFixed(2) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. FUEL FORECAST */}
          <div className="bg-polar-900/70 rounded-xl border border-polar-800 p-4 flex flex-col justify-between space-y-3 hover:border-polar-750 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Fuel
                  </span>
                </div>
                <ConfidenceTag confidence={fuel.confidence} />
              </div>

              {/* Current -> 24H Forecast */}
              <div className="mt-3 flex items-baseline justify-between font-mono">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Current</p>
                  <p className="text-lg font-bold text-slate-200">
                    {typeof fuel.current === 'number' ? `${fuel.current}%` : '-'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 mx-1 self-center" />
                <div className="text-right">
                  <p className="text-[10px] text-cyan-400 uppercase tracking-wider">24H Forecast</p>
                  <p className="text-lg font-bold text-cyan-300">
                    {typeof fuel.forecast === 'number' ? `${fuel.forecast}%` : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Trend & Rate */}
            <div className="space-y-1.5 pt-2 border-t border-polar-800 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Trend:</span>
                <span className={`font-semibold flex items-center space-x-1 ${fuelTrend.color}`}>
                  <span>{fuelTrend.arrow}</span>
                  <span>{fuelTrend.label}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rate:</span>
                <span className="text-slate-200 font-semibold">
                  {typeof fuel.ratePerHour === 'number'
                    ? `${fuel.ratePerHour > 0 ? '+' : ''}${fuel.ratePerHour.toFixed(2)} %/hr`
                    : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>R² Correlation:</span>
                <span className="font-mono text-slate-400">
                  {typeof fuel.rSquared === 'number' ? fuel.rSquared.toFixed(2) : '-'}
                </span>
              </div>
            </div>

            {/* Autonomy Callout */}
            <div className="pt-2 border-t border-polar-800/80">
              {typeof autonomyHours === 'number' && autonomyHours !== null ? (
                <div className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-2 text-center">
                  <p className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Estimated Autonomy</p>
                  <p className="text-xs font-mono font-bold text-amber-200 mt-0.5">
                    {autonomyHours.toFixed(1)} hrs • {(autonomyHours / 24).toFixed(1)} days
                  </p>
                  <p className="text-[9px] font-mono text-amber-400/80">remaining at current depletion rate</p>
                </div>
              ) : (
                <div className="bg-polar-950/40 border border-polar-800 rounded-lg p-1.5 text-center">
                  <p className="text-[10px] font-mono text-slate-400 leading-tight">
                    Autonomy stable - no meaningful depletion trend detected
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 3. POWER CONSUMPTION FORECAST */}
          <div className="bg-polar-900/70 rounded-xl border border-polar-800 p-4 flex flex-col justify-between space-y-3 hover:border-polar-750 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Power Load
                  </span>
                </div>
                <ConfidenceTag confidence={power.confidence} />
              </div>

              {/* Current -> 24H Forecast */}
              <div className="mt-3 flex items-baseline justify-between font-mono">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Current</p>
                  <p className="text-lg font-bold text-slate-200">
                    {typeof power.current === 'number' ? `${power.current} kW` : '-'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 mx-1 self-center" />
                <div className="text-right">
                  <p className="text-[10px] text-cyan-400 uppercase tracking-wider">24H Forecast</p>
                  <p className="text-lg font-bold text-cyan-300">
                    {typeof power.forecast === 'number' ? `${power.forecast} kW` : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Trend & Rate */}
            <div className="space-y-1.5 pt-2 border-t border-polar-800 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Trend:</span>
                <span className={`font-semibold flex items-center space-x-1 ${powerTrend.color}`}>
                  <span>{powerTrend.arrow}</span>
                  <span>{powerTrend.label}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Rate:</span>
                <span className="text-slate-200 font-semibold">
                  {typeof power.ratePerHour === 'number'
                    ? `${power.ratePerHour > 0 ? '+' : ''}${power.ratePerHour.toFixed(2)} kW/hr`
                    : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>R² Correlation:</span>
                <span className="font-mono text-slate-400">
                  {typeof power.rSquared === 'number' ? power.rSquared.toFixed(2) : '-'}
                </span>
              </div>
            </div>
          </div>

          {/* 4. TEMPERATURE FORECAST */}
          <div className="bg-polar-900/70 rounded-xl border border-polar-800 p-4 flex flex-col justify-between space-y-3 hover:border-polar-750 transition-colors">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Temperature
                  </span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-sky-950/70 border border-sky-500/40 text-sky-300">
                  SES
                </span>
              </div>

              {/* Current -> Near-Term Forecast */}
              <div className="mt-3 flex items-baseline justify-between font-mono">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">Current</p>
                  <p className="text-lg font-bold text-slate-200">
                    {typeof temp.current === 'number' ? `${temp.current}°C` : '-'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 mx-1 self-center" />
                <div className="text-right">
                  <p className="text-[10px] text-cyan-400 uppercase tracking-wider">Near-Term</p>
                  <p className="text-lg font-bold text-cyan-300">
                    {typeof temp.forecast === 'number' ? `${temp.forecast}°C` : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Trend & Method */}
            <div className="space-y-1.5 pt-2 border-t border-polar-800 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Trend:</span>
                <span className={`font-semibold flex items-center space-x-1 ${tempTrend.color}`}>
                  <span>{tempTrend.arrow}</span>
                  <span>{tempTrend.label}</span>
                </span>
              </div>
              <div className="space-y-0.5 pt-1">
                <span className="text-slate-500 text-[10px] uppercase tracking-wider">Method:</span>
                <p className="text-slate-300 font-medium text-[11px] truncate" title={humanizeMethod(temp.method)}>
                  {humanizeMethod(temp.method)}
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Explainability Footer */}
        <div className="mt-4 pt-3 border-t border-polar-800/80 flex items-start space-x-2.5 text-[11px] font-mono text-slate-400">
          <Info className="w-4 h-4 text-cyan-400/80 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 leading-relaxed">
            <p className="text-slate-300 font-bold uppercase tracking-wider text-[10px]">
              Forecast Intelligence Architecture
            </p>
            <p className="text-slate-400">
              Battery, fuel, and power trends are estimated using recent telemetry regression. Temperature uses exponential smoothing.
            </p>
            <p className="text-slate-500 text-[10px]">
              Trend Confidence reflects how consistently recent data follows the detected trend (R² correlation).
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
export default function PredictiveForecastCard({ forecastData, stationName = '' }) {
  // STATE 1 - LOADING: no forecast data received yet
  if (forecastData === null || forecastData === undefined) {
    return <LoadingState stationName={stationName} />;
  }

  // STATE 2 - LEARNING: backend needs more history samples or elapsed time
  if (forecastData.status === 'LEARNING') {
    return <LearningState data={forecastData} stationName={stationName} />;
  }

  // STATE 3 - ACTIVE: 4 forecasting metrics ready
  if (forecastData.status === 'ACTIVE') {
    return <ActiveState data={forecastData} stationName={stationName} />;
  }

  // Fallback neutral loading
  return <LoadingState stationName={stationName} />;
}
