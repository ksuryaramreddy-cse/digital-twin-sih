import React from 'react';
import { 
  Droplet, 
  SunMedium, 
  Activity, 
  Layers, 
  ThermometerSnowflake, 
  ShieldCheck, 
  Sliders,
  CheckCircle2
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function MaitriSpecialized({ lakeData, sciencePayloads }) {
  return (
    <div className="space-y-6">
      {/* 1. Lake Priyadarshini Freshwater Management Module */}
      <div className="tactical-panel rounded-xl p-5 border border-cyan-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-polar-800 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
                  Lake Priyadarshini Water Extraction System
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  EXCLUSIVE MAITRI ASSET
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Schirmacher Oasis Sub-Ice Fresh Water Source & Trace-Heated Pipeline
              </p>
            </div>
          </div>
          <StatusBadge status="OPTIMAL" size="sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sub-Ice Pump Flow */}
          <div className="bg-polar-900/80 p-3.5 rounded-lg border border-polar-800">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Sub-Ice Pump Delivery</span>
            <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
              {lakeData?.flowRateLPM} <span className="text-xs font-normal text-slate-400">L/min</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 block mt-1">
              Pump Status: {lakeData?.pumpStatus}
            </span>
          </div>

          {/* Trace Heating Pipeline Temp */}
          <div className="bg-polar-900/80 p-3.5 rounded-lg border border-polar-800">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Trace Heated Line Temp</span>
            <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
              +{lakeData?.pipelineTraceHeatingTempC} <span className="text-xs font-normal text-slate-400">°C</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              Anti-freeze trace circuit online
            </span>
          </div>

          {/* Lake Ice Cover Thickness */}
          <div className="bg-polar-900/80 p-3.5 rounded-lg border border-polar-800">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Surface Ice Thickness</span>
            <div className="text-2xl font-mono font-bold text-sky-300 mt-1">
              {lakeData?.lakeIceThicknessMeters} <span className="text-xs font-normal text-slate-400">meters</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              Sub-ice water temp: +{lakeData?.subIceWaterTempC}°C
            </span>
          </div>

          {/* Water Purity Index */}
          <div className="bg-polar-900/80 p-3.5 rounded-lg border border-polar-800">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Purity TDS & pH</span>
            <div className="text-2xl font-mono font-bold text-emerald-400 mt-1">
              {lakeData?.waterPurityTDS} <span className="text-xs font-normal text-slate-400">ppm TDS</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">
              pH: {lakeData?.phLevel} (Potable Pristine)
            </span>
          </div>
        </div>

        {/* Reservoir Capacity Bar */}
        <div className="mt-4 pt-3 border-t border-polar-800/80">
          <div className="flex justify-between items-center text-xs font-mono mb-1.5">
            <span className="text-slate-300">Main Water Storage Reservoir Level:</span>
            <span className="text-cyan-400 font-bold">
              {lakeData?.currentWaterStoredL?.toLocaleString()} / {lakeData?.storageReservoirCapacityL?.toLocaleString()} L ({lakeData?.storagePercentage}%)
            </span>
          </div>
          <div className="w-full bg-polar-900 rounded-full h-2 overflow-hidden border border-polar-750">
            <div 
              className="h-full bg-cyan-500 rounded-full transition-all duration-500" 
              style={{ width: `${lakeData?.storagePercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 2. Maitri Scientific Research Payloads & Dobson Spectrophotometer */}
      <div className="tactical-panel rounded-xl p-5 border border-cyan-500/20">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-polar-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-400">
              <SunMedium className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
                Maitri Scientific Observatories & Sensor Arrays
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Atmospheric Chemistry, Geomagnetism & Solid Earth Geodesy Payloads
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold">5/5 PAYLOADS ACTIVE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sciencePayloads?.map((payload, index) => (
            <div key={index} className="bg-polar-900/80 p-3.5 rounded-lg border border-polar-800 hover:border-cyan-500/30 transition">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-polar-800 text-slate-300 border border-polar-750 uppercase">
                  {payload.category}
                </span>
                <StatusBadge status={payload.status} size="sm" />
              </div>
              <h4 className="font-mono font-semibold text-xs text-slate-100 mt-2.5">
                {payload.name}
              </h4>
              <div className="mt-2 pt-2 border-t border-polar-800 flex justify-between items-baseline">
                <span className="text-[10px] font-mono text-slate-400">{payload.metricLabel}:</span>
                <span className="text-sm font-mono font-bold text-cyan-400">{payload.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

