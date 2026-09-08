import React from 'react';
import { 
  Cpu, 
  Flame, 
  Zap, 
  Radio, 
  Wrench, 
  Activity, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  Thermometer
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function EquipmentSection({ equipment = [] }) {
  const getIcon = (id) => {
    switch (id) {
      case 'EQ-GEN':
        return <Cpu className="w-5 h-5 text-amber-400" />;
      case 'EQ-HEAT':
        return <Flame className="w-5 h-5 text-rose-400" />;
      case 'EQ-POWER':
        return <Zap className="w-5 h-5 text-cyan-400" />;
      case 'EQ-COMM':
        return <Radio className="w-5 h-5 text-emerald-400" />;
      default:
        return <Wrench className="w-5 h-5 text-sky-400" />;
    }
  };

  const getBorderTheme = (id) => {
    switch (id) {
      case 'EQ-GEN':
        return "border-amber-500/30 hover:border-amber-500/60";
      case 'EQ-HEAT':
        return "border-rose-500/30 hover:border-rose-500/60";
      case 'EQ-POWER':
        return "border-cyan-500/30 hover:border-cyan-500/60";
      case 'EQ-COMM':
        return "border-emerald-500/30 hover:border-emerald-500/60";
      default:
        return "border-polar-750 hover:border-cyan-500/50";
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-polar-800 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-sky-950/70 border border-sky-500/30 text-sky-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-base sm:text-lg text-white uppercase tracking-wider">
              Core Equipment Status
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Generator • Heating System • Power System • Communication System
            </p>
          </div>
        </div>

        <span className="text-xs font-mono text-emerald-400 font-semibold flex items-center space-x-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>4/4 SYSTEMS ONLINE & NOMINAL</span>
        </span>
      </div>

      {/* 4 Core Equipment Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {equipment.map((eq) => (
          <div
            key={eq.id}
            className={`tactical-panel rounded-xl p-5 border transition-all duration-200 flex flex-col justify-between ${getBorderTheme(eq.id)}`}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-polar-800">
                <div className="flex items-center space-x-2.5">
                  <div className="p-2 rounded-lg bg-polar-900 border border-polar-750">
                    {getIcon(eq.id)}
                  </div>
                  <div>
                    <h3 className="font-mono font-bold text-xs sm:text-sm text-slate-100 uppercase">
                      {eq.name}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-400 block">
                      {eq.category}
                    </span>
                  </div>
                </div>
                <StatusBadge status={eq.status} size="sm" />
              </div>

              {/* Equipment Metrics */}
              <div className="mt-3.5 space-y-2 text-xs font-mono">
                <div className="bg-polar-900/80 p-2 rounded border border-polar-800 flex justify-between items-center">
                  <span className="text-slate-400 text-[11px]">Active Unit:</span>
                  <span className="font-bold text-slate-200 text-[11px] truncate max-w-[140px]">{eq.primaryUnit}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-polar-900/80 p-2 rounded border border-polar-800">
                    <span className="text-slate-400 text-[10px] block uppercase">Health</span>
                    <span className="font-bold text-emerald-400">{eq.operationalHealth}%</span>
                  </div>
                  <div className="bg-polar-900/80 p-2 rounded border border-polar-800">
                    <span className="text-slate-400 text-[10px] block uppercase">Temp</span>
                    <span className="font-bold text-slate-200">+{eq.temperatureC}°C</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 pt-1 leading-relaxed">
                  {eq.details}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-2.5 border-t border-polar-800 flex justify-between items-center text-[10px] font-mono text-slate-400">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Runtime: {eq.runtimeHours}h</span>
              </span>
              <span className="text-slate-400">Next Maint: <strong className="text-slate-200">{eq.nextMaintenance}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

