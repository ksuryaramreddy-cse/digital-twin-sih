import React from 'react';
import { 
  MapPin, 
  Users, 
  Calendar, 
  Activity, 
  Compass, 
  ShieldCheck, 
  Radio, 
  Layers 
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function StationHeroHeader({ 
  name, 
  code, 
  type, 
  coordinates, 
  established, 
  crewCapacity, 
  status, 
  overallHealth, 
  lastSync,
  themeColor = "cyan"
}) {
  return (
    <div className="tactical-panel rounded-2xl p-6 border border-cyan-500/20 mb-6 bg-gradient-to-r from-polar-900 via-polar-850 to-polar-900 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Info */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-1 text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 rounded">
              {code}
            </span>
            <StatusBadge status={status} size="md" />
            <span className="text-xs font-mono text-slate-400 bg-polar-800/80 px-2.5 py-1 rounded border border-polar-750">
              {type}
            </span>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-mono font-black text-white tracking-tight">
              {name}
            </h1>
            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs font-mono text-slate-300 mt-2">
              <div className="flex items-center space-x-1.5 text-cyan-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{coordinates?.lat}, {coordinates?.long}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-slate-400">
                <Compass className="w-3.5 h-3.5 text-slate-500" />
                <span>{coordinates?.region}</span>
              </div>
              <span className="text-slate-500">({coordinates?.elevation})</span>
            </div>
          </div>
        </div>

        {/* Right Metric Quick Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t lg:border-t-0 lg:border-l border-polar-750 pt-4 lg:pt-0 lg:pl-6">
          {/* Health */}
          <div className="bg-polar-900/80 p-3 rounded-lg border border-polar-800">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>System Health</span>
            </div>
            <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
              {overallHealth}%
            </div>
            <span className="text-[10px] font-mono text-slate-500">Telemetry synced</span>
          </div>

          {/* Crew */}
          <div className="bg-polar-900/80 p-3 rounded-lg border border-polar-800">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              <span>Station Crew</span>
            </div>
            <div className="text-xl font-mono font-bold text-sky-300 mt-1">
              {crewCapacity?.current} <span className="text-xs text-slate-400 font-normal">/ {crewCapacity?.maxWinter}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">Winter Expedition</span>
          </div>

          {/* Commissioned */}
          <div className="bg-polar-900/80 p-3 rounded-lg border border-polar-800 col-span-2 sm:col-span-1">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[10px] font-mono uppercase">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Commissioned</span>
            </div>
            <div className="text-xl font-mono font-bold text-amber-300 mt-1">
              {established}
            </div>
            <span className="text-[10px] font-mono text-slate-500">Operational Base</span>
          </div>
        </div>
      </div>
    </div>
  );
}

