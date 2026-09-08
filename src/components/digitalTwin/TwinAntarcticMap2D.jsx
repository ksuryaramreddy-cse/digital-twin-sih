import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Radio, 
  AlertTriangle, 
  Thermometer, 
  Fuel, 
  BatteryCharging, 
  ShieldAlert,
  Layers,
  Zap,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';

export default function TwinAntarcticMap2D({ maitri, bharati }) {
  const [showMesh, setShowMesh] = useState(true);
  const [showIsobars, setShowIsobars] = useState(true);

  // riskLevel from deployed API: "RED" | "AMBER" | "GREEN"
  // also handles legacy "HIGH RISK" | "MODERATE RISK" strings
  const riskPillColor = (rl) => {
    if (!rl) return '#10b981';
    const r = rl.toUpperCase();
    if (r === 'RED'   || r.includes('HIGH'))     return '#ef4444';
    if (r === 'AMBER' || r.includes('MODERATE')) return '#f59e0b';
    return '#10b981';
  };
  const riskTextColor = (rl) => {
    if (!rl) return '#34d399';
    const r = rl.toUpperCase();
    if (r === 'RED'   || r.includes('HIGH'))     return '#f87171';
    if (r === 'AMBER' || r.includes('MODERATE')) return '#fbbf24';
    return '#34d399';
  };
  return (
    <div className="tactical-panel rounded-2xl p-5 sm:p-6 border border-cyan-500/30 overflow-hidden shadow-2xl">
      {/* Map Control Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-polar-800 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-mono font-bold text-sm sm:text-base text-white uppercase tracking-wider">
                Antarctic 2D Tactical Terrain Visualizer
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                POLAR STEREOGRAPHIC GRID
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Live Spatial Placement • Maitri & Bharati Operational Twin Nodes • 3,000 km Comms Mesh
            </p>
          </div>
        </div>

        {/* Map Layer Toggles */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={() => setShowMesh(!showMesh)}
            className={`px-3 py-1.5 rounded-lg border transition ${
              showMesh
                ? "bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-sm"
                : "bg-polar-900 border-polar-800 text-slate-400"
            }`}
          >
            Tactical Mesh
          </button>
          <button
            onClick={() => setShowIsobars(!showIsobars)}
            className={`px-3 py-1.5 rounded-lg border transition ${
              showIsobars
                ? "bg-sky-950/90 border-sky-400 text-sky-300 shadow-sm"
                : "bg-polar-900 border-polar-800 text-slate-400"
            }`}
          >
            Polar Isobars
          </button>
        </div>
      </div>

      {/* Main 2D Antarctic Map Canvas & SVG (Full Width) */}
      <div className="w-full relative bg-polar-950 rounded-xl border border-polar-800 overflow-hidden aspect-[16/9] sm:aspect-[2/1] min-h-[460px] flex items-center justify-center p-2">
        {/* Background Radar Scan Grid */}
        <div className="absolute inset-0 radar-grid opacity-60 pointer-events-none"></div>

        {/* Radar Sweep Effect */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[85%] h-[85%] rounded-full border border-cyan-500/20 relative overflow-hidden">
            <div 
              className="absolute inset-0 origin-center animate-radar-sweep pointer-events-none"
              style={{
                background: 'conic-gradient(from 0deg, rgba(0, 243, 255, 0.16) 0deg, rgba(0, 243, 255, 0.0) 60deg, transparent 60deg)'
              }}
            ></div>
          </div>
        </div>

        {/* 2D Antarctic Continent SVG */}
        <svg viewBox="0 0 800 600" className="w-full h-full relative z-10 select-none">
          <defs>
            {/* Glow filter for Maitri */}
            <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Glow filter for Bharati */}
            <filter id="glow-sky" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* Radial gradient for continent ice sheet */}
            <radialGradient id="iceSheetGrad" cx="50%" cy="57%" r="48%">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#0f224a" stopOpacity="0.32" />
              <stop offset="90%" stopColor="#07132e" stopOpacity="0.18" />
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
          <text x="408" y="95" fill="#64748b" fontSize="10" fontFamily="monospace">70° S Polar Circle</text>
          <text x="408" y="175" fill="#475569" fontSize="10" fontFamily="monospace">80° S</text>
          <text x="408" y="335" fill="#94a3b8" fontSize="10" fontFamily="monospace">90° S (South Pole)</text>
          <text x="705" y="344" fill="#475569" fontSize="10" fontFamily="monospace">90° E</text>
          <text x="45" y="344" fill="#475569" fontSize="10" fontFamily="monospace">90° W</text>
          <text x="390" y="40" fill="#475569" fontSize="10" fontFamily="monospace">0° (Prime Meridian)</text>

          {/* Stylized Antarctic Continent Outline */}
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
            fill="url(#iceSheetGrad)"
            stroke="#38bdf8"
            strokeWidth="2"
            strokeOpacity="0.7"
          />

          {/* Antarctic Peninsula projection */}
          <path
            d="M 250,210 C 230,170 210,130 195,95 C 190,105 205,140 220,180 Z"
            fill="#1e3a8a"
            fillOpacity="0.35"
            stroke="#38bdf8"
            strokeWidth="1.4"
            strokeOpacity="0.6"
          />

          {/* Ross & Weddell Ice Shelves */}
          <path
            d="M 230,460 C 280,480 340,480 380,465 C 330,440 270,440 230,460 Z"
            fill="#0284c7"
            fillOpacity="0.12"
            stroke="#38bdf8"
            strokeWidth="1"
            strokeDasharray="2 2"
            strokeOpacity="0.5"
          />

          {/* Weather Isobars Layer */}
          {showIsobars && (
            <g opacity="0.35">
              <path d="M 250,150 Q 380,120 550,190" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 4" />
              <path d="M 200,240 Q 360,260 620,290" fill="none" stroke="#00f3ff" strokeWidth="1.5" strokeDasharray="8 4" />
              <text x="560" y="185" fill="#38bdf8" fontSize="9" fontFamily="monospace">984 hPa Low</text>
            </g>
          )}

          {/* Inter-Station Tactical Comms Mesh Link (3,000 km) */}
          {showMesh && (
            <g>
              <line
                x1={maitri.mapCoordinates?.x || 310}
                y1={maitri.mapCoordinates?.y || 215}
                x2={bharati.mapCoordinates?.x || 580}
                y2={bharati.mapCoordinates?.y || 260}
                stroke="#00f3ff"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                opacity="0.85"
              />
              {/* Moving Signal Pulses */}
              <circle r="4" fill="#ffffff">
                <animateMotion
                  path={`M ${maitri.mapCoordinates?.x || 310},${maitri.mapCoordinates?.y || 215} L ${bharati.mapCoordinates?.x || 580},${bharati.mapCoordinates?.y || 260}`}
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle r="4" fill="#00f3ff">
                <animateMotion
                  path={`M ${bharati.mapCoordinates?.x || 580},${bharati.mapCoordinates?.y || 260} L ${maitri.mapCoordinates?.x || 310},${maitri.mapCoordinates?.y || 215}`}
                  dur="3s"
                  repeatCount="indefinite"
                />
              </circle>
              <text x="440" y="225" fill="#00f3ff" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                TACTICAL GSAT-30 LINK (~3,000 km)
              </text>
            </g>
          )}

          {/* South Pole Reference Node (400, 340) */}
          <g transform="translate(400, 340)">
            <circle r="4" fill="#64748b" />
            <circle r="8" fill="none" stroke="#64748b" strokeWidth="1" opacity="0.6" />
            <text x="12" y="4" fill="#94a3b8" fontSize="10" fontFamily="monospace">South Pole (90°S)</text>
          </g>

          {/* ==================================================== */}
          {/* 1. MAITRI STATION PIN & TELEMETRY PILL */}
          {/* ==================================================== */}
          <g
            transform={`translate(${maitri.mapCoordinates?.x || 310}, ${maitri.mapCoordinates?.y || 215})`}
          >
            {/* Pulsing Radar Ring */}
            <circle r="18" fill="#00f3ff" opacity="0.2">
              <animate attributeName="r" values="10;26;10" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
            </circle>
            {/* Pin Center */}
            <circle
              r="8"
              fill="#00f3ff"
              stroke="#ffffff"
              strokeWidth="2.5"
              filter="url(#glow-cyan)"
            />
            <circle r="3" fill="#070d1e" />

            {/* Station Label & Tag */}
            <rect x="-75" y="-42" width="150" height="26" rx="4" fill="#070d1e" stroke="#00f3ff" strokeWidth="1.5" opacity="0.95" />
            <text x="0" y="-25" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              MAITRI (70°45′S)
            </text>

            {/* Telemetry Pop-up Pill */}
            <rect x="-85" y="14" width="170" height="22" rx="4" fill="#070d1e" stroke={riskPillColor(maitri.riskLevel)} strokeWidth="1.2" opacity="0.9" />
            <text x="0" y="29" fill={riskTextColor(maitri.riskLevel)} fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {maitri.temperature}°C {" • "} FUEL: {maitri.fuel}% {" • "} {maitri.riskLevel}
            </text>
          </g>

          {/* ==================================================== */}
          {/* 2. BHARATI STATION PIN & TELEMETRY PILL */}
          {/* ==================================================== */}
          <g
            transform={`translate(${bharati.mapCoordinates?.x || 580}, ${bharati.mapCoordinates?.y || 260})`}
          >
            {/* Pulsing Radar Ring */}
            <circle r="18" fill="#38bdf8" opacity="0.2">
              <animate attributeName="r" values="10;26;10" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" repeatCount="indefinite" />
            </circle>
            {/* Pin Center */}
            <circle
              r="8"
              fill="#38bdf8"
              stroke="#ffffff"
              strokeWidth="2.5"
              filter="url(#glow-sky)"
            />
            <circle r="3" fill="#070d1e" />

            {/* Station Label & Tag */}
            <rect x="-75" y="-42" width="150" height="26" rx="4" fill="#070d1e" stroke="#38bdf8" strokeWidth="1.5" opacity="0.95" />
            <text x="0" y="-25" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              BHARATI (69°24′S)
            </text>

            {/* Telemetry Pop-up Pill */}
            <rect x="-85" y="14" width="170" height="22" rx="4" fill="#070d1e" stroke={riskPillColor(bharati.riskLevel)} strokeWidth="1.2" opacity="0.9" />
            <text x="0" y="29" fill={riskTextColor(bharati.riskLevel)} fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
              {bharati.temperature}°C {" • "} FUEL: {bharati.fuel}% {" • "} {bharati.riskLevel}
            </text>
          </g>
        </svg>

        {/* Map Footer Bar */}
        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between text-[11px] font-mono bg-polar-950/90 backdrop-blur px-3.5 py-2 rounded-lg border border-polar-800 text-slate-400 gap-2">
          <span>Projection: <strong className="text-slate-200">Antarctic Polar Stereographic WGS84</strong></span>
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Maitri (Inland 70°S)</span>
            </span>
            <span className="flex items-center space-x-1.5 text-sky-300">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>Bharati (Coastal 69°S)</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
