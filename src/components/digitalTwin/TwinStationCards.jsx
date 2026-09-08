import React from 'react';
import { 
  Thermometer, 
  Wind, 
  Battery, 
  Fuel, 
  Droplets, 
  CloudSun,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

export default function TwinStationCards({ maitri, bharati }) {
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'NORMAL':
        return 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30';
      case 'WARNING':
        return 'text-amber-400 bg-amber-950/50 border-amber-500/30';
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-950/50 border-rose-500/30';
      default:
        return 'text-cyan-400 bg-cyan-950/50 border-cyan-500/30';
    }
  };

  const stations = [
    {
      id: 'maitri',
      title: 'Maitri Station',
      data: maitri,
      route: '/maitri',
      borderColor: 'border-cyan-500/20 hover:border-cyan-500/40',
      accentColor: 'text-cyan-400',
      bgGlow: 'from-cyan-950/20 to-transparent'
    },
    {
      id: 'bharati',
      title: 'Bharati Station',
      data: bharati,
      route: '/bharati',
      borderColor: 'border-sky-500/20 hover:border-sky-500/40',
      accentColor: 'text-sky-400',
      bgGlow: 'from-sky-950/20 to-transparent'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      {stations.map(({ id, title, data, route, borderColor, accentColor, bgGlow }) => {
        // Wind speed conversion from km/h to m/s
        const windMs = data?.windSpeed ? (data.windSpeed / 3.6).toFixed(1) : '0.0';
        const weatherCondition = data?.environment?.weatherCondition || 'Nominal';

        return (
          <div 
            key={id} 
            className={`tactical-panel rounded-2xl p-6 border bg-gradient-to-br ${bgGlow} ${borderColor} transition-all duration-300 shadow-xl flex flex-col justify-between`}
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-polar-800 mb-5">
                <div>
                  <h3 className="text-xl font-mono font-bold text-white uppercase tracking-wider">{title}</h3>
                  <p className="text-xs text-slate-400 font-mono">Live Antarctic Telemetry</p>
                </div>
                <div className={`px-3 py-1 rounded-lg border font-mono text-xs font-bold ${getStatusColor(data?.status)}`}>
                  {data?.status || 'NORMAL'}
                </div>
              </div>

              {/* Telemetry List */}
              <div className="space-y-4 font-mono text-sm">
                {/* Temperature */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-polar-900/50 border border-polar-800 hover:bg-polar-900 transition">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <Thermometer className="w-5 h-5 text-cyan-400" />
                    <span>Temperature</span>
                  </div>
                  <span className="text-base font-bold text-white">{data?.temperature}°C</span>
                </div>

                {/* Wind Speed */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-polar-900/50 border border-polar-800 hover:bg-polar-900 transition">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <Wind className="w-5 h-5 text-sky-400" />
                    <span>Wind Speed</span>
                  </div>
                  <span className="text-base font-bold text-white">{windMs} m/s</span>
                </div>

                {/* Battery */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-polar-900/50 border border-polar-800 hover:bg-polar-900 transition">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <Battery className="w-5 h-5 text-emerald-400" />
                    <span>Battery</span>
                  </div>
                  <span className="text-base font-bold text-white">{data?.battery}%</span>
                </div>

                {/* Fuel */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-polar-900/50 border border-polar-800 hover:bg-polar-900 transition">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <Fuel className="w-5 h-5 text-amber-400" />
                    <span>Fuel</span>
                  </div>
                  <span className="text-base font-bold text-white">{data?.fuel}%</span>
                </div>

                {/* Water */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-polar-900/50 border border-polar-800 hover:bg-polar-900 transition">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <Droplets className="w-5 h-5 text-blue-400" />
                    <span>Water</span>
                  </div>
                  <span className="text-base font-bold text-white">{data?.water}%</span>
                </div>

                {/* Weather */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-polar-900/50 border border-polar-800 hover:bg-polar-900 transition">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <CloudSun className="w-5 h-5 text-purple-400" />
                    <span>Weather</span>
                  </div>
                  <span className="text-sm font-bold text-white text-right max-w-[200px] truncate">{weatherCondition}</span>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-polar-900/50 border border-polar-800 hover:bg-polar-900 transition">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <Activity className="w-5 h-5 text-pink-400" />
                    <span>Operational Status</span>
                  </div>
                  <span className={`text-sm font-black px-2 py-0.5 rounded ${
                    data?.status === 'CRITICAL' ? 'text-rose-400 bg-rose-950/40' :
                    data?.status === 'WARNING' ? 'text-amber-400 bg-amber-950/40' :
                    'text-emerald-400 bg-emerald-950/40'
                  }`}>{data?.status || 'NORMAL'}</span>
                </div>
              </div>
            </div>

            {/* Dashboard Link */}
            <div className="mt-6 pt-4 border-t border-polar-800/60">
              <NavLink
                to={route}
                className="w-full py-2.5 px-4 rounded-xl font-mono font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md bg-polar-900 hover:bg-polar-850 border border-polar-750 text-slate-200"
              >
                <span>Open {title} Dashboard</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </NavLink>
            </div>
          </div>
        );
      })}
    </div>
  );
}
