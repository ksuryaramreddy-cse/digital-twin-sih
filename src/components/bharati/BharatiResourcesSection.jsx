import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Droplets, 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  Waves, 
  Flame,
  AlertCircle,
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

export default function BharatiResourcesSection({ resources, onUpdate }) {
  if (!resources) return null;

  const isFuelCritical = resources.fuelLevelPct <= 20;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-polar-800 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-500/30 text-rose-400">
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-base sm:text-lg text-white uppercase tracking-wider">
              Critical Life Support Resources
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Diesel Fuel Reserves • Seawater RO Desalination • Resource Autonomy
            </p>
          </div>
        </div>

        {/* Dynamic Warning / Critical badge for fuel */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">Resource State:</span>
          <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-rose-950/90 text-rose-300 border border-rose-500/60 shadow-sm shadow-rose-950 animate-pulse flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>FUEL WARNING (18%)</span>
          </span>
        </div>
      </div>

      {/* Critical Alert Callout Banner for 18% Fuel */}
      {isFuelCritical && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/60 font-mono text-xs shadow-lg shadow-rose-950/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-rose-300 text-sm block">
                CRITICAL RESOURCE ALERT: LOW FUEL RESERVES (18%)
              </span>
              <p className="text-rose-200/90 text-xs mt-0.5">
                Main diesel storage has dropped to 20,160 L (26 days estimated supply). Power management protocols must shed non-essential loads. Resupply tanker mission scheduled.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 text-[11px] font-bold rounded bg-rose-900/80 text-rose-200 border border-rose-400 flex-shrink-0">
            26 DAYS SUPPLY LEFT
          </span>
        </div>
      )}

      {/* 3 Core Resource Cards: Fuel, Water, Critical Resources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Fuel (Highlighted with Rose / Critical theme) */}
        <div className="flex flex-col">
          <MetricCard
            title="Fuel Storage (Jet-A1 Diesel)"
            value={resources.fuelLevelPct}
            unit="%"
            sublabel={`${resources.fuelCurrentLitres?.toLocaleString()} L / ${resources.fuelCapacityLitres?.toLocaleString()} L`}
            icon={Fuel}
            trend="down"
            trendValue={`~${resources.fuelDaysRemaining} Days Left (CRITICAL)`}
            color="rose"
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

        {/* 2. Water */}
        <div className="flex flex-col">
          <MetricCard
            title="Potable Water Storage"
            value={resources.waterLevelPct}
            unit="%"
            sublabel={`${resources.waterCurrentLitres?.toLocaleString()} L / ${resources.waterCapacityLitres?.toLocaleString()} L`}
            icon={Droplets}
            trend="up"
            trendValue={`RO: +${resources.waterDesalinationRateLPD} L/day`}
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

        {/* 3. Critical Resources Status */}
        <MetricCard
          title="Critical Resource Evaluation"
          value="WARNING"
          unit=""
          sublabel={resources.overallReserveSafetyMargin}
          icon={ShieldAlert}
          color="rose"
          statusText="Fuel Below 25% Safety Limit"
        />
      </div>

      {/* Seawater Desalination & Bioreactor Details Strip */}
      <div className="tactical-panel rounded-xl p-5 border border-sky-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-3 border-b border-polar-800 gap-2">
          <div className="flex items-center space-x-2 text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            <Waves className="w-4 h-4 text-sky-400" />
            <span>Reverse-Osmosis Seawater Desalination & Greywater System</span>
          </div>
          <span className="text-xs font-mono text-sky-300 font-medium">
            Purity TDS: <strong className="text-emerald-400">{resources.waterPurityTDS} ppm</strong> (pH {resources.waterPH})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs font-mono">
          <div className="bg-polar-900/80 p-3 rounded-lg border border-polar-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Desalination Plant Output</span>
            <div className="text-base font-bold text-sky-300">
              {resources.waterDesalinationRateLPD} L/day <span className="text-emerald-400 font-normal text-xs">(ACTIVE)</span>
            </div>
            <span className="text-[10px] text-slate-500">Prydz Bay Seawater Intake</span>
          </div>

          <div className="bg-polar-900/80 p-3 rounded-lg border border-polar-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Diesel Fuel Burn Rate</span>
            <div className="text-base font-bold text-rose-400">
              {resources.fuelBurnRateLPH} L/hour <span className="text-amber-400 font-normal text-xs">(CHP CO-GEN)</span>
            </div>
            <span className="text-[10px] text-slate-500">Dual Genset Parallel Load</span>
          </div>

          <div className="bg-polar-900/80 p-3 rounded-lg border border-polar-800 space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase">Fuel Re-Supply Status</span>
            <div className="text-base font-bold text-rose-300">
              Tanker Required <span className="text-slate-400 font-normal text-xs">(26 Days)</span>
            </div>
            <span className="text-[10px] text-slate-500">Scheduled: Summer Relief Ship</span>
          </div>
        </div>
      </div>
    </div>
  );
}

