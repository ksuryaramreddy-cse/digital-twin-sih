import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  MapPin, 
  Radio, 
  Zap, 
  Wind, 
  Thermometer, 
  Maximize2, 
  Layers, 
  Compass, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function AntarcticMapViewer({ 
  stations = [], 
  activeScenario, 
  onSelectStation 
}) {
  const [selectedStationId, setSelectedStationId] = useState('maitri');
  const [showOverlays, setShowOverlays] = useState({
    commsMesh: true,
    weatherIsobars: true,
    satellites: true
  });

  const activeStation = stations.find(s => s.id === selectedStationId) || stations[0];

  return (
    <div className="tactical-panel rounded-2xl p-5 border border-cyan-500/30 overflow-hidden">
      {/* Map Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-polar-800 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
                Antarctic Tactical Twin Map & Radar
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                POLAR STEREOGRAPHIC 70°S-90°S
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Live Station Coordinates • 3,000 km Inter-Station Comms Link • Real-time Radar Scan
            </p>
          </div>
        </div>

        {/* Tactical Layer Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <button
            onClick={() => setShowOverlays(prev => ({ ...prev, commsMesh: !prev.commsMesh }))}
            className={`px-2.5 py-1 rounded border transition ${
              showOverlays.commsMesh 
                ? "bg-cyan-950/80 border-cyan-500/50 text-cyan-300" 
                : "bg-polar-900 border-polar-800 text-slate-400"
            }`}
          >
            Mesh Link
          </button>
          <button
            onClick={() => setShowOverlays(prev => ({ ...prev, weatherIsobars: !prev.weatherIsobars }))}
            className={`px-2.5 py-1 rounded border transition ${
              showOverlays.weatherIsobars 
                ? "bg-sky-950/80 border-sky-500/50 text-sky-300" 
                : "bg-polar-900 border-polar-800 text-slate-400"
            }`}
          >
            Isobars
          </button>
          <button
            onClick={() => setShowOverlays(prev => ({ ...prev, satellites: !prev.satellites }))}
            className={`px-2.5 py-1 rounded border transition ${
              showOverlays.satellites 
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300" 
                : "bg-polar-900 border-polar-800 text-slate-400"
            }`}
          >
            Satellites
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive Tactical Map (8 Cols on Desktop) */}
        <div className="lg:col-span-8 relative bg-polar-950 rounded-xl border border-polar-800 overflow-hidden aspect-[4/3] flex items-center justify-center p-2">
          {/* Background Radar Grid */}
          <div className="absolute inset-0 radar-grid opacity-60 pointer-events-none"></div>

          {/* Radar Sweep Effect */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[85%] h-[85%] rounded-full border border-cyan-500/20 relative overflow-hidden">
              <div 
                className="absolute inset-0 origin-center animate-radar-sweep pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, rgba(0, 243, 255, 0.18) 0deg, rgba(0, 243, 255, 0.0) 60deg, transparent 60deg)'
                }}
              ></div>
            </div>
          </div>

          {/* Tactical Map SVG (Detailed Antarctic Coastline & Coordinates) */}
          <svg viewBox="0 0 800 600" className="w-full h-full relative z-10 select-none">
            <defs>
              {/* Glow filter for station pins */}
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-sky" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              {/* Radial gradient for continent ice cap */}
              <radialGradient id="iceCapGrad" cx="50%" cy="57%" r="48%">
                <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#0f224a" stopOpacity="0.3" />
                <stop offset="90%" stopColor="#07132e" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#020617" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Latitude / Polar Circles */}
            <circle cx="400" cy="340" r="260" fill="none" stroke="#172554" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="400" cy="340" r="180" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="400" cy="340" r="100" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="2 2" />
            
            {/* Coordinate Crosshairs */}
            <line x1="400" y1="50" x2="400" y2="580" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="100" y1="340" x2="700" y2="340" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

            {/* Polar Latitude Labels */}
            <text x="408" y="100" fill="#475569" fontSize="10" fontFamily="monospace">70° S</text>
            <text x="408" y="175" fill="#475569" fontSize="10" fontFamily="monospace">80° S</text>
            <text x="408" y="335" fill="#64748b" fontSize="10" fontFamily="monospace">90° S (South Pole)</text>
            <text x="705" y="344" fill="#475569" fontSize="10" fontFamily="monospace">90° E</text>
            <text x="50" y="344" fill="#475569" fontSize="10" fontFamily="monospace">90° W</text>
            <text x="390" y="40" fill="#475569" fontSize="10" fontFamily="monospace">0° (Prime Meridian)</text>

            {/* Stylized Antarctic Continent Outline (Polar Stereographic Projection) */}
            <path
              d="M 310,195 
                 C 340,185 390,190 440,210 
                 C 490,225 540,240 585,255 
                 C 630,270 660,310 650,360 
                 C 640,410 600,450 560,480 
                 C 510,510 460,520 400,525 
                 C 330,530 270,500 230,460 
                 C 190,420 165,370 175,320 
                 C 185,270 210,230 250,210 
                 C 275,198 295,200 310,195 Z"
              fill="url(#iceCapGrad)"
              stroke="#38bdf8"
              strokeWidth="1.8"
              strokeOpacity="0.6"
            />

            {/* Antarctic Peninsula projection */}
            <path
              d="M 250,210 C 230,170 210,130 195,95 C 190,105 205,140 220,180 Z"
              fill="#1e3a8a"
              fillOpacity="0.3"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeOpacity="0.5"
            />

            {/* Ross & Weddell Ice Shelf Boundaries */}
            <path
              d="M 230,460 C 280,480 340,480 380,465 C 330,440 270,440 230,460 Z"
              fill="#0284c7"
              fillOpacity="0.1"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeDasharray="2 2"
              strokeOpacity="0.4"
            />

            {/* Weather Isobar Fronts (Optional Overlay) */}
            {showOverlays.weatherIsobars && (
              <g opacity="0.35">
                <path d="M 250,150 Q 380,120 550,190" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 4" />
                <path d="M 200,240 Q 360,260 620,290" fill="none" stroke="#00f3ff" strokeWidth="1.5" strokeDasharray="8 4" />
                <text x="560" y="185" fill="#38bdf8" fontSize="9" fontFamily="monospace">984 hPa Low</text>
              </g>
            )}

            {/* Inter-Station Comms Link (Maitri 310,215 <-> Bharati 580,260) */}
            {showOverlays.commsMesh && (
              <g>
                <line
                  x1="310"
                  y1="215"
                  x2="580"
                  y2="260"
                  stroke="#00f3ff"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  opacity="0.8"
                />
                {/* Moving Signal Packet on Comms Link */}
                <circle r="3.5" fill="#ffffff">
                  <animateMotion
                    path="M 310,215 L 580,260"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle r="3.5" fill="#00f3ff">
                  <animateMotion
                    path="M 580,260 L 310,215"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                <text x="420" y="225" fill="#00f3ff" fontSize="10" fontFamily="monospace" textAnchor="middle">
                  GSAT-30 INTER-STATION MESH (~3,000 km)
                </text>
              </g>
            )}

            {/* South Pole Reference Marker (400, 340) */}
            <g transform="translate(400, 340)">
              <circle r="4" fill="#64748b" />
              <circle r="8" fill="none" stroke="#64748b" strokeWidth="1" opacity="0.6" />
              <text x="12" y="4" fill="#94a3b8" fontSize="10" fontFamily="monospace">South Pole (90°S)</text>
            </g>

            {/* MAITRI STATION PIN (Map Coordinates: 310, 215) */}
            <g
              transform="translate(310, 215)"
              className="cursor-pointer group"
              onClick={() => {
                setSelectedStationId('maitri');
                if (onSelectStation) onSelectStation('maitri');
              }}
            >
              {/* Radar Pulsing Circle */}
              <circle r="16" fill="#00f3ff" opacity="0.15">
                <animate attributeName="r" values="8;24;8" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
              </circle>
              {/* Pin Center */}
              <circle
                r="7"
                fill="#00f3ff"
                stroke="#ffffff"
                strokeWidth="2"
                filter="url(#glow-cyan)"
              />
              <circle r="2.5" fill="#070d1e" />

              {/* Station Label */}
              <rect x="-65" y="-38" width="130" height="24" rx="4" fill="#070d1e" stroke="#00f3ff" strokeWidth="1.2" opacity="0.95" />
              <text x="0" y="-22" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                MAITRI (70°45′S)
              </text>
            </g>

            {/* BHARATI STATION PIN (Map Coordinates: 580, 260) */}
            <g
              transform="translate(580, 260)"
              className="cursor-pointer group"
              onClick={() => {
                setSelectedStationId('bharati');
                if (onSelectStation) onSelectStation('bharati');
              }}
            >
              {/* Radar Pulsing Circle */}
              <circle r="16" fill="#38bdf8" opacity="0.15">
                <animate attributeName="r" values="8;24;8" dur="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite" />
              </circle>
              {/* Pin Center */}
              <circle
                r="7"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="2"
                filter="url(#glow-sky)"
              />
              <circle r="2.5" fill="#070d1e" />

              {/* Station Label */}
              <rect x="-65" y="-38" width="130" height="24" rx="4" fill="#070d1e" stroke="#38bdf8" strokeWidth="1.2" opacity="0.95" />
              <text x="0" y="-22" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                BHARATI (69°24′S)
              </text>
            </g>

            {/* Satellites Orbit Path (Optional Overlay) */}
            {showOverlays.satellites && (
              <g>
                <ellipse cx="400" cy="300" rx="360" ry="140" fill="none" stroke="#10e796" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" transform="rotate(-20 400 300)" />
                <g transform="translate(680, 210)">
                  <polygon points="0,-4 4,4 -4,4" fill="#10e796" />
                  <text x="8" y="2" fill="#10e796" fontSize="9" fontFamily="monospace">GSAT-30 (ISRO)</text>
                </g>
              </g>
            )}
          </svg>

          {/* Bottom Map Info Footer */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] font-mono bg-polar-950/80 backdrop-blur px-3 py-1.5 rounded border border-polar-800 text-slate-400">
            <span>Grid: <strong className="text-slate-200">WGS84 Polar Stereographic</strong></span>
            <span className="text-cyan-400">Click station marker to inspect twin telemetry</span>
          </div>
        </div>

        {/* Selected Station Live Inspection Card (4 Cols on Desktop) */}
        <div className="lg:col-span-4 flex flex-col justify-between tactical-panel-cyan rounded-xl p-4 border border-cyan-500/40">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-polar-750">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase block">
                  Selected Digital Node
                </span>
                <h4 className="font-mono font-bold text-lg text-white">
                  {activeStation.name}
                </h4>
              </div>
              <StatusBadge status={activeStation.status} size="sm" />
            </div>

            <div className="mt-3 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-polar-800">
                <span className="text-slate-400">Station Code:</span>
                <span className="text-slate-200 font-bold">{activeStation.tag}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-polar-800">
                <span className="text-slate-400">Region:</span>
                <span className="text-cyan-300">{activeStation.region}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-polar-800">
                <span className="text-slate-400">Coordinates:</span>
                <span className="text-slate-200">{activeStation.coordinates?.lat}, {activeStation.coordinates?.long}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-polar-800">
                <span className="text-slate-400">Architecture:</span>
                <span className="text-slate-300">{activeStation.type}</span>
              </div>
            </div>

            {/* Quick Live Telemetry Readings */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
              <div className="bg-polar-900/90 p-2.5 rounded border border-polar-800">
                <span className="text-[10px] text-slate-400 block uppercase">Temperature</span>
                <span className="text-base font-bold text-cyan-400">{activeStation.temp} °C</span>
              </div>
              <div className="bg-polar-900/90 p-2.5 rounded border border-polar-800">
                <span className="text-[10px] text-slate-400 block uppercase">Wind Speed</span>
                <span className="text-base font-bold text-sky-400">{activeStation.windSpeed} km/h</span>
              </div>
              <div className="bg-polar-900/90 p-2.5 rounded border border-polar-800">
                <span className="text-[10px] text-slate-400 block uppercase">Power Output</span>
                <span className="text-base font-bold text-amber-400">{activeStation.powerKW} kW</span>
              </div>
              <div className="bg-polar-900/90 p-2.5 rounded border border-polar-800">
                <span className="text-[10px] text-slate-400 block uppercase">Twin Health</span>
                <span className="text-base font-bold text-emerald-400">{activeStation.health}%</span>
              </div>
            </div>
          </div>

          {/* Direct Link to Dedicated Station Page */}
          <div className="mt-4 pt-3 border-t border-polar-750">
            {activeStation.route ? (
              <NavLink
                to={activeStation.route}
                className="w-full py-2 px-3 rounded bg-cyan-500 hover:bg-cyan-400 text-polar-950 font-mono font-bold text-xs flex items-center justify-center space-x-2 transition shadow-md shadow-cyan-500/20"
              >
                <span>Open {activeStation.name} Dashboard</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </NavLink>
            ) : (
              <div className="text-center text-[11px] font-mono text-slate-500 py-1">
                Reference Geographical Point
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

