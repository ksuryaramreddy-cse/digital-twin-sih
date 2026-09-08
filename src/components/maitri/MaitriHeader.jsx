import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  Clock, 
  Activity, 
  Compass, 
  Radio, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function MaitriHeader({ 
  name = "MAITRI", 
  subtitle = "Antarctic Research Station", 
  code = "IND-MAITRI-02",
  coordinates, 
  crewCapacity, 
  overallHealth = 96.8,
  status = "ONLINE"
}) {
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tactical-panel rounded-2xl p-6 border border-cyan-500/30 bg-gradient-to-r from-polar-950 via-polar-900 to-polar-950 shadow-2xl relative overflow-hidden">
      {/* Subtle background glow effect */}
      <div className="absolute top-0 right-0 w-96 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Title & Station Coordinates */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 text-xs font-mono font-black bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 rounded tracking-wider">
              {code}
            </span>
            
            {/* Pulsing LIVE Indicator */}
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-md font-mono text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="tracking-widest">LIVE</span>
            </span>

            <StatusBadge status={status} size="md" />

            <span className="text-xs font-mono text-slate-400 bg-polar-800/80 px-2.5 py-1 rounded border border-polar-750">
              Schirmacher Oasis Inland Base
            </span>
          </div>

          <div>
            <div className="flex items-baseline space-x-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-black text-white tracking-tight">
                {name}
              </h1>
              <span className="text-sm sm:text-lg font-mono font-semibold text-cyan-400">
                {subtitle}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-mono text-slate-300 mt-2.5">
              <div className="flex items-center space-x-1.5 text-cyan-300">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{coordinates?.lat}, {coordinates?.long}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Compass className="w-3.5 h-3.5 text-slate-500" />
                <span>{coordinates?.region}</span>
              </div>
              <span className="text-slate-500 font-medium">({coordinates?.elevation})</span>
            </div>
          </div>
        </div>

        {/* Right Info Chips & Last Updated Clock */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-polar-750 pt-4 lg:pt-0 lg:pl-6">
          {/* Last Updated Time */}
          <div className="bg-polar-900/90 p-3 rounded-xl border border-polar-800 col-span-2 sm:col-span-1">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Last Updated</span>
            </div>
            <div className="text-xs font-mono font-bold text-cyan-300 mt-1 truncate">
              {currentTime}
            </div>
            <span className="text-[10px] font-mono text-emerald-400 block mt-0.5">
              ● Telemetry Stream Active
            </span>
          </div>

          {/* System Health */}
          <div className="bg-polar-900/90 p-3 rounded-xl border border-polar-800">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Overall Health</span>
            </div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
              {overallHealth}%
            </div>
            <span className="text-[10px] font-mono text-slate-500">All Systems Nominal</span>
          </div>

          {/* Crew */}
          <div className="bg-polar-900/90 p-3 rounded-xl border border-polar-800">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Station Crew</span>
            </div>
            <div className="text-xl font-mono font-bold text-sky-300 mt-1">
              {crewCapacity?.current} <span className="text-xs text-slate-400 font-normal">/ {crewCapacity?.maxWinter}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Wintering Team</span>
          </div>
        </div>
      </div>
    </div>
  );
}

