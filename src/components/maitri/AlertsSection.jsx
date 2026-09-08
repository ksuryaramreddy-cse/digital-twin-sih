import React, { useState } from 'react';
import { 
  ShieldAlert, 
  ThermometerSnowflake, 
  Wind, 
  BatteryWarning, 
  Fuel, 
  Wrench, 
  Check, 
  AlertTriangle,
  Info,
  CheckCircle2
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function AlertsSection({ initialAlerts = [] }) {
  const [alerts, setAlerts] = useState(initialAlerts);

  const handleAcknowledge = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, ack: true } : a));
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'Extreme Cold':
        return <ThermometerSnowflake className="w-5 h-5 text-cyan-400" />;
      case 'High Wind':
        return <Wind className="w-5 h-5 text-sky-400" />;
      case 'Low Battery':
        return <BatteryWarning className="w-5 h-5 text-emerald-400" />;
      case 'Low Fuel':
        return <Fuel className="w-5 h-5 text-amber-400" />;
      case 'Equipment Warning':
        return <Wrench className="w-5 h-5 text-rose-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSeverityStyle = (sev, ack) => {
    if (ack) {
      return "bg-polar-900/40 border-polar-800 opacity-75";
    }
    switch (sev) {
      case 'warning':
        return "bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-950/50";
      case 'critical':
      case 'error':
        return "bg-rose-950/50 border-rose-500/60 shadow-md shadow-rose-950/50";
      case 'info':
        return "bg-cyan-950/40 border-cyan-500/40 shadow-sm shadow-cyan-950";
      default:
        return "bg-emerald-950/30 border-emerald-500/30";
    }
  };

  const unackCount = alerts.filter(a => !a.ack).length;

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-polar-800 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-rose-950/70 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-base sm:text-lg text-white uppercase tracking-wider">
              Safety & Operations Alerts
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Extreme Cold • High Wind • Low Battery • Low Fuel • Equipment Warning
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="text-slate-400">Status:</span>
          {unackCount > 0 ? (
            <span className="px-2.5 py-1 rounded bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
              {unackCount} Active Alerts
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-semibold">
              All Alerts Acknowledged
            </span>
          )}
        </div>
      </div>

      {/* 5 Core Alerts Grid */}
      <div className="grid grid-cols-1 gap-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-xl border font-mono transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${getSeverityStyle(alert.severity, alert.ack)}`}
          >
            {/* Left: Icon & Alert Description */}
            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 rounded-lg bg-polar-900 border border-polar-750 flex-shrink-0">
                {getAlertIcon(alert.type)}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-white uppercase tracking-wide">
                    {alert.type}
                  </span>
                  <span className="text-[10px] text-slate-400">[{alert.timestamp}]</span>
                  <StatusBadge status={alert.status} size="sm" pulse={!alert.ack} />
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {alert.message}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                  <span>Current: <strong className="text-slate-100">{alert.currentValue}</strong></span>
                  <span>Threshold: <strong className="text-slate-300">{alert.threshold}</strong></span>
                </div>
              </div>
            </div>

            {/* Right: Acknowledge Button */}
            <div className="flex items-center self-end md:self-center flex-shrink-0">
              {alert.ack ? (
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 px-3 py-1.5 rounded border border-emerald-500/30">
                  <Check className="w-3.5 h-3.5" />
                  <span className="font-bold">ACKNOWLEDGED</span>
                </div>
              ) : (
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  className="px-4 py-1.5 text-xs font-bold bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 rounded-lg transition shadow-sm shadow-cyan-500/20"
                >
                  Acknowledge Alert
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

