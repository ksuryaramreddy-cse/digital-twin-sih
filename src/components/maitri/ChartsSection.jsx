import React, { useState } from 'react';
import { 
  LineChart as LineChartIcon, 
  BarChart3, 
  Thermometer, 
  Fuel, 
  BatteryCharging, 
  Zap, 
  LayoutGrid, 
  Layers 
} from 'lucide-react';
import SensorChart from '../common/SensorChart';
import { useTelemetry } from '../../context/TelemetryContext';

export default function ChartsSection({ hourlyTrends = [] }) {
  const { maitriHistory } = useTelemetry();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'tabs'
  const [activeTab, setActiveTab] = useState('temp');

  // Use live backend history when available; fall back to static prop data
  const chartData = maitriHistory.length > 0 ? maitriHistory : hourlyTrends;

  const tabs = [
    { id: 'temp', label: 'Temperature Trend', icon: Thermometer, color: 'text-cyan-400' },
    { id: 'fuel', label: 'Fuel Reserves Trend', icon: Fuel, color: 'text-amber-400' },
    { id: 'battery', label: 'Battery Storage Trend', icon: BatteryCharging, color: 'text-emerald-400' },
    { id: 'power', label: 'Power Consumption', icon: Zap, color: 'text-sky-400' }
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-polar-800 gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-400">
            <LineChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-base sm:text-lg text-white uppercase tracking-wider">
              24-Hour Telemetry Historical Trends
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Temperature • Fuel Consumption • Battery Charge • Power Demand
              {maitriHistory.length > 0 && (
                <span className="ml-2 text-cyan-400">
                  - LIVE · {maitriHistory.length} readings
                </span>
              )}
            </p>
          </div>
        </div>

        {/* View Toggle Mode */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center space-x-1.5 ${
              viewMode === 'grid'
                ? "bg-cyan-950 border-cyan-400 text-cyan-300 shadow-sm"
                : "bg-polar-900 border-polar-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>2x2 Grid View</span>
          </button>
          <button
            onClick={() => setViewMode('tabs')}
            className={`px-3 py-1.5 rounded-lg border transition flex items-center space-x-1.5 ${
              viewMode === 'tabs'
                ? "bg-cyan-950 border-cyan-400 text-cyan-300 shadow-sm"
                : "bg-polar-900 border-polar-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Detailed Tabs</span>
          </button>
        </div>
      </div>

      {/* Grid Mode: Renders all 4 Charts side-by-side in 2x2 grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* 1. Temperature Trend */}
          <SensorChart
            title="1. Temperature Trend (°C)"
            subtitle="Diurnal ambient surface temperatures from AWS sensors"
            data={chartData}
            type="area"
            series={[
              { key: "temp", name: "Temperature (°C)", color: "#00f3ff" }
            ]}
            height={240}
            yAxisUnit="°C"
          />

          {/* 2. Fuel Trend */}
          <SensorChart
            title="2. Fuel Level Trend (%)"
            subtitle="Jet-A1 polar diesel reserve depletion & consumption curve"
            data={chartData}
            type="line"
            series={[
              { key: "fuelPct", name: "Fuel Storage (%)", color: "#ffb703" }
            ]}
            height={240}
            yAxisUnit="%"
          />

          {/* 3. Battery Trend */}
          <SensorChart
            title="3. Battery State of Charge Trend (%)"
            subtitle="320 kWh LiFePO4 battery bank SOC & buffer status"
            data={chartData}
            type="area"
            series={[
              { key: "batteryPct", name: "Battery Charge (%)", color: "#10e796" }
            ]}
            height={240}
            yAxisUnit="%"
          />

          {/* 4. Power Consumption */}
          <SensorChart
            title="4. Power Consumption (kW)"
            subtitle="Active microgrid electrical demand curve vs generator capacity"
            data={chartData}
            type="line"
            series={[
              { key: "powerKW", name: "Power Load (kW)", color: "#38bdf8" }
            ]}
            height={240}
            yAxisUnit="kW"
          />
        </div>
      ) : (
        /* Tabs Mode: High-Detail Deep-Dive Chart */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 bg-polar-900/60 p-2 rounded-xl border border-polar-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition flex items-center space-x-2 border ${
                    isSelected
                      ? "bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-sm"
                      : "bg-polar-900 border-polar-750 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeTab === 'temp' && (
            <SensorChart
              title="Maitri Ambient Surface Temperature Dynamics"
              subtitle="24-Hour continuous sub-zero thermal logging at Schirmacher Oasis"
              data={chartData}
              type="area"
              series={[
                { key: "temp", name: "Surface Temp (°C)", color: "#00f3ff" }
              ]}
              height={320}
              yAxisUnit="°C"
            />
          )}

          {activeTab === 'fuel' && (
            <SensorChart
              title="Diesel Fuel Reserves & Consumption Trajectory"
              subtitle="Jet-A1 low pour polar diesel storage reserves across 24h cycle"
              data={chartData}
              type="line"
              series={[
                { key: "fuelPct", name: "Fuel Reserve Level (%)", color: "#ffb703" }
              ]}
              height={320}
              yAxisUnit="%"
            />
          )}

          {activeTab === 'battery' && (
            <SensorChart
              title="320 kWh Central Battery Energy Storage System (BESS)"
              subtitle="Battery State of Charge (SOC %) and float charging cycle"
              data={chartData}
              type="area"
              series={[
                { key: "batteryPct", name: "State of Charge (%)", color: "#10e796" }
              ]}
              height={320}
              yAxisUnit="%"
            />
          )}

          {activeTab === 'power' && (
            <SensorChart
              title="Electrical Microgrid Active Demand vs. Generator Load"
              subtitle="Real-time 3-Phase 415V electrical power distribution"
              data={chartData}
              type="line"
              series={[
                { key: "powerKW", name: "Demand (kW)", color: "#38bdf8" },
                { key: "genLoadPct", name: "Generator Load (%)", color: "#ffb703" }
              ]}
              height={320}
            />
          )}
        </div>
      )}
    </div>
  );
}

