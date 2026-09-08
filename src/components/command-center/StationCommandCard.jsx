import React from 'react';
import { Link } from 'react-router-dom';
import {
  Battery,
  Fuel,
  Zap,
  Thermometer,
  Radar,
  TrendingUp,
  TrendingDown,
  Minus,
  Brain,
  Building2,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Clock,
  Gauge,
} from 'lucide-react';

const RISK_BADGES = {
  LOW: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
  MEDIUM: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
  HIGH: 'bg-orange-950/70 border-orange-500/40 text-orange-300',
  CRITICAL: 'bg-rose-950/70 border-rose-500/40 text-rose-300',
};

function formatTrend(trend) {
  if (!trend) return { label: 'STABLE', icon: Minus, color: 'text-slate-400' };
  const t = String(trend).toUpperCase();
  if (t.includes('INC') || t === 'UP') {
    return { label: 'INCREASING', icon: TrendingUp, color: 'text-emerald-400' };
  }
  if (t.includes('DEC') || t === 'DOWN') {
    return { label: 'DECREASING', icon: TrendingDown, color: 'text-rose-400' };
  }
  return { label: 'STABLE', icon: Minus, color: 'text-cyan-400' };
}

/**
 * StationCommandCard.jsx
 * ======================
 * Independent command card for a single station (Maitri or Bharati).
 * Shows station health, live resource meters, anomaly status, forecast trends, and decision risk.
 *
 * Props:
 *   station {object} - stationCommandSummary from commandCenterData.stations
 */
