import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Radio, 
  Activity, 
  Compass, 
  ShieldAlert, 
  Clock, 
  Server, 
  Zap, 
  Flame,
  Globe2,
  Cpu
} from 'lucide-react';
import { useTelemetry } from '../../context/TelemetryContext';

export default function Navbar() {
  const [utcTime, setUtcTime] = useState(new Date().toUTCString());
  const location = useLocation();
  const { maitri, bharati } = useTelemetry();

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    {
      to: "/digital-twin",
      label: "Antarctic Digital Twin",
      badge: "DUAL-TWIN LIVE",
      badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/40",
      icon: Cpu,
      description: "Unified Polar Visualizer & Cross-Station State"
    },
    {
      to: "/maitri",
      label: "Maitri Station",
      badge: "70°45′S • OASIS",
      badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
      icon: Server,
      description: "Inland Lake Priyadarshini & Ozone Telemetry"
    },
    {
      to: "/bharati",
      label: "Bharati Station",
      badge: "69°24′S • COASTAL",
      badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
      icon: Radio,
      description: "Aerodynamic Stilts & ISRO Ground Station"
    }
  ];

  return (
    <header className="sticky top-0 z-50 bg-polar-950/90 backdrop-blur-md border-b border-cyan-500/20 shadow-lg shadow-polar-950/80">
      {/* Top Telemetry & Clock Strip */}
      <div className="bg-polar-900/90 border-b border-polar-800/80 px-4 py-1.5 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>NCPOR / NCAOR POLAR DIGITAL TWIN GRID</span>
          </div>
          <span className="text-polar-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">LATENCY: <span className="text-emerald-400 font-medium">380ms</span></span>
          <span className="text-polar-600 hidden md:inline">|</span>
          <span className="text-slate-400 hidden md:inline">GSAT-30 LINK: <span className="text-cyan-300 font-medium">LOCKED (Ku-Band)</span></span>
        </div>

        <div className="flex items-center space-x-4">
          {/* Station Mini Status Badges dynamically populated from centralized stationData */}
          <div className="hidden lg:flex items-center space-x-3 text-[11px]">
            <NavLink to="/maitri" className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-polar-800/80 border border-cyan-900/50 hover:border-cyan-500/50 transition">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">MAITRI:</span>
              <span className="text-cyan-400 font-bold">{maitri?.status} ({maitri?.powerConsumption} kW)</span>
            </NavLink>
            <NavLink to="/bharati" className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-polar-800/80 border border-sky-900/50 hover:border-sky-500/50 transition">
              <span className={`h-1.5 w-1.5 rounded-full ${bharati?.riskLevel?.includes('HIGH') ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
              <span className="text-slate-300">BHARATI:</span>
              <span className="text-sky-400 font-bold">{bharati?.status} ({bharati?.powerConsumption} kW)</span>
            </NavLink>
          </div>

          <div className="flex items-center space-x-1.5 text-cyan-300 bg-polar-800/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="font-mono text-[11px] font-semibold tracking-wider">{utcTime}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative p-2 rounded-lg bg-polar-900 border border-cyan-500/40 shadow-sm shadow-cyan-500/30">
              <Globe2 className="w-6 h-6 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono font-black text-lg text-white tracking-wider">
                  ANTARCTICA<span className="text-cyan-400">.TWIN</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded">
                  v2.8
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
                Indian Antarctic Research Station Operations
              </p>
            </div>
          </div>

          {/* Three Separate Page Navigation Buttons */}
          <nav className="flex items-center space-x-2 sm:space-x-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`relative group px-3.5 py-2 rounded-lg font-mono text-xs sm:text-sm font-medium transition-all duration-200 flex items-center space-x-2 border ${
                    isActive
                      ? "bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20"
                      : "bg-polar-900/60 border-polar-750 text-slate-400 hover:text-slate-200 hover:border-cyan-500/40 hover:bg-polar-850/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-400'} transition`} />
                  <span className="font-semibold">{item.label}</span>
                  <span className={`hidden md:inline-block px-1.5 py-0.2 text-[9px] rounded font-mono border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-cyan-400 shadow-sm shadow-cyan-400"></span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
