import React from 'react';
import { 
  Flame, 
  Wind, 
  ZapOff, 
  RotateCcw, 
  Radio, 
  Activity, 
  AlertTriangle,
  Play,
  Fuel
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { SIMULATION_SCENARIOS } from '../../services/simulationService';

export default function TwinSimulationControl({ 
  scenarios = SIMULATION_SCENARIOS, 
  activeScenarioKey = "NOMINAL", 
  onSelectScenario,
  onReset
}) {
  const currentScenario = scenarios[activeScenarioKey] || scenarios.NOMINAL;

  const scenarioButtons = [
    {
      key: "NOMINAL",
      label: "Nominal Operations",
      icon: Activity,
      theme: "border-emerald-500/40 text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60"
    },
    {
      key: "KATABATIC_BLIZZARD",
      label: "Katabatic Blizzard (Cat 4)",
      icon: Wind,
      theme: "border-sky-500/40 text-sky-400 bg-sky-950/40 hover:bg-sky-900/60"
    },
    {
      key: "SOLAR_RADIO_BLACKOUT",
      label: "Solar Storm (X2.4 Flare)",
      icon: Radio,
      theme: "border-amber-500/40 text-amber-400 bg-amber-950/40 hover:bg-amber-900/60"
    },
    {
      key: "GEN_LOAD_SHED",
      label: "Maitri Gen-1 Trip / Shed",
      icon: ZapOff,
      theme: "border-rose-500/40 text-rose-400 bg-rose-950/40 hover:bg-rose-900/60"
    },
    {
      key: "FUEL_EMERGENCY",
      label: "Bharati Fuel Emergency",
      icon: Fuel,
      theme: "border-rose-500/40 text-rose-400 bg-rose-950/40 hover:bg-rose-900/60"
    }
  ];

  return (
    <div className="tactical-panel rounded-2xl p-5 border border-cyan-500/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-polar-800 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-500/40 text-amber-400">
            <Play className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
                Digital Twin Polar Scenario Simulator
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                WHAT-IF ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Stress-test both stations under simulated polar storms, grid faults, and geomagnetic blackout
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {onReset && (
            <button
              onClick={onReset}
              className="px-2.5 py-1 text-xs font-mono rounded bg-polar-900 hover:bg-polar-800 text-slate-300 border border-polar-750 flex items-center space-x-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Nominal</span>
            </button>
          )}
          <StatusBadge 
            status={currentScenario.systemAlertLevel === 'RED' ? 'ALERT' : currentScenario.systemAlertLevel === 'AMBER' ? 'WARNING' : 'NORMAL'} 
            size="sm" 
          />
        </div>
      </div>

      {/* Scenario Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        {scenarioButtons.map((btn) => {
          const Icon = btn.icon;
          const isSelected = activeScenarioKey === btn.key;
          return (
            <button
              key={btn.key}
              onClick={() => onSelectScenario(btn.key)}
              className={`p-3 rounded-lg border text-left font-mono transition flex items-center space-x-3 ${
                isSelected
                  ? "bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400"
                  : "bg-polar-900/70 border-polar-750 text-slate-400 hover:text-slate-200 hover:border-polar-600"
              }`}
            >
              <div className={`p-2 rounded border ${btn.theme}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold block truncate">{btn.label}</span>
                <span className="text-[10px] text-slate-500">Trigger State</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Scenario Details Box */}
      <div className="bg-polar-950/80 p-4 rounded-xl border border-polar-800 font-mono text-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">ACTIVE PROFILE:</span>
            <span className="text-cyan-400 font-bold">{currentScenario.name}</span>
          </div>
          <span className="text-slate-500 text-[11px]">Real-time Twin Parameters Injected</span>
        </div>
        <p className="text-slate-300 text-xs">
          {currentScenario.description}
        </p>

        {/* Station Modification Alerts */}
        {(currentScenario.maitriMod?.alert || currentScenario.bharatiMod?.alert) && (
          <div className="pt-2 mt-2 border-t border-polar-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {currentScenario.maitriMod?.alert && (
              <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <span><strong>Maitri:</strong> {currentScenario.maitriMod.alert}</span>
              </div>
            )}
            {currentScenario.bharatiMod?.alert && (
              <div className="p-2 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <span><strong>Bharati:</strong> {currentScenario.bharatiMod.alert}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
