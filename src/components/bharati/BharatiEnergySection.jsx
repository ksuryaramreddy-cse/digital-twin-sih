import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  BatteryCharging, 
  Cpu, 
  Gauge, 
  Flame, 
  ShieldCheck, 
  Layers,
  Send
} from 'lucide-react';
import MetricCard from '../common/MetricCard';
import StatusBadge from '../common/StatusBadge';

function EditableField({ label, fieldKey, currentValue, unit, min, max, onUpdate }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(null); // 'ok' | 'err'

  useEffect(() => {
    setDraft('');
  }, [currentValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(draft);
    if (isNaN(parsed) || parsed < min || parsed > max) {
      setFlash('err');
      setTimeout(() => setFlash(null), 1500);
      return;
    }
    setSending(true);
    try {
      await onUpdate({ [fieldKey]: parsed });
      setFlash('ok');
      setDraft('');
    } catch {
      setFlash('err');
    } finally {
      setSending(false);
      setTimeout(() => setFlash(null), 1500);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5 mt-2">
      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide whitespace-nowrap">
        Set {label}:
      </span>
      <input
        type="number"
        min={min}
        max={max}
        step="0.1"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={String(currentValue)}
        className="w-20 px-2 py-0.5 rounded bg-polar-950 border border-polar-700 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/40"
      />
      <span className="text-[10px] font-mono text-slate-500">{unit}</span>
      <button
        type="submit"
        disabled={sending || draft === ''}
        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wide border transition
          ${flash === 'ok'  ? 'bg-emerald-600/30 border-emerald-500/60 text-emerald-300' :
            flash === 'err' ? 'bg-red-600/30 border-red-500/60 text-red-300' :
            'bg-cyan-600/20 border-cyan-500/40 text-cyan-300 hover:bg-cyan-600/30 disabled:opacity-40 disabled:cursor-not-allowed'}`}
      >
        <Send className="w-2.5 h-2.5" />
        {flash === 'ok' ? 'Saved' : flash === 'err' ? 'Error' : sending ? '…' : 'Update'}
      </button>
    </form>
  );
}

export default function BharatiEnergySection({ energy, onUpdate }) {
  if (!energy) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-polar-800 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-500/30 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-base sm:text-lg text-white uppercase tracking-wider">
              Energy & Cogeneration Systems (CHP)
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Volvo Penta Dual Combined Heat & Power • 500 kWh BESS • Fuel Cell Testbed
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">Generator System:</span>
          <StatusBadge status={energy.generatorStatus} size="sm" />
        </div>
      </div>

      {/* 4 Core Energy Cards: Battery, Power Consumption, Generator, Generator Load */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Battery */}
        <div className="flex flex-col">
          <MetricCard
            title="Battery Storage Level"
            value={energy.batteryLevel}
            unit="%"
            sublabel={`${energy.batteryStoredKWh} kWh (${energy.batteryRunTimeHours}h autonomy)`}
            icon={BatteryCharging}
            trend="neutral"
            trendValue="Nominal Float"
            color="emerald"
            progress={energy.batteryLevel}
          />
          {onUpdate && (
            <div className="px-4 pb-3 -mt-1 bg-polar-900/60 rounded-b-xl border-x border-b border-polar-800">
              <EditableField
                label="Battery"
                fieldKey="battery"
                currentValue={energy.batteryLevel}
                unit="%"
                min={0}
                max={100}
                onUpdate={onUpdate}
              />
            </div>
          )}
        </div>

        {/* 2. Power Consumption */}
        <MetricCard
          title="Power Consumption"
          value={energy.powerConsumptionKW}
          unit="kW"
          sublabel={`Capacity: ${energy.powerGenerationKW} kW (+${energy.chpThermalRecoveryKW} kW Heat)`}
          icon={Zap}
          trend="up"
          trendValue="+4.2 kW / 2h"
          color="amber"
          progress={energy.generatorLoadPct}
        />

        {/* 3. Generator Status */}
        <MetricCard
          title="Generator System"
          value={energy.generatorStatus}
          unit=""
          sublabel="Dual Volvo Penta CHP Active"
          icon={Cpu}
          color="sky"
          statusText="400V 50.02 Hz Synced"
        />

        {/* 4. Generator Load */}
        <MetricCard
          title="Generator Bus Load"
          value={energy.generatorLoadPct}
          unit="%"
          sublabel={`Grid: ${energy.gridVoltage}V AC • ${energy.dailyEnergyKWh} kWh/d`}
          icon={Gauge}
          trend="neutral"
          trendValue="Nominal 83%"
          color="sky"
          progress={energy.generatorLoadPct}
        />
      </div>

      {/* Detailed CHP Microgrid Genset Matrix */}
      <div className="tactical-panel rounded-xl p-5 border border-sky-500/20">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-polar-800">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Bharati Combined Heat & Power (CHP) Generation Grid</span>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold">2 RUNNING • 1 STANDBY • 1 FUEL CELL</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {energy.generators?.map((gen) => (
            <div 
              key={gen.id}
              className={`p-3.5 rounded-xl border font-mono transition ${
                gen.status === 'RUNNING'
                  ? "bg-polar-900/90 border-sky-500/40 shadow-sm shadow-sky-500/10"
                  : "bg-polar-950/60 border-polar-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-100">{gen.id}</span>
                <StatusBadge status={gen.status} size="sm" pulse={gen.status === 'RUNNING'} />
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-1">{gen.name}</p>

              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="bg-polar-950/80 p-2 rounded border border-polar-800">
                  <span className="text-[10px] text-slate-500 block">Output</span>
                  <span className={`font-bold ${gen.status === 'RUNNING' ? 'text-amber-400' : 'text-slate-400'}`}>
                    {gen.outputKW} kW ({gen.loadPct}%)
                  </span>
                </div>
                <div className="bg-polar-950/80 p-2 rounded border border-polar-800">
                  <span className="text-[10px] text-slate-500 block">Coolant Temp</span>
                  <span className="font-bold text-slate-200">
                    {gen.coolantTempC}°C
                  </span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-polar-800 flex justify-between text-[10px] text-slate-400">
                <span>Heat Rec: {gen.heatRecoveryEfficiencyPct}%</span>
                <span>Speed: {gen.rpm} RPM</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

