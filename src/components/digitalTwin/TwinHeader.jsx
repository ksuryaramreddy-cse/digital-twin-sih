import React, { useState, useEffect } from 'react';
import { 
  Globe2, 
  Cpu, 
  Clock, 
  Users, 
  Zap, 
  Radio, 
  ShieldAlert, 
  Activity 
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function TwinHeader({ maitri, bharati }) {
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalPersonnel = (maitri?.crewCapacity?.current || 24) + (bharati?.crewCapacity?.current || 44);
  const totalPowerKW = Number(((maitri?.powerConsumption || 48.6) + (bharati?.powerConsumption || 118.5)).toFixed(1));

  return (
    <div className="tactical-panel rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-r from-polar-950 via-polar-900 to-polar-950 shadow-2xl relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 right-0 w-[500px] h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Title & Description */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 text-xs font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded tracking-wider">
              AIP-DT POLARIS v2.8
            </span>
            
            {/* Live Synchronized Badge */}
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full font-mono text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="tracking-widest">LIVE TWIN SYNC</span>
            </span>

            <span className="text-xs font-mono text-slate-400 bg-polar-800/80 px-2.5 py-1 rounded border border-polar-750">
              2 Active Polar Research Stations Tracked
            </span>
          </div>

          <div>
            <div className="flex items-baseline space-x-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-black text-white tracking-tight">
                ANTARCTIC DIGITAL TWIN
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-cyan-400 font-mono mt-1">
              Real-Time Polar Environment Visualization & Dual-Station Telemetry Grid
            </p>
          </div>
        </div>

        {/* Right Info Chips & UTC Clock */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-polar-750 pt-4 lg:pt-0 lg:pl-6">
          {/* Last Updated Time */}
          <div className="bg-polar-900/90 p-3 rounded-xl border border-polar-800 col-span-2 sm:col-span-1">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Live UTC Timestamp</span>
            </div>
            <div className="text-xs font-mono font-bold text-cyan-300 mt-1 truncate">
              {currentTime}
            </div>
            <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
              ● Synchronized Real-time
            </span>
          </div>

          {/* Total Antarctic Personnel */}
          <div className="bg-polar-900/90 p-3 rounded-xl border border-polar-800">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Polar Expeditioners</span>
            </div>
            <div className="text-xl font-mono font-bold text-sky-300 mt-1">
              {totalPersonnel} <span className="text-xs text-slate-400 font-normal">Crew</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">24 Maitri + 44 Bharati</span>
          </div>

          {/* Combined Continent Power */}
          <div className="bg-polar-900/90 p-3 rounded-xl border border-polar-800">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Combined Power</span>
            </div>
            <div className="text-xl font-mono font-bold text-amber-300 mt-1">
              {totalPowerKW} <span className="text-xs text-slate-400 font-normal">kW</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Dual Microgrids</span>
          </div>
        </div>
      </div>
    </div>
  );
}

