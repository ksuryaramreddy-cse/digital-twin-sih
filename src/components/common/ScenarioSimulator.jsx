import React, { useState, useEffect, useCallback } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  ShieldAlert,
  Battery,
  Fuel,
  Zap,
  Thermometer,
  Gauge,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  Info,
  ListOrdered,
  Flame,
  Snowflake,
} from 'lucide-react';

const LOCAL_API_BASE = import.meta.env.VITE_LOCAL_API_URL || "http://localhost:8000/api/v1";

const PRESETS = [
  {
    id: 'nominal',
    label: 'Normal Operations',
    icon: ShieldCheck,
    color: 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/30',
    description: 'Nominal operational envelope across station microgrid.',
    values: {
      temperatureDelta: 0,
      powerDemandChange: 0,
      generatorCapacityChange: 0,
      fuelConsumptionChange: 0,
      durationHours: 24,
    },
  },
  {
    id: 'cold_wave',
    label: 'Extreme Cold Wave',
    icon: Snowflake,
    color: 'text-cyan-400 border-cyan-500/30 hover:bg-cyan-950/30',
    description: '-15°C thermal drop causing +30% heating load and +20% fuel surge.',
    values: {
      temperatureDelta: -15,
      powerDemandChange: 30,
      generatorCapacityChange: 0,
      fuelConsumptionChange: 20,
      durationHours: 24,
    },
  },
  {
    id: 'generator_failure',
    label: 'Generator Failure',
    icon: Zap,
    color: 'text-amber-400 border-amber-500/30 hover:bg-amber-950/30',
    description: 'Loss of 50% primary generation capacity under sustained load.',
    values: {
      temperatureDelta: -5,
      powerDemandChange: 20,
      generatorCapacityChange: -50,
      fuelConsumptionChange: 10,
      durationHours: 24,
    },
  },
  {
    id: 'fuel_crisis',
    label: 'Fuel Crisis',
    icon: Fuel,
    color: 'text-orange-400 border-orange-500/30 hover:bg-orange-950/30',
    description: 'Resupply delay with +50% consumption over 48-hour window.',
    values: {
      temperatureDelta: 0,
      powerDemandChange: 10,
      generatorCapacityChange: 0,
      fuelConsumptionChange: 50,
      durationHours: 48,
    },
  },
  {
    id: 'combined_emergency',
    label: 'Combined Emergency',
    icon: Flame,
    color: 'text-rose-400 border-rose-500/30 hover:bg-rose-950/30',
    description: '-20°C deep freeze, -60% generator capacity, and +50% demand.',
    values: {
      temperatureDelta: -20,
      powerDemandChange: 50,
      generatorCapacityChange: -60,
      fuelConsumptionChange: 60,
      durationHours: 24,
    },
  },
];

const DURATION_OPTIONS = [6, 12, 24, 48, 72];

const RISK_BADGES = {
  LOW: {
    badge: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
    barColor: 'bg-emerald-400',
    textColor: 'text-emerald-400',
    icon: ShieldCheck,
  },
  MEDIUM: {
    badge: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
    barColor: 'bg-amber-400',
    textColor: 'text-amber-400',
    icon: AlertTriangle,
  },
  HIGH: {
    badge: 'bg-orange-950/70 border-orange-500/40 text-orange-300',
    barColor: 'bg-orange-400',
    textColor: 'text-orange-400',
    icon: AlertTriangle,
  },
  CRITICAL: {
    badge: 'bg-rose-950/80 border-rose-500/60 text-rose-300',
    barColor: 'bg-rose-400',
    textColor: 'text-rose-400',
    icon: AlertOctagon,
  },
};

const STRESS_BADGES = {
  NORMAL: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
  ELEVATED: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
  HIGH: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
  CRITICAL: 'bg-rose-950/80 border-rose-500/60 text-rose-300',
};

/**
 * ScenarioSimulator.jsx
 * =====================
 * Interactive What-If Scenario Simulation component for polar stations.
 * Connects directly to POST /api/v1/stations/{stationId}/simulate.
 *
 * Props:
 *   stationId   {string} - 'maitri' or 'bharati'
 *   stationName {string} - 'Maitri' or 'Bharati'
 */
