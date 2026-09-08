import React from 'react';
import { useTelemetry } from '../context/TelemetryContext';
import MaitriHeader from '../components/maitri/MaitriHeader';
import EnvironmentSection from '../components/maitri/EnvironmentSection';
import EnergySection from '../components/maitri/EnergySection';
import ResourcesSection from '../components/maitri/ResourcesSection';
import EquipmentSection from '../components/maitri/EquipmentSection';
import AlertsSection from '../components/maitri/AlertsSection';
import ChartsSection from '../components/maitri/ChartsSection';
import MaitriSpecialized from '../components/stations/MaitriSpecialized';
import AnomalyIntelligenceCard from '../components/common/AnomalyIntelligenceCard';
import PredictiveForecastCard from '../components/common/PredictiveForecastCard';
import OperationalDecisionCard from '../components/common/OperationalDecisionCard';
import ScenarioSimulator from '../components/common/ScenarioSimulator';

export default function MaitriPage() {
  const { maitri, updateMaitriField, maitriAnomaly, maitriForecast, maitriDecision } = useTelemetry();
  const data = maitri;

  return (
    <div className="space-y-8 pb-16">
      {/* 1. HEADER */}
      <MaitriHeader
        name={data.stationName}
        subtitle={data.subtitle}
        code={data.code}
        coordinates={data.coordinates}
        crewCapacity={data.crewCapacity}
        overallHealth={data.overallHealth}
        status={data.status}
      />

      {/* 2. ENVIRONMENT */}
      <EnvironmentSection environment={data.environment} />

      {/* 3. ENERGY - battery is editable */}
      <EnergySection energy={data.energy} onUpdate={updateMaitriField} />

      {/* 4. RESOURCES - fuel and water are editable */}
      <ResourcesSection
        resources={data.resources}
        lakeData={data.lakePriyadarshini}
        onUpdate={updateMaitriField}
      />

      {/* 5. EQUIPMENT */}
      <EquipmentSection equipment={data.equipment} />

      {/* 6. ALERTS */}
      <AlertsSection initialAlerts={data.alerts} />

      {/* 7. AI OPERATIONAL INTELLIGENCE - real IsolationForest results from local backend */}
      <AnomalyIntelligenceCard
        anomalyData={maitriAnomaly}
        stationName="Maitri"
      />

      {/* 8. PREDICTIVE FORECAST INTELLIGENCE - real 24H linear regression & SES trends */}
      <PredictiveForecastCard
        forecastData={maitriForecast}
        stationName="Maitri"
      />

      {/* 9. OPERATIONAL DECISION INTELLIGENCE - multi-engine risk synthesis & prioritized action directives */}
      <OperationalDecisionCard
        decisionData={maitriDecision}
        stationName="Maitri"
      />

      {/* 10. WHAT-IF SCENARIO SIMULATOR - interactive deterministic scenario projections */}
      <ScenarioSimulator
        stationId="maitri"
        stationName="Maitri"
      />

      {/* 11. CHARTS */}
      <ChartsSection hourlyTrends={data.historicalData} />

      {/* 9. SPECIALIZED */}
      <MaitriSpecialized
        lakeData={data.lakePriyadarshini}
        sciencePayloads={data.sciencePayloads}
      />
    </div>
  );
}
