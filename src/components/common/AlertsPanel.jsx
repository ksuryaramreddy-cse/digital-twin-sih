import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, ShieldAlert, Check } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function AlertsPanel({ alerts = [], title = "Active Operational Alerts" }) {
  const [alertList, setAlertList] = useState(alerts);

  const handleAcknowledge = (id) => {
    setAlertList(prev => prev.map(a => a.id === id ? { ...a, ack: true } : a));
  };

  const getSeverityIcon = (sev) => {
    switch (sev) {
      case 'critical':
      case 'error':
        return <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
      case 'info':
        return <Info className="w-4 h-4 text-cyan-400 flex-shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'critical':
      case 'error':
        return <span className="px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-500/40 text-rose-300 text-[10px] font-mono uppercase">CRITICAL</span>;
      case 'warning':
        return <span className="px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-mono uppercase">WARNING</span>;
      case 'info':
        return <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] font-mono uppercase">INFO</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono uppercase">NORMAL</span>;
    }
  };

  return (
    <div className="tactical-panel rounded-xl p-5 border border-cyan-500/20">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-polar-800">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h4 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
            {title}
          </h4>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {alertList.filter(a => !a.ack).length} Unacknowledged
        </span>
      </div>

      <div className="space-y-2.5">
        {alertList.length === 0 ? (
          <div className="text-center py-6 text-slate-500 font-mono text-xs">
            No active alerts recorded. All telemetry within nominal parameters.
          </div>
        ) : (
          alertList.map((alert) => (
            <div 
              key={alert.id}
              className={`p-3 rounded-lg border font-mono transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                alert.ack 
                  ? "bg-polar-900/40 border-polar-800 opacity-70" 
                  : alert.severity === 'critical'
                  ? "bg-rose-950/40 border-rose-500/50 shadow-sm shadow-rose-950"
                  : alert.severity === 'warning'
                  ? "bg-amber-950/30 border-amber-500/40 shadow-sm shadow-amber-950"
                  : "bg-polar-900/80 border-cyan-500/30"
              }`}
            >
              <div className="flex items-start space-x-3">
                {getSeverityIcon(alert.severity)}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-slate-300">{alert.id}</span>
                    <span className="text-[10px] text-slate-500">[{alert.timestamp}]</span>
                    {getSeverityBadge(alert.severity)}
                  </div>
                  <p className="text-xs text-slate-200">{alert.message}</p>
                </div>
              </div>

              <div className="flex items-center self-end sm:self-center">
                {alert.ack ? (
                  <span className="text-[11px] text-slate-500 flex items-center space-x-1">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>ACK</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 rounded transition"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

