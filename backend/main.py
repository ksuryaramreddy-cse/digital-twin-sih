import asyncio
import random
from collections import deque
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from config import PORT, HOST, GEMINI_API_KEY
from ai_service import analyze_telemetry_with_gemini
from database import get_database
from services.anomaly_detector import run_anomaly_detection
from services.forecasting_service import forecast_station
from services.decision_engine import evaluate_station_decision
from services.scenario_simulation import simulate_station_scenario
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# In-memory station baseline state  (defined first so helpers can reference it)
# ---------------------------------------------------------------------------
STATIONS_STORE = {
    "maitri": {
        "stationId": "maitri",
        "stationName": "MAITRI",
        "status": "ONLINE",
        "riskLevel": "HIGH RISK",
        "temperature": -35.0,
        "windSpeed": 52.0,
        "humidity": 61,
        "pressure": 984.0,
        "battery": 78,
        "fuel": 72,
        "water": 84,
        "powerConsumption": 48.6,
        "generatorStatus": "NORMAL",
        "generatorLoad": 78,
        "communicationStatus": "ONLINE",
        "primaryAlert": "EXTREME COLD",
        "alerts": [
            {
                "id": "ALT-EXT-COLD",
                "type": "Extreme Cold",
                "severity": "warning",
                "message": "Ambient temperature dropped to -35.0°C (Wind chill -48.2°C)."
            }
        ]
    },
    "bharati": {
        "stationId": "bharati",
        "stationName": "BHARATI",
        "status": "ONLINE",
        "riskLevel": "HIGH RISK",
        "temperature": -24.0,
        "windSpeed": 41.0,
        "humidity": 54,
        "pressure": 992.0,
        "battery": 68,
        "fuel": 18,
        "water": 76,
        "powerConsumption": 118.5,
        "generatorStatus": "NORMAL",
        "generatorLoad": 83,
        "communicationStatus": "ONLINE",
        "primaryAlert": "LOW FUEL",
        "alerts": [
            {
                "id": "ALT-BH-FUEL",
                "type": "Low Fuel",
                "severity": "critical",
                "message": "Diesel storage dropped to 18% (20,160 L remaining). Estimated 26 days autonomy."
            }
        ]
    }
}

# ---------------------------------------------------------------------------
# Rolling telemetry history — max 500 readings per station (auto-evicts oldest)
# ---------------------------------------------------------------------------
TELEMETRY_HISTORY: dict[str, deque] = {
    "maitri": deque(maxlen=500),
    "bharati": deque(maxlen=500),
}


def record_telemetry_snapshot(station_id: str) -> None:
    """Append a timestamped snapshot of the current station state to its history."""
    station = STATIONS_STORE.get(station_id)
    if station is None:
        return
    snapshot = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "temperature": station.get("temperature"),
        "windSpeed": station.get("windSpeed"),
        "humidity": station.get("humidity"),
        "pressure": station.get("pressure"),
        "battery": station.get("battery"),
        "fuel": station.get("fuel"),
        "water": station.get("water"),
        "powerConsumption": station.get("powerConsumption"),
        "generatorStatus": station.get("generatorStatus"),
        "generatorLoad": station.get("generatorLoad"),
        "communicationStatus": station.get("communicationStatus"),
        "status": station.get("status"),
        "riskLevel": station.get("riskLevel"),
    }
    TELEMETRY_HISTORY[station_id].append(snapshot)


