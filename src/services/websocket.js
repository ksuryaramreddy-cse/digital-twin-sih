export default class TelemetryWebSocketService {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.listeners = new Set();
    this.statusListeners = new Set();
    this.status = "DISCONNECTED"; // "CONNECTING", "LIVE", "DISCONNECTED", "RECONNECTING", "ERROR"
    this.reconnectAttempts = 0;
    this.reconnectDelays = [1000, 2000, 4000, 8000, 16000, 30000];
    this.reconnectTimer = null;
    this.shouldReconnect = true;
  }

  connect() {
    if (this.socket && (this.socket.readyState === WebSocket.CONNECTING || this.socket.readyState === WebSocket.OPEN)) {
      console.log("[WS] Connection already open or connecting.");
      return;
    }

    this.shouldReconnect = true;
    this.setStatus(this.reconnectAttempts > 0 ? "RECONNECTING" : "CONNECTING");
    console.log(`[WS] Connecting to: ${this.url}`);

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        console.log("[WS] Connection established successfully.");
        this.setStatus("CONNECTED");
        this.reconnectAttempts = 0;

        // Register client role (DIGITAL_TWIN_CONSUMER)
        this.send({
          type: "REGISTER",
          role: "DIGITAL_TWIN_CONSUMER"
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(data));
        } catch (err) {
          console.warn("[WS] Malformed telemetry message received. Skipped parsing.", err);
        }
      };

      this.socket.onerror = (err) => {
        console.error("[WS] WebSocket exception occurred:", err);
        this.setStatus("ERROR");
      };

      this.socket.onclose = (event) => {
        console.log(`[WS] Connection closed. Code: ${event.code}, Reason: ${event.reason}`);
        this.socket = null;
        
        if (this.status !== "ERROR") {
          this.setStatus("DISCONNECTED");
        }

        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      console.error("[WS] Connection setup failed:", err);
      this.setStatus("ERROR");
      this.scheduleReconnect();
    }
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.warn("[WS] Socket not open. Cannot dispatch payload:", data);
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    const delay = this.reconnectDelays[Math.min(this.reconnectAttempts, this.reconnectDelays.length - 1)];
    this.reconnectAttempts++;
    console.log(`[WS] Attempting reconnection in ${delay}ms...`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  setStatus(newStatus) {
    // Standardize CONNECTED to LIVE status label
    this.status = newStatus;
    const displayStatus = newStatus === "CONNECTED" ? "LIVE" : newStatus;
    this.statusListeners.forEach((listener) => listener(displayStatus));
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeStatus(listener) {
    this.statusListeners.add(listener);
    // Push the current state instantly
    listener(this.status === "CONNECTED" ? "LIVE" : this.status);
    return () => this.statusListeners.delete(listener);
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus("DISCONNECTED");
    this.reconnectAttempts = 0;
  }
}
