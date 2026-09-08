from config import GEMINI_API_KEY

SYSTEM_PROMPT = """You are POLARIS-AI, an expert AI telemetry diagnostics assistant for the Indian Antarctic Research Program (NCPOR).
You monitor Maitri (Inland Oasis, 70°S) and Bharati (Coastal, 69°S) research stations.
Analyze real-time sensor metrics (temperature, fuel, battery, power, katabatic wind shear, life support)
and provide tactical, concise engineering advice and safety protocols."""

def analyze_telemetry_with_gemini(station_data: dict, prompt: str = "") -> str:
    """Analyze station operational state using Google Gemini AI."""
    if not GEMINI_API_KEY:
        return "Gemini API key is not configured. Please set GEMINI_API_KEY in .env."

    query = f"""
Station Telemetry:
Name: {station_data.get('stationName')}
Temperature: {station_data.get('temperature')}°C
Wind Speed: {station_data.get('windSpeed')} km/h
Fuel Level: {station_data.get('fuel')}%
Battery Level: {station_data.get('battery')}%
Power Demand: {station_data.get('powerConsumption')} kW
Risk Level: {station_data.get('riskLevel')}
Alerts: {station_data.get('alerts')}

Question / Instruction: {prompt if prompt else 'Provide an operational status diagnosis and tactical recommendations for this station.'}
"""

    # Try Google GenAI (new standard SDK)
    try:
        from google import genai
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=f"{SYSTEM_PROMPT}\n\n{query}"
        )
        return response.text
    except Exception:
        pass

    # Fallback to google.generativeai
    try:
        import google.generativeai as legacy_genai
        legacy_genai.configure(api_key=GEMINI_API_KEY)
        model = legacy_genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(f"{SYSTEM_PROMPT}\n\n{query}")
        return response.text
    except Exception as e:
        return f"Gemini Analysis Error: {str(e)}"