export default function ScenarioSimulator({ stationId = 'maitri', stationName = 'Maitri' }) {
  // Scenario input parameters
  const [params, setParams] = useState({
    temperatureDelta: 0,
    powerDemandChange: 0,
    generatorCapacityChange: 0,
    fuelConsumptionChange: 0,
    durationHours: 24,
  });

  const [activePresetId, setActivePresetId] = useState('nominal');
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [error, setError] = useState(null);
  const [showAssumptions, setShowAssumptions] = useState(false);

  // Execute scenario simulation against real backend
  const runSimulation = useCallback(async (customParams = null) => {
    const payload = customParams || params;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${LOCAL_API_BASE}/stations/${stationId}/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Simulation request failed with HTTP status ${response.status}`);
      }

      const data = await response.json();
      setSimulationResult(data);
    } catch (err) {
      console.error(`[ScenarioSimulator] Simulation error for ${stationId}:`, err);
      setError(err.message || 'Failed to execute scenario simulation on backend.');
    } finally {
      setLoading(false);
    }
  }, [params, stationId]);

  // Initial simulation run on mount so baseline projections are immediately visible
  useEffect(() => {
    runSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stationId]);

  // Handle Preset Click
  const handlePresetSelect = (preset) => {
    setActivePresetId(preset.id);
    setParams({ ...preset.values });
    runSimulation(preset.values);
  };

  // Handle Slider / Input Changes
  const handleParamChange = (field, value) => {
    setActivePresetId(null); // Clear preset selection when custom values entered
    setParams((prev) => ({
      ...prev,
      [field]: Number(value),
    }));
  };

  // Handle Reset to Nominal
  const handleReset = () => {
    const nominal = PRESETS[0];
    setActivePresetId(nominal.id);
    setParams({ ...nominal.values });
    runSimulation(nominal.values);
  };

  const riskConfig = RISK_BADGES[simulationResult?.risk?.severity] || RISK_BADGES.LOW;
  const RiskIcon = riskConfig.icon;
  const stressBadge = STRESS_BADGES[simulationResult?.generator?.stressLevel] || STRESS_BADGES.NORMAL;

  return (
    <section
      aria-label={`What-If Scenario Simulator for ${stationName}`}
      className="relative rounded-2xl border border-polar-800 bg-polar-900/90 backdrop-blur-xl p-5 sm:p-6 shadow-2xl space-y-6 font-mono"
    >
      {/* ── 1. HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-polar-800 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider flex items-center gap-2">
                WHAT-IF SCENARIO SIMULATOR
              </h3>
              <p className="text-xs text-slate-400">
                {stationName} Research Station • Deterministic Microgrid & Thermal Stress Engine
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-polar-950/80 hover:bg-polar-800 border border-polar-750 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
            title="Reset parameters to Nominal"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Nominal</span>
          </button>

          <button
            type="button"
            onClick={() => runSimulation()}
            disabled={loading}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 text-xs font-bold tracking-wider uppercase transition-all duration-200 hover:shadow-[0_0_15px_rgba(0,243,255,0.25)] disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-cyan-300 text-cyan-300" />
                <span>Run Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── 2. SCENARIO PRESETS ────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          TACTICAL SCENARIO PRESETS
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                disabled={loading}
                className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.15)] ring-1 ring-cyan-400/50'
                    : `bg-polar-950/60 ${preset.color}`
                } disabled:opacity-50`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  )}
                </div>
                <div className="text-xs font-bold text-slate-100 line-clamp-1">
                  {preset.label}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {preset.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. TACTICAL INPUT CONTROLS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-polar-950/60 border border-polar-850">
        {/* 1. Temperature Delta */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-indigo-400" />
              Temperature Δ
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              params.temperatureDelta < 0 ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30' :
              params.temperatureDelta > 0 ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' :
              'bg-polar-900 text-slate-300 border border-polar-800'
            }`}>
              {params.temperatureDelta > 0 ? `+${params.temperatureDelta}` : params.temperatureDelta}°C
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="10"
            step="1"
            value={params.temperatureDelta}
            onChange={(e) => handleParamChange('temperatureDelta', e.target.value)}
            disabled={loading}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-polar-900 rounded-lg appearance-none border border-polar-800"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>-30°C (Deep Freeze)</span>
            <span>+10°C</span>
          </div>
        </div>

        {/* 2. Power Demand Change */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              Power Demand Δ
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              params.powerDemandChange > 0 ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30' :
              params.powerDemandChange < 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' :
              'bg-polar-900 text-slate-300 border border-polar-800'
            }`}>
              {params.powerDemandChange > 0 ? `+${params.powerDemandChange}` : params.powerDemandChange}%
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="100"
            step="5"
            value={params.powerDemandChange}
            onChange={(e) => handleParamChange('powerDemandChange', e.target.value)}
            disabled={loading}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-polar-900 rounded-lg appearance-none border border-polar-800"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>-50% (Shedding)</span>
            <span>+100% (Surge)</span>
          </div>
        </div>

        {/* 3. Generator Capacity Change */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-amber-400" />
              Gen Capacity Δ
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              params.generatorCapacityChange < 0 ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30' :
              params.generatorCapacityChange > 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' :
              'bg-polar-900 text-slate-300 border border-polar-800'
            }`}>
              {params.generatorCapacityChange > 0 ? `+${params.generatorCapacityChange}` : params.generatorCapacityChange}%
            </span>
          </div>
          <input
            type="range"
            min="-100"
            max="50"
            step="5"
            value={params.generatorCapacityChange}
            onChange={(e) => handleParamChange('generatorCapacityChange', e.target.value)}
            disabled={loading}
            className="w-full accent-amber-400 cursor-pointer h-1.5 bg-polar-900 rounded-lg appearance-none border border-polar-800"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>-100% (Blackout)</span>
            <span>+50% (Auxiliary)</span>
          </div>
        </div>

        {/* 4. Fuel Consumption Change */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Fuel className="w-3.5 h-3.5 text-orange-400" />
              Fuel Burn Δ
            </span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
              params.fuelConsumptionChange > 0 ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30' :
              params.fuelConsumptionChange < 0 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' :
              'bg-polar-900 text-slate-300 border border-polar-800'
            }`}>
              {params.fuelConsumptionChange > 0 ? `+${params.fuelConsumptionChange}` : params.fuelConsumptionChange}%
            </span>
          </div>
          <input
            type="range"
            min="-50"
            max="100"
            step="5"
            value={params.fuelConsumptionChange}
            onChange={(e) => handleParamChange('fuelConsumptionChange', e.target.value)}
            disabled={loading}
            className="w-full accent-orange-400 cursor-pointer h-1.5 bg-polar-900 rounded-lg appearance-none border border-polar-800"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>-50%</span>
            <span>+100% (High Burn)</span>
          </div>
        </div>
      </div>

      {/* Duration Pill Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Simulation Horizon:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {DURATION_OPTIONS.map((hrs) => (
            <button
              key={hrs}
              type="button"
              onClick={() => handleParamChange('durationHours', hrs)}
              disabled={loading}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                params.durationHours === hrs
                  ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200'
                  : 'bg-polar-950/70 border border-polar-800 text-slate-400 hover:text-slate-200'
              } disabled:opacity-50`}
            >
              {hrs} Hours
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-3">
          <AlertOctagon className="w-5 h-5 shrink-0 text-rose-400" />
          <div>
            <div className="font-bold uppercase tracking-wider">Simulation Execution Error</div>
            <div className="text-rose-200/80 mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {/* ── 4. SIMULATION RESULTS SECTION ──────────────────────────────────── */}
      {simulationResult && (
        <div className="space-y-6 pt-4 border-t border-polar-800">
          <div className="flex items-center justify-between">
            <h4 className="text-sm sm:text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>📊</span>
              SIMULATION RESULTS: BASELINE → SIMULATED IMPACT
            </h4>
            <span className="text-[11px] text-cyan-400">
              Horizon: {simulationResult.scenario?.durationHours} Hours
            </span>
          </div>

          {/* Baseline vs. Simulated Comparison Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Temperature */}
            <div className="p-4 rounded-xl bg-polar-950/60 border border-polar-850 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="uppercase font-semibold flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-indigo-400" />
                  Temperature
                </span>
                <span className={`text-[11px] font-bold ${
                  simulationResult.scenario?.temperatureDelta < 0 ? 'text-cyan-400' : 'text-slate-300'
                }`}>
                  Δ {simulationResult.scenario?.temperatureDelta > 0 ? `+${simulationResult.scenario.temperatureDelta}` : simulationResult.scenario?.temperatureDelta}°C
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div className="text-xs text-slate-400">
                  Base: <span className="text-slate-200 font-bold">{simulationResult.baseline?.temperature}°C</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <div className="text-sm font-bold text-white">
                  {simulationResult.simulated?.temperature}°C
                </div>
              </div>
            </div>

            {/* Power Demand */}
            <div className="p-4 rounded-xl bg-polar-950/60 border border-polar-850 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="uppercase font-semibold flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-sky-400" />
                  Power Demand
                </span>
                <span className={`text-[11px] font-bold ${
                  simulationResult.impact?.powerChange > 0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {simulationResult.impact?.powerChange > 0 ? `+${simulationResult.impact.powerChange}` : simulationResult.impact?.powerChange} kW
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div className="text-xs text-slate-400">
                  Base: <span className="text-slate-200 font-bold">{simulationResult.baseline?.powerConsumption} kW</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <div className="text-sm font-bold text-white">
                  {simulationResult.simulated?.powerConsumption} kW
                </div>
              </div>
            </div>

            {/* Battery Bank */}
            <div className="p-4 rounded-xl bg-polar-950/60 border border-polar-850 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="uppercase font-semibold flex items-center gap-1.5">
                  <Battery className="w-3.5 h-3.5 text-cyan-400" />
                  Battery Bank
                </span>
                <span className={`text-[11px] font-bold ${
                  simulationResult.impact?.batteryChange < 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {simulationResult.impact?.batteryChange}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div className="text-xs text-slate-400">
                  Base: <span className="text-slate-200 font-bold">{simulationResult.baseline?.battery}%</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <div className="text-sm font-bold text-white">
                  {simulationResult.simulated?.battery}%
                </div>
              </div>
            </div>

            {/* Fuel Storage & Autonomy */}
            <div className="p-4 rounded-xl bg-polar-950/60 border border-polar-850 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="uppercase font-semibold flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5 text-amber-400" />
                  Fuel Reserves
                </span>
                <span className={`text-[11px] font-bold ${
                  simulationResult.impact?.fuelChange < 0 ? 'text-rose-400' : 'text-slate-300'
                }`}>
                  {simulationResult.impact?.fuelChange}%
                </span>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div className="text-xs text-slate-400">
                  Base: <span className="text-slate-200 font-bold">{simulationResult.baseline?.fuel}%</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <div className="text-sm font-bold text-white">
                  {simulationResult.simulated?.fuel}%
                </div>
              </div>
              {simulationResult.simulated?.fuelAutonomyHours && (
                <div className="text-[10px] text-amber-300 pt-1 border-t border-polar-800/60 flex items-center justify-between">
                  <span>Est. Autonomy:</span>
                  <span className="font-bold">{simulationResult.simulated.fuelAutonomyHours}h (~{Math.round(simulationResult.simulated.fuelAutonomyHours / 24)}d)</span>
                </div>
              )}
            </div>
          </div>

          {/* ── 5. GENERATOR STRESS & OPERATIONAL RISK GRID ───────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Generator Stress Panel */}
            <div className="p-4 sm:p-5 rounded-xl bg-polar-950/70 border border-polar-800 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-polar-850">
                <div className="flex items-center space-x-2">
                  <Gauge className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    GENERATOR MICROGRID STRESS
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${stressBadge}`}>
                  {simulationResult.generator?.stressLevel} STRESS
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 rounded bg-polar-900/80 border border-polar-850">
                  <span className="text-[10px] text-slate-400 uppercase block">Baseline Cap</span>
                  <span className="text-sm font-bold text-slate-100">{simulationResult.generator?.baselineCapacity} kW</span>
                </div>
                <div className="p-2.5 rounded bg-polar-900/80 border border-polar-850">
                  <span className="text-[10px] text-slate-400 uppercase block">Available Cap</span>
                  <span className="text-sm font-bold text-white">{simulationResult.generator?.availableCapacity} kW</span>
                </div>
                <div className="p-2.5 rounded bg-polar-900/80 border border-polar-850">
                  <span className="text-[10px] text-slate-400 uppercase block">Stress Ratio</span>
                  <span className={`text-sm font-bold ${
                    simulationResult.generator?.stressRatio > 1.0 ? 'text-rose-400' :
                    simulationResult.generator?.stressRatio >= 0.85 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {simulationResult.generator?.stressRatio}
                  </span>
                </div>
              </div>

              {/* Stress Ratio Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Operating Stress Ratio:</span>
                  <span className="font-bold text-slate-200">
                    {Math.round(simulationResult.generator?.stressRatio * 100)}% of available capacity
                  </span>
                </div>
                <div className="w-full h-2 bg-polar-900 rounded-full overflow-hidden border border-polar-800">
                  <div
                    className={`h-full transition-all duration-500 ${
                      simulationResult.generator?.stressRatio > 1.0 ? 'bg-rose-500' :
                      simulationResult.generator?.stressRatio >= 0.85 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, simulationResult.generator?.stressRatio * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Operational Risk Panel */}
            <div className="p-4 sm:p-5 rounded-xl bg-polar-950/70 border border-polar-800 space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-polar-850">
                <div className="flex items-center space-x-2">
                  <RiskIcon className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    SYNTHESIZED SCENARIO RISK
                  </span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${riskConfig.badge}`}>
                  {simulationResult.risk?.severity} RISK
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex items-baseline space-x-2">
                  <span className={`text-3xl font-extrabold ${riskConfig.textColor}`}>
                    {Math.round(simulationResult.risk?.score)}
                  </span>
                  <span className="text-xs text-slate-500">/ 100</span>
                </div>

                <div className="flex-1 max-w-xs space-y-1">
                  <div className="w-full h-2.5 bg-polar-900 rounded-full overflow-hidden border border-polar-800">
                    <div
                      className={`h-full transition-all duration-500 ${riskConfig.barColor}`}
                      style={{ width: `${Math.min(100, Math.max(0, simulationResult.risk?.score))}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Risk Factors List */}
              {Array.isArray(simulationResult.risk?.factors) && simulationResult.risk.factors.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-polar-850">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">
                    Triggered Risk Drivers:
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {simulationResult.risk.factors.map((factor, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5 leading-snug">
                        <span className="text-amber-400 shrink-0">•</span>
                        <span>{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* ── 6. RECOMMENDED OPERATIONAL ACTIONS ──────────────────────────── */}
          {Array.isArray(simulationResult.recommendations) && simulationResult.recommendations.length > 0 && (
            <div className="p-4 sm:p-5 rounded-xl bg-polar-950/70 border border-polar-800 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-amber-400" />
                RECOMMENDED OPERATIONAL DIRECTIVES
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {simulationResult.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="flex items-start space-x-2.5 p-3 rounded-lg bg-polar-900/80 border border-polar-800 text-xs text-slate-200"
                  >
                    <span className="w-5 h-5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 7. SIMULATION ASSUMPTIONS & TRANSPARENCY ─────────────────────── */}
          <div className="p-3.5 rounded-xl bg-polar-950/40 border border-polar-850 space-y-2">
            <button
              type="button"
              onClick={() => setShowAssumptions(!showAssumptions)}
              className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-200 font-semibold transition-colors"
            >
              <div className="flex items-center space-x-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Simulation Modeling Assumptions & Mathematical Transparency</span>
              </div>
              {showAssumptions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAssumptions && (
              <div className="pt-2 border-t border-polar-800/60 space-y-2 text-xs text-slate-400 leading-relaxed">
                <p className="italic text-cyan-200/80">
                  Notice: This is a deterministic mathematical Digital Twin scenario simulation combining live station telemetry, current forecast trends, and defined operational assumptions.
                </p>
                {Array.isArray(simulationResult.assumptions) && (
                  <ul className="space-y-1 pl-2">
                    {simulationResult.assumptions.map((assump, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5 text-[11px] text-slate-300">
                        <span className="text-cyan-400">•</span>
                        <span>{assump}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
