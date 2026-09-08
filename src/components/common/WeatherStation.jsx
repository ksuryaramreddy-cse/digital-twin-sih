import React from 'react';
import { 
  CloudSnow, 
  Wind, 
  Thermometer, 
  Gauge, 
  Sun, 
  Eye, 
  Compass, 
  Droplets,
  AlertTriangle
} from 'lucide-react';

export default function WeatherStation({ weather, stationName }) {
  if (!weather) return null;

  return (
    <div className="tactical-panel rounded-xl p-5 border border-cyan-500/20">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-polar-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
            <CloudSnow className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
              Automatic Weather Station (AWS)
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Surface Meteorology • {stationName || 'Polar Node'}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-medium">
          {weather.condition}
        </span>
      </div>

      {/* Main Temperature & Wind Highlight */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Surface Temp */}
        <div className="bg-polar-900/80 rounded-lg p-3.5 border border-polar-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 block">SURFACE TEMP</span>
            <span className="text-2xl font-mono font-extrabold text-cyan-400">
              {weather.temperature} <span className="text-sm font-normal text-slate-400">°C</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              Feels like: <span className="text-sky-300 font-semibold">{weather.feelsLike}°C</span>
            </span>
          </div>
          <Thermometer className="w-6 h-6 text-cyan-400 opacity-80" />
        </div>

        {/* Katabatic Wind Velocity */}
        <div className="bg-polar-900/80 rounded-lg p-3.5 border border-polar-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 block">WIND VELOCITY</span>
            <span className="text-2xl font-mono font-extrabold text-sky-400">
              {weather.windSpeed} <span className="text-sm font-normal text-slate-400">km/h</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              Gusts: <span className="text-amber-400 font-semibold">{weather.windGust} km/h</span>
            </span>
          </div>
          <Wind className="w-6 h-6 text-sky-400 opacity-80" />
        </div>

        {/* Barometric Pressure */}
        <div className="bg-polar-900/80 rounded-lg p-3.5 border border-polar-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 block">AIR PRESSURE</span>
            <span className="text-2xl font-mono font-extrabold text-emerald-400">
              {weather.pressure} <span className="text-sm font-normal text-slate-400">hPa</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              Direction: <span className="text-slate-200 font-semibold">{weather.windDirection}</span>
            </span>
          </div>
          <Gauge className="w-6 h-6 text-emerald-400 opacity-80" />
        </div>

        {/* Solar Radiation / Daylight */}
        <div className="bg-polar-900/80 rounded-lg p-3.5 border border-polar-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono text-slate-400 block">SOLAR FLUX</span>
            <span className="text-2xl font-mono font-extrabold text-amber-400">
              {weather.solarRadiation} <span className="text-sm font-normal text-slate-400">W/m²</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
              UV Index: <span className="text-slate-200 font-semibold">{weather.uvIndex}</span>
            </span>
          </div>
          <Sun className="w-6 h-6 text-amber-400 opacity-80" />
        </div>
      </div>

      {/* Bottom Meteorological Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-polar-800/80 text-xs font-mono">
        <div className="flex items-center space-x-2 text-slate-400">
          <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          <span>Humidity: <span className="text-slate-200 font-semibold">{weather.humidity}%</span></span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <Eye className="w-3.5 h-3.5 text-emerald-400" />
          <span>Visibility: <span className="text-slate-200 font-semibold">{weather.visibility} km</span></span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <CloudSnow className="w-3.5 h-3.5 text-sky-400" />
          <span>Snow Accum (24h): <span className="text-slate-200 font-semibold">{weather.snowAccumulation24h} cm</span></span>
        </div>
        <div className="flex items-center space-x-2 text-slate-400">
          <Compass className="w-3.5 h-3.5 text-amber-400" />
          <span>Vector: <span className="text-slate-200 font-semibold">{weather.windDirection}</span></span>
        </div>
      </div>
    </div>
  );
}

