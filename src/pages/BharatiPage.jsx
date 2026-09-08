import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import BharatiHeader from '../components/bharati/BharatiHeader';
import BharatiEnvironmentSection from '../components/bharati/BharatiEnvironmentSection';
import BharatiEnergySection from '../components/bharati/BharatiEnergySection';
import BharatiResourcesSection from '../components/bharati/BharatiResourcesSection';
import BharatiEquipmentSection from '../components/bharati/BharatiEquipmentSection';
import BharatiAlertsSection from '../components/bharati/BharatiAlertsSection';
import BharatiChartsSection from '../components/bharati/BharatiChartsSection';
import BharatiSpecialized from '../components/stations/BharatiSpecialized';
import AnomalyIntelligenceCard from '../components/common/AnomalyIntelligenceCard';
import PredictiveForecastCard from '../components/common/PredictiveForecastCard';
import OperationalDecisionCard from '../components/common/OperationalDecisionCard';
import ScenarioSimulator from '../components/common/ScenarioSimulator';

export default function BharatiPage() {
  const { bharati, updateBharatiField, bharatiAnomaly, bharatiForecast, bharatiDecision } = useTelemetry();
  const data = bharati;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. HEADER: BHARATI, Antarctic Research Station, LIVE indicator, Last updated time */}
      <BharatiHeader
        name={data.stationName}
        subtitle={data.subtitle}
        code={data.code}
        coordinates={data.coordinates}
        crewCapacity={data.crewCapacity}
        overallHealth={data.overallHealth}
        status={data.status}
      />

      {/* 2. ENVIRONMENT: Temperature (-24°C), Wind (41 km/h), Humidity (54%), Pressure (992 hPa), Weather */}
      <BharatiEnvironmentSection environment={data.environment} />

      {/* 3. ENERGY: Battery (68%), Power consumption (118.5 kW), Generator (NORMAL), Generator load (83%) */}
      <BharatiEnergySection energy={data.energy} onUpdate={updateBharatiField} />

      {/* 4. RESOURCES: Fuel (18% - CRITICAL/WARNING state), Water (76%), Critical resources */}
      <BharatiResourcesSection resources={data.resources} onUpdate={updateBharatiField} />

      {/* 5. EQUIPMENT: Generator, Heating, Communication (ISRO 11m), Power systems */}
      <BharatiEquipmentSection equipment={data.equipment} />

      {/* 6. ALERTS: Low fuel (CRITICAL), Extreme weather, Low battery, Equipment warning, Communication warning */}
      <BharatiAlertsSection initialAlerts={data.alerts} />

      {/* 7. AI OPERATIONAL INTELLIGENCE - real IsolationForest results from local backend */}
      <AnomalyIntelligenceCard
        anomalyData={bharatiAnomaly}
        stationName="Bharati"
      />

      {/* 8. PREDICTIVE FORECAST INTELLIGENCE - real 24H linear regression & SES trends */}
      <PredictiveForecastCard
        forecastData={bharatiForecast}
        stationName="Bharati"
      />

      {/* 9. OPERATIONAL DECISION INTELLIGENCE - multi-engine risk synthesis & prioritized action directives */}
      <OperationalDecisionCard
        decisionData={bharatiDecision}
        stationName="Bharati"
      />

      {/* 10. WHAT-IF SCENARIO SIMULATOR - interactive deterministic scenario projections */}
      <ScenarioSimulator
        stationId="bharati"
        stationName="Bharati"
      />

      {/* 11. CHARTS: Temperature, Fuel (18%), Battery (68%), Energy consumption & CHP */}
      <BharatiChartsSection hourlyTrends={data.historicalData} />

      {/* 9. SPECIALIZED: Aerodynamic Stilt Load Telemetry & ISRO Satellite Ground Station */}
      <BharatiSpecialized
        aerodynamicData={data.aerodynamicStructure}
        isroData={data.isroEarthStation}
        sciencePayloads={data.sciencePayloads}
        chpThermalKW={data.energy.chpThermalRecoveryKW}
      />
    </div>
  );
}
