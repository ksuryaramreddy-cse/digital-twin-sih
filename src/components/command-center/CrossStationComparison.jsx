import React from 'react';
import {
  Battery,
  Fuel,
  Zap,
  ShieldAlert,
  ArrowRight,
  Minus,
  CheckCircle2,
} from 'lucide-react';

const RISK_WEIGHTS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const RISK_COLORS = {
  LOW: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/40',
  MEDIUM: 'text-amber-400 bg-amber-950/70 border-amber-500/40',
  HIGH: 'text-orange-400 bg-orange-950/70 border-orange-500/40',
  CRITICAL: 'text-rose-400 bg-rose-950/70 border-rose-500/40',
};

function formatStationName(key) {
  if (!key || key === 'equal') return 'Balanced';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/**
 * CrossStationComparison.jsx
 * ============================
 * Direct operational comparison between Maitri and Bharati across:
 * - Battery Storage Reserves
 * - Fuel Remaining
 * - Power Demand (Load)
 * - Operational Risk Severity
 *
 * Props:
 *   comparison {object|null} - crossStationComparison from commandCenterData
 */
export default function CrossStationComparison({ comparison }) {
  if (!comparison) {
    return (
      <section
        aria-label="Cross-Station Comparison"
        className="rounded-2xl border border-polar-800 bg-polar-900/80 p-6 backdrop-blur-xl font-mono text-slate-400"
      >
        Cross-station comparison data unavailable.
      </section>
    );
  }

  const { battery, fuel, powerConsumption, overallRisk } = comparison;

  // Maximum power demand for normalizing progress bars (default fallback to 150 kW max)
  const maxPower = powerConsumption
    ? Math.max(100, Math.ceil(Math.max(powerConsumption.maitri || 0, powerConsumption.bharati || 0) * 1.2))
    : 100;

  return (
    <section
      aria-label="Cross-Station Operational Comparison"
      className="rounded-2xl border border-polar-800 bg-polar-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-xl space-y-6 font-mono"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-polar-800 gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>⚖️</span>
            CROSS-STATION OPERATIONAL COMPARISON
          </h3>
          <p className="text-xs text-slate-400">
            Real-time differential analysis between Maitri (Inland) and Bharati (Coastal)
          </p>
        </div>
        <div className="text-[11px] text-cyan-400/80 px-2.5 py-1 rounded bg-cyan-950/40 border border-cyan-500/20 self-start sm:self-auto">
          Synchronized REST Telemetry
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. BATTERY COMPARISON */}
        <div className="p-4 rounded-xl bg-polar-950/60 border border-polar-850 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold uppercase flex items-center gap-1.5">
              <Battery className="w-4 h-4 text-cyan-400" />
              BATTERY RESERVES
            </span>
            {battery ? (
              <span className="text-[11px] text-cyan-300">
                Δ {battery.difference}% variance
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">Data unavailable</span>
            )}
          </div>

          {battery ? (
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Maitri</span>
                  <span className="font-bold text-white">{battery.maitri}%</span>
                </div>
                <div className="w-full h-2 bg-polar-900 rounded-full overflow-hidden border border-polar-800">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, battery.maitri))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Bharati</span>
                  <span className="font-bold text-white">{battery.bharati}%</span>
                </div>
                <div className="w-full h-2 bg-polar-900 rounded-full overflow-hidden border border-polar-800">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, battery.bharati))}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 text-[11px] flex items-center justify-between border-t border-polar-800/60 text-slate-400">
                <span>Lower Reserve:</span>
                <span className={`font-bold ${battery.lowerStation !== 'equal' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {formatStationName(battery.lowerStation)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic py-3 text-center">
              Battery telemetry awaiting sensor data.
            </div>
          )}
        </div>

        {/* 2. FUEL COMPARISON */}
        <div className="p-4 rounded-xl bg-polar-950/60 border border-polar-850 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold uppercase flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-amber-400" />
              FUEL RESERVES
            </span>
            {fuel ? (
              <span className="text-[11px] text-amber-300">
                Δ {fuel.difference}% variance
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">Data unavailable</span>
            )}
          </div>

          {fuel ? (
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Maitri</span>
                  <span className="font-bold text-white">{fuel.maitri}%</span>
                </div>
                <div className="w-full h-2 bg-polar-900 rounded-full overflow-hidden border border-polar-800">
                  <div
                    className="h-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, fuel.maitri))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Bharati</span>
                  <span className="font-bold text-white">{fuel.bharati}%</span>
                </div>
                <div className="w-full h-2 bg-polar-900 rounded-full overflow-hidden border border-polar-800">
                  <div
                    className="h-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, fuel.bharati))}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 text-[11px] flex items-center justify-between border-t border-polar-800/60 text-slate-400">
                <span>Lower Reserve:</span>
                <span className={`font-bold ${fuel.lowerStation !== 'equal' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {formatStationName(fuel.lowerStation)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic py-3 text-center">
              Fuel reserve telemetry awaiting sensor data.
            </div>
          )}
        </div>

        {/* 3. POWER DEMAND COMPARISON */}
        <div className="p-4 rounded-xl bg-polar-950/60 border border-polar-850 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold uppercase flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-sky-400" />
              POWER GRID DEMAND
            </span>
            {powerConsumption ? (
              <span className="text-[11px] text-sky-300">
                Δ {powerConsumption.difference} kW delta
              </span>
            ) : (
              <span className="text-slate-500 text-[11px]">Data unavailable</span>
            )}
          </div>

          {powerConsumption ? (
            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Maitri</span>
                  <span className="font-bold text-white">{powerConsumption.maitri} kW</span>
                </div>
                <div className="w-full h-2 bg-polar-900 rounded-full overflow-hidden border border-polar-800">
                  <div
                    className="h-full bg-sky-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, (powerConsumption.maitri / maxPower) * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Bharati</span>
                  <span className="font-bold text-white">{powerConsumption.bharati} kW</span>
                </div>
                <div className="w-full h-2 bg-polar-900 rounded-full overflow-hidden border border-polar-800">
                  <div
                    className="h-full bg-sky-400 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, (powerConsumption.bharati / maxPower) * 100))}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 text-[11px] flex items-center justify-between border-t border-polar-800/60 text-slate-400">
                <span>Higher Demand:</span>
                <span className="font-bold text-sky-300">
                  {formatStationName(powerConsumption.higherStation)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic py-3 text-center">
              Power grid load telemetry awaiting sensor data.
            </div>
          )}
        </div>

        {/* 4. OPERATIONAL RISK COMPARISON */}
        <div className="p-4 rounded-xl bg-polar-950/60 border border-polar-850 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold uppercase flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              OPERATIONAL RISK
            </span>
            <span className="text-[11px] text-slate-400">
              Decision Synthesis
            </span>
          </div>

          {overallRisk ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-polar-900/80 border border-polar-800">
                <span className="text-slate-300">Maitri Risk:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${RISK_COLORS[overallRisk.maitri] || 'text-slate-300 border-polar-750'}`}>
                  {overallRisk.maitri || 'EVALUATING'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-polar-900/80 border border-polar-800">
                <span className="text-slate-300">Bharati Risk:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${RISK_COLORS[overallRisk.bharati] || 'text-slate-300 border-polar-750'}`}>
                  {overallRisk.bharati || 'EVALUATING'}
                </span>
              </div>

              <div className="pt-2 text-[11px] flex items-center justify-between border-t border-polar-800/60 text-slate-400">
                <span>Higher Operational Risk:</span>
                <span className="font-bold text-amber-300">
                  {formatStationName(overallRisk.higherRiskStation)}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic py-3 text-center">
              Risk assessment models undergoing baseline learning.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