async def telemetry_tick_loop():
    while True:
        try:
            await asyncio.sleep(4)
            for station_id, station in STATIONS_STORE.items():
                temp = station["temperature"]
                wind = station["windSpeed"]
                battery = station["battery"]
                fuel = station["fuel"]
                water = station["water"]
                power = station["powerConsumption"]

                # 1. Temperature variation (drift)
                temp_change = random.uniform(-0.2, 0.2)
                new_temp = temp + temp_change
                station["temperature"] = round(max(-60.0, min(-10.0, new_temp)), 1)

                # 2. Wind Speed variation
                wind_change = random.uniform(-1.0, 1.0)
                new_wind = wind + wind_change
                station["windSpeed"] = round(max(5.0, min(140.0, new_wind)), 1)

                # 3. Battery slowly decreases
                battery_drain = 0.15
                new_battery = battery - battery_drain
                station["battery"] = round(max(0.0, min(100.0, new_battery)), 1)

                # 4. Fuel slowly decreases
                fuel_drain = 0.04
                new_fuel = fuel - fuel_drain
                station["fuel"] = round(max(0.0, min(100.0, new_fuel)), 1)

                # 5. Water level gradual change
                water_change = random.uniform(-0.2, 0.2)
                new_water = water + water_change
                station["water"] = round(max(0.0, min(100.0, new_water)), 1)

                # 6. Power Consumption variation
                power_change = random.uniform(-0.25, 0.25)
                new_power = power + power_change
                station["powerConsumption"] = round(max(10.0, min(200.0, new_power)), 1)

                # Derive status
                if station["battery"] < 30 or station["fuel"] < 20 or station["water"] < 20:
                    station["status"] = "CRITICAL"
                elif station["battery"] < 70 or station["fuel"] < 50 or station["water"] < 50:
                    station["status"] = "WARNING"
                else:
                    station["status"] = "ONLINE"

                # Derive risk score and level
                risk_score = 0
                if station["temperature"] <= -35.0:
                    risk_score += 2
                elif station["temperature"] <= -28.0:
                    risk_score += 1

                if station["windSpeed"] >= 50.0:
                    risk_score += 2
                elif station["windSpeed"] >= 40.0:
                    risk_score += 1

                if station["fuel"] <= 20:
                    risk_score += 3
                elif station["fuel"] <= 35:
                    risk_score += 1

                if station["battery"] <= 40:
                    risk_score += 2

                comms = station.get("communicationStatus", "ONLINE")
                if "DEGRADED" in comms or "OFFLINE" in comms:
                    risk_score += 2

                if risk_score >= 3:
                    station["riskLevel"] = "HIGH RISK"
                elif risk_score >= 2:
                    station["riskLevel"] = "MODERATE RISK"
                else:
                    station["riskLevel"] = "LOW RISK"

                # Update generator load based on power consumption
                station["generatorLoad"] = int(max(20, min(100, round(station["powerConsumption"] / 0.8))))
                station["generatorStatus"] = "HIGH_LOAD" if station["battery"] < 40 else "NORMAL"

                # Derive alerts and primaryAlert
                alerts = []
                primary_alert = "NOMINAL"

                if station["windSpeed"] >= 75 and station["temperature"] <= -30:
                    primary_alert = "BLIZZARD WARNING"
                    alerts.append({
                        "id": "ALT-BLIZZARD",
                        "type": "Blizzard Warning",
                        "severity": "critical",
                        "message": "Blizzard conditions active. Extreme winds and freezing temperatures."
                    })
                elif station["temperature"] <= -30:
                    primary_alert = "EXTREME COLD"
                    alerts.append({
                        "id": "ALT-EXT-COLD",
                        "type": "Extreme Cold",
                        "severity": "warning",
                        "message": f"Ambient temperature dropped to {station['temperature']}°C."
                    })

                if station["windSpeed"] >= 50 and not (station["windSpeed"] >= 75 and station["temperature"] <= -30):
                    if primary_alert == "NOMINAL":
                        primary_alert = "HIGH WIND"
                    alerts.append({
                        "id": "ALT-HIGH-WIND",
                        "type": "High Wind",
                        "severity": "warning",
                        "message": f"Katabatic gale winds at {station['windSpeed']} km/h."
                    })

                if station["fuel"] < 20:
                    primary_alert = "LOW FUEL"
                    alerts.append({
                        "id": "ALT-BH-FUEL" if station_id == "bharati" else "ALT-LOW-FUEL",
                        "type": "Low Fuel",
                        "severity": "critical",
                        "message": f"Diesel storage dropped to {station['fuel']}%."
                    })

                if station["battery"] < 30:
                    if primary_alert in ("NOMINAL", "EXTREME COLD", "HIGH WIND"):
                        primary_alert = "LOW BATTERY"
                    alerts.append({
                        "id": "ALT-LOW-BATT",
                        "type": "Low Battery",
                        "severity": "warning",
                        "message": f"Battery bank level at {station['battery']}%."
                    })

                station["primaryAlert"] = primary_alert
                station["alerts"] = alerts

                # Save to MongoDB if available
                db = get_database()
                if db is not None:
                    try:
                        db.telemetry_history.insert_one({"stationId": station_id, "data": station})
                    except Exception:
                        pass

                # Record in-memory rolling history snapshot (after all updates are applied)
                record_telemetry_snapshot(station_id)

        except asyncio.CancelledError:
            break
        except Exception:
            await asyncio.sleep(1)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Seed history with one baseline snapshot per station so the API is
    # never empty before the first telemetry tick fires.
    for station_id in STATIONS_STORE:
        record_telemetry_snapshot(station_id)

    task = asyncio.create_task(telemetry_tick_loop())
    yield
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="Antarctic Digital Twin API",
    description="FastAPI Backend for Maitri & Bharati Stations with Gemini AI diagnostics and MongoDB persistence",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (Vite running on port 3000 / 3001)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {
        "platform": "Antarctic Digital Twin Backend",
        "status": "ONLINE",
        "gemini_ai_configured": bool(GEMINI_API_KEY),
        "stations_tracked": list(STATIONS_STORE.keys())
    }


