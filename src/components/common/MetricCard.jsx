import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function MetricCard({
  title,
  value,
  unit = "",
  sublabel,
  icon: Icon,
  trend, // "up", "down", "neutral"
  trendValue,
  color = "cyan", // "cyan", "sky", "emerald", "amber", "rose"
  progress, // number 0-100 optional
  statusText
}) {
  const colorMap = {
    cyan: {
      border: "border-cyan-500/20 hover:border-cyan-500/50",
      text: "text-cyan-400",
      bgIcon: "bg-cyan-950/60 text-cyan-400 border-cyan-500/30",
      progressBg: "bg-cyan-500"
    },
    sky: {
      border: "border-sky-500/20 hover:border-sky-500/50",
      text: "text-sky-400",
      bgIcon: "bg-sky-950/60 text-sky-400 border-sky-500/30",
      progressBg: "bg-sky-500"
    },
    emerald: {
      border: "border-emerald-500/20 hover:border-emerald-500/50",
      text: "text-emerald-400",
      bgIcon: "bg-emerald-950/60 text-emerald-400 border-emerald-500/30",
      progressBg: "bg-emerald-500"
    },
    amber: {
      border: "border-amber-500/20 hover:border-amber-500/50",
      text: "text-amber-400",
      bgIcon: "bg-amber-950/60 text-amber-400 border-amber-500/30",
      progressBg: "bg-amber-500"
    },
    rose: {
      border: "border-rose-500/20 hover:border-rose-500/50",
      text: "text-rose-400",
      bgIcon: "bg-rose-950/60 text-rose-400 border-rose-500/30",
      progressBg: "bg-rose-500"
    }
  };

  const scheme = colorMap[color] || colorMap.cyan;

  return (
    <div className={`tactical-panel rounded-xl p-4 transition-all duration-200 ${scheme.border}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-mono uppercase tracking-wider text-slate-400">{title}</p>
          <div className="flex items-baseline space-x-1.5">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${scheme.text}`}>
              {value}
            </span>
            {unit && <span className="text-xs font-mono text-slate-400 font-semibold">{unit}</span>}
          </div>
        </div>

        {Icon && (
          <div className={`p-2.5 rounded-lg border ${scheme.bgIcon}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Progress Bar (Optional) */}
      {typeof progress === 'number' && (
        <div className="mt-3">
          <div className="w-full bg-polar-900 rounded-full h-1.5 overflow-hidden border border-polar-750">
            <div 
              className={`h-full ${scheme.progressBg} transition-all duration-500 rounded-full`} 
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
            <span>Capacity / Utilization</span>
            <span className="text-slate-200 font-semibold">{progress}%</span>
          </div>
        </div>
      )}

      {/* Trend and Sublabel */}
      {(sublabel || trend || statusText) && (
        <div className="mt-3 pt-2.5 border-t border-polar-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="truncate mr-2">{sublabel}</span>
          
          {trend && (
            <div className="flex items-center space-x-1 font-semibold flex-shrink-0">
              {trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
              {trend === 'down' && <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />}
              {trend === 'neutral' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
              <span className={trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400'}>
                {trendValue}
              </span>
            </div>
          )}

          {statusText && !trend && (
            <span className="text-cyan-300 text-[11px] font-semibold">{statusText}</span>
          )}
        </div>
      )}
    </div>
  );
}

