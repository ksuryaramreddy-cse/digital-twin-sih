import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Droplet, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  Layers, 
  Flame,
  AlertCircle,
  Send
} from 'lucide-react';
import MetricCard from '../common/MetricCard';
import StatusBadge from '../common/StatusBadge';

// Inline editable field: number input + Update button
function EditableField({ label, fieldKey, currentValue, unit, min, max, onUpdate }) {
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [flash, setFlash] = useState(null); // 'ok' | 'err'

  // Keep draft in sync when live value changes (polling), but only if not actively editing
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

export default function ResourcesSection({ resources, lakeData, onUpdate }) {
  if (!resources) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-polar-800 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/30 text-emerald-400">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-base sm:text-lg text-white uppercase tracking-wider">
              Critical Life Support Resources
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Polar Diesel Reserves • Lake Priyadarshini Freshwater System • Strategic Autonomy
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">Critical Status:</span>
          <StatusBadge status={resources.criticalResourceStatus} size="sm" />
        </div>
      </div>

      {/* 3 Core Resource Cards: Fuel Level, Water Level, Critical Resource Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Fuel Level */}
        <div className="flex flex-col">
          <MetricCard
            title="Fuel Level (Jet-A1 Polar)"
            value={resources.fuelLevelPct}
            unit="%"
            sublabel={`${resources.fuelCurrentLitres?.toLocaleString()} L / ${resources.fuelCapacityLitres?.toLocaleString()} L`}
            icon={Fuel}
            trend="neutral"
            trendValue={`~${resources.fuelDaysRemaining} Days Left`}
            color="amber"
            progress={resources.fuelLevelPct}
            statusText={`Burn: ${resources.fuelBurnRateLPH} L/h`}
          />
          {onUpdate && (
            <div className="px-4 pb-3 -mt-1 bg-polar-900/60 rounded-b-xl border-x border-b border-polar-800">
              <EditableField
                label="Fuel"
                fieldKey="fuel"
                currentValue={resources.fuelLevelPct}
                unit="%"
                min={0}
                max={100}
                onUpdate={onUpdate}
              />
            </div>
          )}
        </div>

        {/* 2. Water Level */}
        <div className="flex flex-col">
          <MetricCard
            title="Fresh Water Storage Level"
            value={resources.waterLevelPct}
            unit="%"
            sublabel={`${resources.waterCurrentLitres?.toLocaleString()} L / ${resources.waterCapacityLitres?.toLocaleString()} L`}
            icon={Droplet}
            trend="up"
            trendValue={`Pump: +${resources.waterPumpFlowRateLPM} L/min`}
            color="cyan"
            progress={resources.waterLevelPct}
            statusText={`Daily Use: ${resources.waterDailyUsageLitres} L`}
          />
          {onUpdate && (
            <div className="px-4 pb-3 -mt-1 bg-polar-900/60 rounded-b-xl border-x border-b border-polar-800">
              <EditableField
                label="Water"
                fieldKey="water"
                currentValue={resources.waterLevelPct}
                unit="%"
                min={0}
                max={100}
                onUpdate={onUpdate}
              />
            </div>
          )}
        </div>

        {/* 3. Critical Resource Status */}
        <MetricCard
          title="Critical Resource Status"
          value={resources.criticalResourceStatus}
          unit=""
          sublabel={resources.overallReserveSafetyMargin}
          icon={ShieldCheck}
          color="emerald"
          statusText="All Reserves > 70% Nominal"
        />
      </div>

      {/* Detailed Reservoir & Sub-Ice Pipeline Status Banner */}
      <div className="tactical-panel rounded-xl p-5 border border-cyan-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-polar-800 gap-2">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            <Droplet className="w-4 h-4 text-cyan-400" />
            <span>Lake Priyadarshini Sub-Ice Pipeline & Water Management</span>
          </div>
          <span className="text-xs font-mono text-cyan-300 font-medium">
            Purity TDS: <strong className="text-emerald-400">{resources.waterPurityTDS} ppm</strong> (pH {resources.waterPH})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-mono">
          <div className="bg-polar-900/80 p-3 rounded-lg border border-polar-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Sub-Ice Extraction Pump</span>
            <div className="text-base font-bold text-cyan-300">
              {resources.waterPumpFlowRateLPM} L/min <span className="text-emerald-400 font-normal text-xs">(ACTIVE)</span>
            </div>
            <span className="text-[10px] text-slate-500">Surface Ice: 1.92m thick</span>
          </div>

          <div className="bg-polar-900/80 p-3 rounded-lg border border-polar-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Trace Heating Temperature</span>
            <div className="text-base font-bold text-amber-300">
              +{lakeData?.pipelineTraceHeatingTempC || 8.2}°C <span className="text-emerald-400 font-normal text-xs">(ANTI-FREEZE ON)</span>
            </div>
            <span className="text-[10px] text-slate-500">Trace line impedance nominal</span>
          </div>

          <div className="bg-polar-900/80 p-3 rounded-lg border border-polar-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Expedition Wintering Autonomy</span>
            <div className="text-base font-bold text-emerald-400">
              82 Days Reserve <span className="text-slate-400 font-normal text-xs">at current burn</span>
            </div>
            <span className="text-[10px] text-slate-500">Re-supply window: Summer 2026/27</span>
          </div>
        </div>
      </div>
    </div>
  );
}

