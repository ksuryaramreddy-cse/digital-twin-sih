import React from 'react';
import { Columns, ArrowRightLeft, ShieldCheck, Zap, Thermometer, Wind, Radio, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';

export default function StationComparisonGrid({ matrix = [] }) {
  return (
    <div className="tactical-panel rounded-2xl p-5 border border-cyan-500/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-polar-800 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
              Cross-Station Digital Twin Comparative Matrix
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Direct Synchronized Telemetry Delta: Maitri (70°S Inland) vs. Bharati (69°S Coastal)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <NavLink
            to="/maitri"
            className="text-[11px] font-mono px-2.5 py-1 rounded bg-polar-900 hover:bg-cyan-950 text-cyan-300 border border-cyan-500/30 transition"
          >
            Maitri Full Page &rarr;
          </NavLink>
          <NavLink
            to="/bharati"
            className="text-[11px] font-mono px-2.5 py-1 rounded bg-polar-900 hover:bg-sky-950 text-sky-300 border border-sky-500/30 transition"
          >
            Bharati Full Page &rarr;
          </NavLink>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-polar-750 bg-polar-900/90 text-slate-300">
              <th className="py-2.5 px-4 font-bold uppercase tracking-wider">Parameter / System</th>
              <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-cyan-400">
                Maitri Station (IND-02)
              </th>
              <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-sky-400">
                Bharati Station (IND-03)
              </th>
              <th className="py-2.5 px-4 font-bold uppercase tracking-wider text-slate-400">
                Twin Variance / Correlation
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-polar-800">
            {matrix.map((row, index) => (
              <tr key={index} className="hover:bg-polar-900/50 transition">
                <td className="py-3 px-4 font-semibold text-slate-200">
                  {row.metric}
                </td>
                <td className="py-3 px-4 text-cyan-300 font-medium">
                  {row.maitri}
                </td>
                <td className="py-3 px-4 text-sky-300 font-medium">
                  {row.bharati}
                </td>
                <td className="py-3 px-4 text-slate-300">
                  <span className="inline-block px-2 py-0.5 rounded bg-polar-900 border border-polar-750 text-[11px]">
                    {row.variance}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

