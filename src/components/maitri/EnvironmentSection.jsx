import React from 'react';
import { 
  Thermometer, 
  Wind, 
  Droplets, 
  Gauge, 
  CloudSnow, 
  Sun, 
  Eye, 
  Compass,
  AlertTriangle
} from 'lucide-react';
import MetricCard from '../common/MetricCard';

export default function EnvironmentSection({ environment }) {
  if (!environment) return null;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-polar-800 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-400">
            <CloudSnow className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-base sm:text-lg text-white uppercase tracking-wider">
              Environment Telemetry
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Surface Meteorology & Atmospheric Sensors • Schirmacher Oasis AWS
            </p>
          </div>
        </div>

        {/* Current Weather Condition Badge */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono text-slate-400">Condition:</span>
          <span className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20">
            {environment.weatherCondition}
          </span>
        </div>
      </div>

      {/* 5 Core Environment Cards: Temp, Wind, Humidity, Pressure, Condition */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Temperature */}
        <MetricCard
          title="Surface Temperature"
          value={environment.temperature}
          unit="°C"
          sublabel={`Feels like: ${environment.feelsLike}°C (Wind Chill)`}
          icon={Thermometer}
          trend="down"
          trendValue="-2.1°C / 6h"
          color="cyan"
          statusText="Sub-Zero Permafrost"
        />

        {/* 2. Wind Speed */}
        <MetricCard
          title="Katabatic Wind Speed"
          value={environment.windSpeed}
          unit="km/h"
          sublabel={`Gusts: ${environment.windGust} km/h • ${environment.windDirection}`}
          icon={Wind}
          trend="up"
          trendValue="+8 km/h"
          color="sky"
          statusText="Katabatic Gale Active"
        />

        {/* 3. Humidity */}
        <MetricCard
          title="Relative Humidity"
          value={environment.humidity}
          unit="%"
          sublabel="Polar Dry Plateau Atmosphere"
          icon={Droplets}
          trend="neutral"
          trendValue="Nominal Range"
          color="emerald"
          progress={environment.humidity}
        />

        {/* 4. Atmospheric Pressure */}
        <MetricCard
          title="Barometric Pressure"
          value={environment.pressure}
          unit="hPa"
          sublabel="Stationary High Pressure Front"
          icon={Gauge}
          trend="neutral"
          trendValue="984.0 hPa"
          color="amber"
          statusText="Stable Isobar"
        />
      </div>

      {/* Meteorological Microclimate Auxiliary Strip */}
      <div className="tactical-panel rounded-xl p-4 border border-polar-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2.5 text-slate-300">
          <Sun className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Solar Flux</span>
            <span className="font-bold text-amber-300">{environment.solarRadiation} W/m² (UV {environment.uvIndex})</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 text-slate-300">
          <Eye className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Visibility</span>
            <span className="font-bold text-slate-100">{environment.visibility} km</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 text-slate-300">
          <CloudSnow className="w-4 h-4 text-sky-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Snow Accumulation (24h)</span>
            <span className="font-bold text-sky-300">+{environment.snowAccumulation24h} cm</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 text-slate-300">
          <Compass className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase">Wind Vector</span>
            <span className="font-bold text-cyan-300">{environment.windDirection}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