@app.get("/api/v1/stations")
def get_all_stations():
    return list(STATIONS_STORE.values())


@app.get("/api/v1/stations/{station_id}")
def get_station(station_id: str):
    key = station_id.lower()
    if key not in STATIONS_STORE:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")
    return STATIONS_STORE[key]


@app.get("/api/v1/stations/{station_id}/history")
def get_station_history(station_id: str):
    key = station_id.lower()
    if key not in TELEMETRY_HISTORY:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")
    history_list = list(TELEMETRY_HISTORY[key])
    return {
        "station": key,
        "count": len(history_list),
        "history": history_list,
    }


@app.get("/api/v1/stations/{station_id}/anomaly")
def get_station_anomaly(station_id: str):
    """
    Multi-sensor anomaly detection using IsolationForest.

    Trains on the station's rolling telemetry history and evaluates the latest
    snapshot.  Stations are kept strictly independent — Maitri history never
    influences Bharati analysis and vice versa.

    Returns LEARNING status until MINIMUM_SAMPLES (30) readings are available.
    """
    key = station_id.lower()
    if key not in TELEMETRY_HISTORY:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")

    history_list = list(TELEMETRY_HISTORY[key])

    # The latest snapshot is the most recent history entry; if history is empty
    # fall back to the current STATIONS_STORE values so the endpoint never 500s.
    if history_list:
        latest_snapshot = history_list[-1]
    else:
        latest_snapshot = STATIONS_STORE.get(key, {})

    return run_anomaly_detection(
        station_id=key,
        history=history_list,
        latest_snapshot=latest_snapshot,
    )


@app.get("/api/v1/stations/{station_id}/forecast")
def get_station_forecast(station_id: str):
    """
    Predictive operational forecasting for station telemetry.

    Analyzes rolling history for battery, fuel (with autonomy),
    power consumption, and temperature trends over a 24-hour horizon.
    Returns LEARNING status until MIN_FORECAST_SAMPLES (20) are available.
    """
    key = station_id.lower()
    if key not in TELEMETRY_HISTORY:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")

    history_list = list(TELEMETRY_HISTORY[key])
    return forecast_station(
        station_id=key,
        history=history_list,
    )


