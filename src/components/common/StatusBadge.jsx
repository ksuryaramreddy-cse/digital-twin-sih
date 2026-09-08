import React from 'react';

export default function StatusBadge({ status, size = "md", pulse = true }) {
  const normalized = (status || "").toUpperCase();

  const getStyle = () => {
    switch (normalized) {
      case "ONLINE":
      case "RUNNING":
      case "OPTIMAL":
      case "NOMINAL":
      case "TRACKING_ACTIVE":
      case "LOCKED":
      case "GREEN":
        return {
          bg: "bg-emerald-950/70 border-emerald-500/40 text-emerald-300",
          dot: "bg-emerald-400",
          glow: "shadow-emerald-500/20"
        };
      case "HOT_STANDBY":
      case "STANDBY":
      case "STANDBY_READY":
      case "ACQUIRING":
      case "CALIBRATING":
      case "INFO":
      case "AMBER":
        return {
          bg: "bg-amber-950/70 border-amber-500/40 text-amber-300",
          dot: "bg-amber-400",
          glow: "shadow-amber-500/20"
        };
      case "WARNING":
      case "DEGRADED":
      case "COLD_STANDBY":
        return {
          bg: "bg-orange-950/70 border-orange-500/40 text-orange-300",
          dot: "bg-orange-400",
          glow: "shadow-orange-500/20"
        };
      case "CRITICAL":
      case "ALERT":
      case "RED":
      case "OFFLINE":
      case "FAILED":
        return {
          bg: "bg-rose-950/70 border-rose-500/40 text-rose-300",
          dot: "bg-rose-400",
          glow: "shadow-rose-500/20"
        };
      default:
        return {
          bg: "bg-cyan-950/70 border-cyan-500/40 text-cyan-300",
          dot: "bg-cyan-400",
          glow: "shadow-cyan-500/20"
        };
    }
  };

  const style = getStyle();
  const sizeClasses = size === "sm" 
    ? "text-[10px] px-1.5 py-0.5" 
    : size === "lg" 
    ? "text-xs px-3 py-1" 
    : "text-[11px] px-2 py-0.5";

  return (
    <span className={`inline-flex items-center space-x-1.5 rounded-md font-mono font-semibold border ${style.bg} ${sizeClasses} shadow-sm ${style.glow}`}>
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${style.dot} opacity-75`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${style.dot}`}></span>
      </span>
      <span>{status}</span>
    </span>
  );
}

