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

export default function BharatiChartsSection({ hourlyTrends = [] }) {
  const { bharatiHistory } = useTelemetry();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'tabs'
  const [activeTab, setActiveTab] = useState('temp');

  // Use live backend history when available; fall back to static prop data
  const chartData = bharatiHistory.length > 0 ? bharatiHistory : hourlyTrends;

  const tabs = [
    { id: 'temp', label: 'Temperature', icon: Thermometer, color: 'text-sky-400' },
    { id: 'fuel', label: 'Fuel Depletion (Critical 18%)', icon: Fuel, color: 'text-rose-400' },
    { id: 'battery', label: 'Battery Storage (68%)', icon: BatteryCharging, color: 'text-emerald-400' },
    { id: 'energy', label: 'Energy & CHP Heat', icon: Zap, color: 'text-amber-400' }
  ];

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-polar-800 gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-sky-950/70 border border-sky-500/30 text-sky-400">
            <LineChartIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono font-bold text-base sm:text-lg text-white uppercase tracking-wider">
              24-Hour Telemetry Historical Trends
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Temperature • Fuel Depletion (18%) • Battery Charge (68%) • Energy Consumption & CHP
              {bharatiHistory.length > 0 && (
                <span className="ml-2 text-sky-400">
                  — LIVE · {bharatiHistory.length} readings
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
                ? "bg-sky-950 border-sky-400 text-sky-300 shadow-sm"
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
                ? "bg-sky-950 border-sky-400 text-sky-300 shadow-sm"
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
            subtitle="Coastal Antarctic ambient temperature profile at Larsemann Hills"
            data={chartData}
            type="area"
            series={[
              { key: "temp", name: "Temperature (°C)", color: "#38bdf8" }
            ]}
            height={240}
            yAxisUnit="°C"
          />

          {/* 2. Fuel Trend (Showing Critical 18% Level) */}
          <SensorChart
            title="2. Fuel Reserve Trend (% - Critical Alert)"
            subtitle="Jet-A1 polar diesel depletion reaching critical threshold (18%)"
            data={chartData}
            type="line"
            series={[
              { key: "fuelPct", name: "Fuel Storage (%)", color: "#f43f5e" }
            ]}
            height={240}
            yAxisUnit="%"
          />

          {/* 3. Battery Trend */}
          <SensorChart
            title="3. Battery State of Charge Trend (%)"
            subtitle="500 kWh central LiFePO4 battery bank SOC (68%)"
            data={chartData}
            type="area"
            series={[
              { key: "batteryPct", name: "Battery Charge (%)", color: "#10e796" }
            ]}
            height={240}
            yAxisUnit="%"
          />

          {/* 4. Energy Consumption & CHP Recovery */}
          <SensorChart
            title="4. Energy Consumption vs. CHP Heat Recovery (kW)"
            subtitle="Volvo Penta generator load vs. radiator thermal capture loop"
            data={chartData}
            type="line"
            series={[
              { key: "powerKW", name: "Demand (kW)", color: "#ffb703" },
              { key: "chpHeatKW", name: "Recovered Heat (kW)", color: "#f43f5e" }
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
                      ? "bg-sky-950/80 border-sky-400 text-sky-300 shadow-sm"
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
              title="Bharati Coastal Ambient Surface Temperature Profile"
              subtitle="24-Hour continuous temperature logging at Larsemann Hills Prydz Bay AWS"
              data={chartData}
              type="area"
              series={[
                { key: "temp", name: "Surface Temp (°C)", color: "#38bdf8" }
              ]}
              height={320}
              yAxisUnit="°C"
            />
          )}

          {activeTab === 'fuel' && (
            <SensorChart
              title="Diesel Fuel Reserves Depletion (Critical 18% Level)"
              subtitle="Low reserve alert active • Estimated 26 days of fuel autonomy remaining"
              data={chartData}
              type="line"
              series={[
                { key: "fuelPct", name: "Fuel Storage (%)", color: "#f43f5e" }
              ]}
              height={320}
              yAxisUnit="%"
            />
          )}

          {activeTab === 'battery' && (
            <SensorChart
              title="500 kWh Central Battery Energy Storage System (BESS)"
              subtitle="Battery State of Charge (SOC %) and floating buffer from CHP gensets"
              data={chartData}
              type="area"
              series={[
                { key: "batteryPct", name: "State of Charge (%)", color: "#10e796" }
              ]}
              height={320}
              yAxisUnit="%"
            />
          )}

          {activeTab === 'energy' && (
            <SensorChart
              title="Electrical Power Demand vs. Combined Heat & Power (CHP) Recovery"
              subtitle="Microgrid 400V electrical generation vs. building district thermal radiators"
              data={chartData}
              type="line"
              series={[
                { key: "powerKW", name: "Electrical Demand (kW)", color: "#ffb703" },
                { key: "chpHeatKW", name: "Recovered Heat (kW)", color: "#f43f5e" }
              ]}
              height={320}
              yAxisUnit="kW"
            />
          )}
        </div>
      )}
    </div>
  );
}