@app.get("/api/v1/stations/{station_id}/decision")
def get_station_decision(station_id: str):
    """
    Explainable operational risk assessment and decision intelligence.

    Combines current station state, rolling history anomaly detection (IsolationForest),
    and predictive forecasts (linear regression + SES) into categorical risk assessments
    (Energy, Resources, Environment, Infrastructure), weighted overall risk with safety
    escalation, and prioritized actionable recommendations.
    """
    key = station_id.lower()
    if key not in STATIONS_STORE or key not in TELEMETRY_HISTORY:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")

    current_station = STATIONS_STORE[key]
    history_list = list(TELEMETRY_HISTORY[key])
    latest_snapshot = history_list[-1] if history_list else current_station

    anomaly_result = run_anomaly_detection(
        station_id=key,
        history=history_list,
        latest_snapshot=latest_snapshot,
    )
    forecast_result = forecast_station(
        station_id=key,
        history=history_list,
    )

    return evaluate_station_decision(
        station_id=key,
        current_station=current_station,
        history=history_list,
        anomaly_result=anomaly_result,
        forecast_result=forecast_result,
    )


class ScenarioSimulationRequest(BaseModel):
    temperatureDelta: float = Field(0.0, ge=-50.0, le=50.0, description="Temperature change in Celsius (-50 to +50)")
    powerDemandChange: float = Field(0.0, ge=-100.0, le=200.0, description="Power demand percentage change (-100 to +200)")
    generatorCapacityChange: float = Field(0.0, ge=-100.0, le=100.0, description="Generator capacity percentage change (-100 to +100)")
    fuelConsumptionChange: float = Field(0.0, ge=-100.0, le=200.0, description="Fuel consumption percentage change (-100 to +200)")
    durationHours: float = Field(24.0, ge=1.0, le=168.0, description="Simulation duration in hours (1 to 168)")


@app.post("/api/v1/stations/{station_id}/simulate")
def simulate_scenario(station_id: str, payload: ScenarioSimulationRequest):
    """
    What-If scenario simulation engine for polar stations.

    Applies deterministic mathematical and rule-based models to project
    the operational impact of temperature deltas, power demand variations,
    generator capacity impairments, and fuel consumption surges.
    """
    key = station_id.lower()
    if key not in STATIONS_STORE or key not in TELEMETRY_HISTORY:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")

    current_station = STATIONS_STORE[key]
    history_list = list(TELEMETRY_HISTORY[key])
    latest_snapshot = history_list[-1] if history_list else current_station

    anomaly_result = run_anomaly_detection(
        station_id=key,
        history=history_list,
        latest_snapshot=latest_snapshot,
    )
    forecast_result = forecast_station(
        station_id=key,
        history=history_list,
    )

    scenario_dict = payload.model_dump() if hasattr(payload, "model_dump") else payload.dict()

    return simulate_station_scenario(
        station_id=key,
        current_telemetry=current_station,
        forecast_data=forecast_result,
        anomaly_data=anomaly_result,
        scenario=scenario_dict,
    )



@app.post("/api/v1/stations/{station_id}/telemetry")
def update_telemetry(station_id: str, updates: dict = Body(...)):
    key = station_id.lower()
    if key not in STATIONS_STORE:
        raise HTTPException(status_code=404, detail=f"Station '{station_id}' not found.")
    STATIONS_STORE[key].update(updates)

    # Save to MongoDB if available
    db = get_database()
    if db is not None:
        try:
            db.telemetry_history.insert_one({"stationId": key, "data": STATIONS_STORE[key]})
        except Exception:
            pass

    # Record in-memory rolling history snapshot for manual/scenario updates
    record_telemetry_snapshot(key)

    return {"status": "SUCCESS", "station": STATIONS_STORE[key]}


@app.post("/api/v1/ai/analyze")
def analyze_station_with_ai(payload: dict = Body(...)):
    station_id = payload.get("stationId", "maitri").lower()
    prompt = payload.get("prompt", "")
    station_data = STATIONS_STORE.get(station_id, {})
    analysis = analyze_telemetry_with_gemini(station_data, prompt)
    return {
        "stationId": station_id,
        "analysis": analysis
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
