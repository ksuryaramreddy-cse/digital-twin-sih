import { useTelemetry } from '../context/TelemetryContext';

/**
 * Custom React Hook to subscribe to live Antarctic telemetry simulation (Context Fallback)
 */
export function useStationSimulation() {
  return useTelemetry();
}

export default useStationSimulation;