export default function StationCommandCard({ station }) {
  if (!station) {
    return (
      <div className="p-6 rounded-2xl border border-polar-800 bg-polar-900/80 font-mono text-slate-400">
        Station data unavailable.
      </div>
    );
  }

  const {
    stationId = 'unknown',
    stationName = 'Station',
    telemetry = {},
    anomaly = {},
    forecast = {},
    decision = {},
    readiness = {},
  } = station;

  const overallRisk = (decision?.overallRisk || 'LOW').toUpperCase();
  const riskBadgeClass = RISK_BADGES[overallRisk] || RISK_BADGES.LOW;
  const priority = decision?.priority || 'P4 - ROUTINE';
  const readinessPercent = readiness?.intelligenceReadinessPercent ?? 0;

  // Safe resource values
  const batteryVal = telemetry.battery !== null && telemetry.battery !== undefined
    ? `${Number(telemetry.battery).toFixed(1)}%`
    : '-';
  const fuelVal = telemetry.fuel !== null && telemetry.fuel !== undefined
    ? `${Number(telemetry.fuel).toFixed(1)}%`
    : '-';
  const powerVal = telemetry.powerConsumption !== null && telemetry.powerConsumption !== undefined
    ? `${Number(telemetry.powerConsumption).toFixed(1)} kW`
    : '-';
  const tempVal = telemetry.temperature !== null && telemetry.temperature !== undefined
    ? `${Number(telemetry.temperature).toFixed(1)} °C`
    : '-';

  // Anomaly details
  const anomalyStatus = anomaly.status || 'LOADING';
  const anomalySeverity = anomaly.severity || (anomalyStatus === 'ACTIVE' ? 'NORMAL' : 'INITIALIZING');
  const anomalyScore = anomaly.anomalyScore !== null && anomaly.anomalyScore !== undefined
    ? Math.round(Number(anomaly.anomalyScore))
    : '-';

  // Forecast trends
  const batteryTrendInfo = formatTrend(forecast.batteryTrend);
  const fuelTrendInfo = formatTrend(forecast.fuelTrend);
  const powerTrendInfo = formatTrend(forecast.powerTrend);
  const tempTrendInfo = formatTrend(forecast.temperatureTrend);

  const autonomyDays = forecast.estimatedAutonomyHours !== null && forecast.estimatedAutonomyHours !== undefined
    ? `${Math.round(forecast.estimatedAutonomyHours / 24)} Days (${Math.round(forecast.estimatedAutonomyHours)}h)`
    : null;

  // Decision details
  const riskScore = decision.riskScore !== null && decision.riskScore !== undefined
    ? Math.round(Number(decision.riskScore))
    : '-';
  const decisionSummary = decision.summary || (decision.status === 'LEARNING' ? 'Engine accumulating telemetry history baseline.' : 'Nominal operational status.');

  return (
    <article
      aria-label={`${stationName} Command Card`}
      className="relative flex flex-col justify-between rounded-2xl border border-polar-800 bg-polar-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl transition-all duration-200 hover:border-cyan-500/40 font-mono"
    >
      <div className="space-y-5">
        {/* 1. Header: Station name, Risk, Priority, Readiness */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-polar-800">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              <h3 className="text-lg sm:text-xl font-bold text-white uppercase tracking-wider">
                {stationName}
              </h3>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Station ID: <span className="text-cyan-400 font-semibold">{stationId}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${riskBadgeClass}`}>
              {overallRisk} RISK
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-polar-950/80 border border-polar-750 text-slate-300">
              {priority}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-950/60 border border-cyan-500/30 text-cyan-300">
              READY {readinessPercent}%
            </span>
          </div>
        </div>

        {/* 2. Live Resources Grid */}
        <div>
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2 flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            LIVE TELEMETRY RESOURCES
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-polar-950/60 border border-polar-850">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
                <span>Battery</span>
                <Battery className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-base font-bold text-slate-100">{batteryVal}</div>
            </div>

            <div className="p-3 rounded-xl bg-polar-950/60 border border-polar-850">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
                <span>Fuel</span>
                <Fuel className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-base font-bold text-slate-100">{fuelVal}</div>
            </div>

            <div className="p-3 rounded-xl bg-polar-950/60 border border-polar-850">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
                <span>Power</span>
                <Zap className="w-3.5 h-3.5 text-sky-400" />
              </div>
              <div className="text-base font-bold text-slate-100">{powerVal}</div>
            </div>

            <div className="p-3 rounded-xl bg-polar-950/60 border border-polar-850">
              <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase mb-1">
                <span>Temp</span>
                <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-base font-bold text-slate-100">{tempVal}</div>
            </div>
          </div>
        </div>

        {/* 3. Anomaly Intelligence */}
        <div className="p-3.5 rounded-xl bg-polar-950/60 border border-polar-850 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5 text-cyan-400" />
              ANOMALY INTELLIGENCE
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              anomalySeverity === 'CRITICAL' ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40' :
              anomalySeverity === 'WARNING' ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40' :
              'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
            }`}>
              {anomalySeverity}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
            <span className="text-slate-400">Model Status: <span className="text-slate-200">{anomalyStatus}</span></span>
            <span>Anomaly Score: <span className="font-bold text-cyan-400">{anomalyScore}</span></span>
          </div>
        </div>

        {/* 4. Forecast Intelligence */}
        <div className="p-3.5 rounded-xl bg-polar-950/60 border border-polar-850 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              FORECAST INTELLIGENCE
            </span>
            <span className="text-[10px] text-cyan-300 font-semibold">
              {forecast.status || 'LOADING'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-polar-900/80 border border-polar-800">
              <span className="text-slate-400">Battery:</span>
              <span className={`font-semibold flex items-center gap-1 ${batteryTrendInfo.color}`}>
                <batteryTrendInfo.icon className="w-3 h-3" />
                {batteryTrendInfo.label}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-polar-900/80 border border-polar-800">
              <span className="text-slate-400">Fuel:</span>
              <span className={`font-semibold flex items-center gap-1 ${fuelTrendInfo.color}`}>
                <fuelTrendInfo.icon className="w-3 h-3" />
                {fuelTrendInfo.label}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-polar-900/80 border border-polar-800">
              <span className="text-slate-400">Power:</span>
              <span className={`font-semibold flex items-center gap-1 ${powerTrendInfo.color}`}>
                <powerTrendInfo.icon className="w-3 h-3" />
                {powerTrendInfo.label}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-polar-900/80 border border-polar-800">
              <span className="text-slate-400">Temp:</span>
              <span className={`font-semibold flex items-center gap-1 ${tempTrendInfo.color}`}>
                <tempTrendInfo.icon className="w-3 h-3" />
                {tempTrendInfo.label}
              </span>
            </div>
          </div>

          {autonomyDays && (
            <div className="text-[11px] text-amber-300/90 pt-1 flex items-center justify-between border-t border-polar-800/60">
              <span className="text-slate-400">Est. Fuel Autonomy:</span>
              <span className="font-bold">{autonomyDays}</span>
            </div>
          )}
        </div>

        {/* 5. Decision Intelligence */}
        <div className="p-3.5 rounded-xl bg-polar-950/60 border border-polar-850 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              DECISION INTELLIGENCE
            </span>
            <span className="text-slate-300 text-xs">
              Risk Score: <span className="font-bold text-white">{riskScore} / 100</span>
            </span>
          </div>
          <p className="text-xs text-slate-300 italic line-clamp-2 pt-0.5">
            "{decisionSummary}"
          </p>
        </div>
      </div>

      {/* 6. Footer Button */}
      <div className="pt-4 mt-2 border-t border-polar-800/80 flex justify-end">
        <Link
          to={`/${stationId}`}
          className="inline-flex items-center space-x-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-bold uppercase tracking-wider transition-colors"
        >
          <span>View {stationName} Full Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </article>
  );
}
