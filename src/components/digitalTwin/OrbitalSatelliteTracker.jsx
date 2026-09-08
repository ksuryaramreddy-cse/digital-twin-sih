import React from 'react';
import { Satellite, Radio, ShieldCheck, Wifi, Signal } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function OrbitalSatelliteTracker({ satellites = [] }) {
  return (
    <div className="tactical-panel rounded-2xl p-5 border border-cyan-500/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-polar-800 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
              Polar Orbital Satellite Constellation Tracker
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Live Overhead Spacecraft Tracking • Indian & Polar Space Assets
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-emerald-400 font-semibold">
          {satellites.length} BIRDS IN POLAR VISIBILITY
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {satellites.map((sat) => (
          <div key={sat.id} className="bg-polar-900/80 p-4 rounded-xl border border-polar-800 hover:border-cyan-500/30 transition flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-100 flex items-center space-x-1.5">
                  <Signal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{sat.name}</span>
                </span>
                <StatusBadge status={sat.status} size="sm" />
              </div>
              <span className="text-[10px] font-mono text-slate-400 block mt-1">
                {sat.type}
              </span>

              <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                <div className="bg-polar-950/80 p-2 rounded border border-polar-800">
                  <span className="text-[10px] text-slate-500 block">Elevation</span>
                  <span className="text-slate-200 font-bold">{sat.elevation}</span>
                </div>
                <div className="bg-polar-950/80 p-2 rounded border border-polar-800">
                  <span className="text-[10px] text-slate-500 block">Azimuth</span>
                  <span className="text-slate-200 font-bold">{sat.az}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-polar-800 flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Throughput: <strong className="text-emerald-400">{sat.throughput}</strong></span>
              <span className="text-slate-500">Ping: {sat.latency}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

