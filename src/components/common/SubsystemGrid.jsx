import React from 'react';
import { 
  Zap, 
  HeartPulse, 
  Droplet, 
  Radio, 
  Flame, 
  ShieldCheck, 
  Layers,
  ThermometerSnowflake
} from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function SubsystemGrid({ powerGrid, lifeSupport, comms, specializedTitle, specializedContent }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 1. Power Generation & Microgrid */}
      <div className="tactical-panel rounded-xl p-5 border border-cyan-500/20 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-polar-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-sm text-slate-100 uppercase">Power Microgrid</h4>
                <p className="text-[11px] font-mono text-slate-400">Diesel / Hybrid Generators</p>
              </div>
            </div>
            <StatusBadge status="ONLINE" size="sm" />
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-mono text-slate-400">Current Output:</span>
              <span className="text-lg font-mono font-bold text-amber-400">
                {powerGrid?.totalDemandKW} <span className="text-xs text-slate-400">/ {powerGrid?.totalGenerationKW} kW</span>
              </span>
            </div>

            {/* Load bar */}
            <div>
              <div className="w-full bg-polar-900 rounded-full h-2 overflow-hidden border border-polar-750">
                <div 
                  className="bg-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${powerGrid?.loadPercentage || 80}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>Bus Load: {powerGrid?.loadPercentage}%</span>
                <span>Freq: {powerGrid?.gridFrequency} Hz</span>
              </div>
            </div>

            {/* Generators List */}
            <div className="space-y-2 pt-2 border-t border-polar-800/80">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Genset Matrix</span>
              {powerGrid?.generators?.map((gen) => (
                <div key={gen.id} className="bg-polar-900/60 rounded p-2 border border-polar-800 flex items-center justify-between text-xs font-mono">
                  <div>
                    <span className="text-slate-200 font-medium block text-[11px]">{gen.name}</span>
                    <span className="text-[10px] text-slate-400">{gen.outputKW} kW • {gen.tempC}°C Coolant</span>
                  </div>
                  <StatusBadge status={gen.status} size="sm" pulse={gen.status === 'RUNNING'} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-polar-800 flex justify-between text-[11px] font-mono text-slate-400">
          <span>Fuel Reserves: <strong className="text-slate-200">{powerGrid?.fuelReserveLitres?.toLocaleString()} L</strong></span>
          <span className="text-emerald-400 font-semibold">~{powerGrid?.fuelDaysRemaining} days</span>
        </div>
      </div>

      {/* 2. Life Support & Environmental Habitability */}
      <div className="tactical-panel rounded-xl p-5 border border-cyan-500/20 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-polar-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-sm text-slate-100 uppercase">Life Support & HVAC</h4>
                <p className="text-[11px] font-mono text-slate-400">Atmospheric & Thermal Control</p>
              </div>
            </div>
            <StatusBadge status="OPTIMAL" size="sm" />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-polar-900/70 p-2.5 rounded border border-polar-800">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Indoor Temp</span>
              <span className="text-xl font-mono font-bold text-emerald-400">
                +{lifeSupport?.habitatTempC}°C
              </span>
              <span className="text-[10px] font-mono text-slate-500 block">Setpoint: +21°C</span>
            </div>

            <div className="bg-polar-900/70 p-2.5 rounded border border-polar-800">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Habitat CO2</span>
              <span className="text-xl font-mono font-bold text-cyan-400">
                {lifeSupport?.co2Ppm} <span className="text-xs font-normal">ppm</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 block">Safe (&lt;1000)</span>
            </div>

            <div className="bg-polar-900/70 p-2.5 rounded border border-polar-800">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Oxygen Level</span>
              <span className="text-xl font-mono font-bold text-slate-100">
                {lifeSupport?.oxygenPercentage}%
              </span>
              <span className="text-[10px] font-mono text-emerald-400 block">Nominal (20.9%)</span>
            </div>

            <div className="bg-polar-900/70 p-2.5 rounded border border-polar-800">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Indoor Humidity</span>
              <span className="text-xl font-mono font-bold text-sky-400">
                {lifeSupport?.habitatHumidity}%
              </span>
              <span className="text-[10px] font-mono text-slate-500 block">Comfort Range</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-polar-900/40 rounded border border-polar-800/80 space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span>Fire Suppression Loop:</span>
              <span className="text-emerald-400 font-semibold">ARMED & PRESSURIZED</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Emergency Escape Hatches:</span>
              <span className="text-emerald-400 font-semibold">TRACE-HEATED / CLEAR</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-polar-800 flex justify-between text-[11px] font-mono text-slate-400">
          <span>Greywater Recycling:</span>
          <span className="text-cyan-400 font-semibold">
            {lifeSupport?.greyWaterRecycleEfficiency || lifeSupport?.greywaterRecycleEfficiencyPct || 85}% Efficiency
          </span>
        </div>
      </div>

      {/* 3. Satellite Comms & Ground Link */}
      <div className="tactical-panel rounded-xl p-5 border border-cyan-500/20 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-polar-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-sm text-slate-100 uppercase">Telemetry & Comms</h4>
                <p className="text-[11px] font-mono text-slate-400">Polar Satellite Feeder</p>
              </div>
            </div>
            <StatusBadge status="ONLINE" size="sm" />
          </div>

          <div className="mt-4 space-y-3">
            <div className="bg-polar-900/60 p-2.5 rounded border border-polar-800 space-y-1 text-xs font-mono">
              <span className="text-[10px] text-slate-400 uppercase">Primary Satellite Gateway</span>
              <p className="text-cyan-300 font-semibold text-[13px]">{comms?.primaryUplink}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-polar-900/60 p-2 rounded border border-polar-800">
                <span className="text-[10px] text-slate-400 block">Uplink Rate</span>
                <span className="text-base font-bold text-emerald-400">{comms?.uplinkSpeedMbps} Mbps</span>
              </div>
              <div className="bg-polar-900/60 p-2 rounded border border-polar-800">
                <span className="text-[10px] text-slate-400 block">Downlink Rate</span>
                <span className="text-base font-bold text-cyan-400">{comms?.downlinkSpeedMbps} Mbps</span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono text-slate-400 pt-1">
              <div className="flex justify-between">
                <span>Carrier Signal (RSSI):</span>
                <span className="text-slate-200 font-semibold">{comms?.signalStrengthDbm} dBm</span>
              </div>
              <div className="flex justify-between">
                <span>Round-Trip Latency:</span>
                <span className="text-slate-200 font-semibold">{comms?.latencyMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span>Packet Loss:</span>
                <span className="text-emerald-400 font-semibold">{comms?.packetLossPct}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-polar-800 text-[11px] font-mono text-slate-400">
          <span>Backup Route: <strong className="text-sky-300">{comms?.backupLink}</strong></span>
        </div>
      </div>
    </div>
  );
}

