import React from 'react';
import { Activity, ShieldCheck, AlertTriangle, ShieldAlert, Radio, Compass } from 'lucide-react';

/**
 * CommandCenterHeader.jsx
 * =======================
 * Top banner for the Antarctic Operations Command Center.
 * Displays network connectivity status, title, subtitle, and dynamic system readiness.
 *
 * Props:
 *   readinessPercent {number} - Average operational readiness (0 - 100)
 *   connectionStatus {string} - Connection status (e.g., 'LIVE', 'CONNECTING', 'OFFLINE')
 */
export default function CommandCenterHeader({
  readinessPercent = 0,
  connectionStatus = 'LIVE',
}) {
  const safeReadiness = Number.isFinite(readinessPercent)
    ? Math.min(100, Math.max(0, Math.round(readinessPercent)))
    : 0;

  // Visual styling based on readiness tiers:
  // 80–100 -> Healthy (emerald)
  // 50–79  -> Warning (amber)
  // 0–49   -> Critical (rose)
  const isHealthy = safeReadiness >= 80;
  const isWarning = safeReadiness >= 50 && safeReadiness < 80;

  const readinessBadgeClasses = isHealthy
    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,231,150,0.2)]'
    : isWarning
    ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(255,183,3,0.2)]'
    : 'bg-rose-950/60 border-rose-500/40 text-rose-300 shadow-[0_0_15px_rgba(255,42,95,0.2)]';

  const ReadinessIcon = isHealthy
    ? ShieldCheck
    : isWarning
    ? AlertTriangle
    : ShieldAlert;

  const isLive = connectionStatus === 'LIVE';

  return (
    <header className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-polar-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xl">
      {/* Subtle tactical corner accent lines */}
      <div className="absolute top-0 left-0 w-16 h-1 bg-gradient-to-r from-cyan-400 to-transparent" />
      <div className="absolute top-0 left-0 w-1 h-16 bg-gradient-to-b from-cyan-400 to-transparent" />
      <div className="absolute top-0 right-0 w-16 h-1 bg-gradient-to-l from-cyan-400 to-transparent" />
      <div className="absolute top-0 right-0 w-1 h-16 bg-gradient-to-b from-cyan-400 to-transparent" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left: Mission Title & Subtitle */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-2xl font-mono font-extrabold tracking-wider text-white uppercase">
                ANTARCTIC OPERATIONS COMMAND CENTER
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm font-mono text-cyan-200/80 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            Unified Predictive Intelligence for Maitri & Bharati Research Stations
          </p>
        </div>

        {/* Right: Network Status & System Readiness */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Network Status Indicator */}
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-polar-950/80 border border-polar-800 font-mono text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isLive ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
            </span>
            <span className="text-slate-300 font-semibold tracking-wider">
              {isLive ? 'LIVE COMMAND NETWORK' : `NETWORK: ${connectionStatus}`}
            </span>
          </div>

          {/* Overall System Readiness Indicator */}
          <div
            className={`flex items-center space-x-2.5 px-4 py-1.5 rounded-lg border font-mono text-xs font-bold transition-colors ${readinessBadgeClasses}`}
          >
            <ReadinessIcon className="w-4 h-4" />
            <span className="tracking-wide">
              SYSTEM READINESS: {safeReadiness}%
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
