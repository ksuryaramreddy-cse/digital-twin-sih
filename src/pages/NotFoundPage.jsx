import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="tactical-panel rounded-2xl p-8 max-w-md w-full text-center border border-cyan-500/30 space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-mono font-bold text-white uppercase tracking-wider">
          Polar Coordinate 404
        </h2>
        <p className="text-xs font-mono text-slate-400">
          The requested station telemetry endpoint or coordinate does not exist on the Antarctic Digital Twin grid.
        </p>

        <div className="pt-2 flex flex-col space-y-2">
          <NavLink
            to="/digital-twin"
            className="w-full py-2.5 px-4 rounded bg-cyan-500 hover:bg-cyan-400 text-polar-950 font-mono font-bold text-xs flex items-center justify-center space-x-2 transition"
          >
            <Compass className="w-4 h-4" />
            <span>Return to Antarctic Digital Twin</span>
          </NavLink>
          <NavLink
            to="/maitri"
            className="w-full py-2 px-4 rounded bg-polar-900 hover:bg-polar-850 text-cyan-300 border border-cyan-500/30 font-mono text-xs transition"
          >
            Go to Maitri Station Dashboard
          </NavLink>
          <NavLink
            to="/bharati"
            className="w-full py-2 px-4 rounded bg-polar-900 hover:bg-polar-850 text-sky-300 border border-sky-500/30 font-mono text-xs transition"
          >
            Go to Bharati Station Dashboard
          </NavLink>
        </div>
      </div>
    </div>
  );
}

