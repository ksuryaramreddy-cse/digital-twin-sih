import React from 'react';
import { 
  Radio, 
  Layers, 
  Wind, 
  Flame, 
  Satellite, 
  Activity, 
  ShieldCheck, 
  Zap,
  Gauge
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function BharatiSpecialized({ aerodynamicData, isroData, sciencePayloads, chpThermalKW }) {
  return (
    <div className="space-y-6">
      {/* 1. Aerodynamic Stilt Structural Health & Snowdrift Clearance */}
      <div className="tactical-panel rounded-xl p-5 border border-sky-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-polar-800 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-950/70 border border-sky-500/40 text-sky-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
                  Aerodynamic Stilt & Wind-Shear Telemetry
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                  EXCLUSIVE BHARATI ARCHITECTURE
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Hydraulic Stilt Load Cells • 4.0m Under-Chassis Snowdrift Aerodynamic Clearance
              </p>
            </div>
          </div>
          <StatusBadge status="OPTIMAL" size="sm" />
        </div>

        {/* Stilt Load Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-4">
          {aerodynamicData?.stiltLoadShear?.map((stilt) => (
            <div key={stilt.stiltId} className="bg-polar-900/80 p-3.5 rounded-lg border border-polar-800">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-200">{stilt.stiltId}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              </div>
              <div className="text-xl font-mono font-extrabold text-sky-400 mt-2">
                {stilt.loadKN} <span className="text-xs font-normal text-slate-400">kN</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1 space-y-0.5">
                <div>Vib: <span className="text-slate-200">{stilt.vibrationHz} Hz</span></div>
                <div>Tilt: <span className="text-emerald-400 font-medium">{stilt.tiltDeg}° (Nominal)</span></div>
              </div>
            </div>
          ))}
        </div>

        {/* Structural Summary Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-polar-800/80 text-xs font-mono">
          <div className="bg-polar-900/40 p-2.5 rounded border border-polar-800">
            <span className="text-slate-400 block text-[10px]">GROUND CLEARANCE</span>
            <span className="text-slate-100 font-semibold">{aerodynamicData?.groundClearanceMeters}m Elevated Stilts</span>
          </div>
          <div className="bg-polar-900/40 p-2.5 rounded border border-polar-800">
            <span className="text-slate-400 block text-[10px]">SNOWDRIFT PASS-THROUGH</span>
            <span className="text-emerald-400 font-semibold">{aerodynamicData?.snowDriftClearanceUnderneath}</span>
          </div>
          <div className="bg-polar-900/40 p-2.5 rounded border border-polar-800">
            <span className="text-slate-400 block text-[10px]">STRUCTURAL SAFETY FACTOR</span>
            <span className="text-cyan-400 font-semibold">{aerodynamicData?.structuralSafetyFactor}</span>
          </div>
        </div>
      </div>

      {/* 2. ISRO Earth Ground Station (Bharati Ground Station - BGS) */}
      <div className="tactical-panel rounded-xl p-5 border border-cyan-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-polar-800 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
              <Satellite className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
                  ISRO Bharati Satellite Ground Station (BGS)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  NATIONAL SPACE ASSET
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                11-Meter Radome Polar Earth Observation Downlink Hub
              </p>
            </div>
          </div>
          <StatusBadge status="TRACKING_ACTIVE" size="sm" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Main 11m Tracking Dish */}
          <div className="bg-polar-900/80 p-4 rounded-lg border border-polar-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-300">
                {isroData?.antenna11Meters?.dishId}
              </span>
              <StatusBadge status={isroData?.antenna11Meters?.status} size="sm" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-polar-950/80 p-2.5 rounded border border-polar-800">
                <span className="text-[10px] text-slate-400 block">Target Satellite</span>
                <span className="text-slate-100 font-bold">{isroData?.antenna11Meters?.targetSatellite}</span>
              </div>
              <div className="bg-polar-950/80 p-2.5 rounded border border-polar-800">
                <span className="text-[10px] text-slate-400 block">Downlink Rate</span>
                <span className="text-emerald-400 font-bold">{isroData?.antenna11Meters?.dataDownlinkThroughputGbps} Gbps</span>
              </div>
            </div>

            <div className="space-y-1 text-xs font-mono text-slate-400 pt-1">
              <div className="flex justify-between">
                <span>Pointing Coordinates:</span>
                <span className="text-slate-200 font-semibold">
                  Az: {isroData?.antenna11Meters?.azimuth}° • El: {isroData?.antenna11Meters?.elevation}°
                </span>
              </div>
              <div className="flex justify-between">
                <span>RF Link Margin:</span>
                <span className="text-emerald-400 font-semibold">+{isroData?.antenna11Meters?.linkMarginDb} dB (Locked)</span>
              </div>
              <div className="flex justify-between">
                <span>Next Scheduled Pass:</span>
                <span className="text-sky-300 font-semibold">{isroData?.antenna11Meters?.nextScheduledPass}</span>
              </div>
            </div>
          </div>

          {/* Auxiliary 7.5m Dish & CHP Thermal System */}
          <div className="space-y-3">
            <div className="bg-polar-900/80 p-3.5 rounded-lg border border-polar-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300">
                  {isroData?.antennaAuxiliary?.dishId}
                </span>
                <StatusBadge status={isroData?.antennaAuxiliary?.status} size="sm" />
              </div>
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Target: {isroData?.antennaAuxiliary?.targetSatellite}</span>
                <span className="text-sky-400">{isroData?.antennaAuxiliary?.nextScheduledPass}</span>
              </div>
            </div>

            {/* Combined Heat & Power (CHP) loop */}
            <div className="bg-polar-900/80 p-3.5 rounded-lg border border-polar-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-slate-200 block uppercase">
                    Automated CHP Thermal Recovery
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Generator exhaust to district radiator heating
                  </span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-lg font-bold text-amber-400">+{chpThermalKW || 88.4} kW</span>
                <span className="text-[10px] text-emerald-400 block">91% Heat Capture</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bharati Scientific Observatories */}
      <div className="tactical-panel rounded-xl p-5 border border-sky-500/20">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-polar-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
                Bharati Coastal & Marine Science Payloads
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Prydz Bay Oceanography, Glaciology & Cryosphere Mass Balance
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold">5/5 ONLINE</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {sciencePayloads?.map((payload, index) => (
            <div key={index} className="bg-polar-900/80 p-3.5 rounded-lg border border-polar-800 hover:border-sky-500/30 transition">
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
                <span className="text-sm font-mono font-bold text-sky-400">{payload.value}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

