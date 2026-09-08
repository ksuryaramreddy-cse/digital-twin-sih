import React from 'react';
import { Radio, ShieldCheck, Cpu, HardDrive, Wifi, Compass } from 'lucide-react';

export default function FooterStatus() {
  return (
    <footer className="border-t border-polar-800 bg-polar-950/95 py-3 px-4 sm:px-8 text-xs font-mono text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left Status Group */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-slate-400">CORE TWIN:</span>
            <span className="text-emerald-400 font-semibold">SYNCHRONIZED (0.4s sync)</span>
          </div>

          <div className="hidden md:flex items-center space-x-1.5 text-slate-400">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            <span>MESH BANDWIDTH: <span className="text-slate-200">185 Mbps</span></span>
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>NCPOR ENCRYPTION: <span className="text-slate-200">AES-256-GCM</span></span>
          </div>
        </div>

        {/* Right Station Details */}
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="text-slate-500">Maitri (70°45′S) ↔ Bharati (69°24′S): ~3,000 km</span>
          <span className="text-polar-700">|</span>
          <span className="text-cyan-400">POLAR TELEMETRY NODE #IND-02/03</span>
        </div>
      </div>
    </footer>
  );
}

