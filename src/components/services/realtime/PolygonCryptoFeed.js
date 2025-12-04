const WS_URL = "wss://socket.polygon.io/crypto";

function nextDelay(attempt) {
  return Math.min(30000, 1000 * Math.pow(2, attempt));
}

export class PolygonCryptoFeed {
  constructor({ apiKey, onTrade, onError } = {}) {
    this.apiKey = apiKey;
    this.onTrade = typeof onTrade === "function" ? onTrade : () => {};
    this.onError = typeof onError === "function" ? onError : (e) => console.warn("[WS ERR]", e);

    this.ws = null;
    this.connected = false;
    this.authed = false;
    this.subs = new Set();
    this.retry = 0;
    this._wantOpen = false;

    this._onOpen = this._onOpen.bind(this);
    this._onClose = this._onClose.bind(this);
    this._onMessage = this._onMessage.bind(this);
    this._onError = this._onError.bind(this);
  }

  connect() {
    if (this.ws && (this.connected || this._wantOpen)) return;
    this._wantOpen = true;
    this._open();
  }

  disconnect() {
    this._wantOpen = false;
    this.authed = false;
    this.connected = false;
    try {
      if (this.ws) {
        this.ws.removeEventListener("open", this._onOpen);
        this.ws.removeEventListener("close", this._onClose);
        this.ws.removeEventListener("error", this._onError);
        this.ws.removeEventListener("message", this._onMessage);
        this.ws.close(1000, "client_disconnect");
      }
    } catch {}
    this.ws = null;
  }

  subscribe(symbols) {
    if (!symbols || symbols.length === 0) return;
    symbols.forEach((s) => this.subs.add(String(s).trim()));
    if (this.connected && this.authed) {
      const channels = [...symbols].map((s) => `XT.${String(s).trim()}`).join(",");
      console.log("[WS SUBSCRIBE]", channels);
      this._send({ action: "subscribe", params: channels });
    }
  }

  unsubscribe(symbols) {
    if (!symbols || symbols.length === 0) return;
    symbols.forEach((s) => this.subs.delete(String(s).trim()));
    if (this.connected && this.authed) {
      const channels = [...symbols].map((s) => `XT.${String(s).trim()}`).join(",");
      console.log("[WS UNSUBSCRIBE]", channels);
      this._send({ action: "unsubscribe", params: channels });
    }
  }

  setSubscriptions(symbols) {
    const next = new Set((symbols || []).map((s) => String(s).trim()).filter(Boolean));
    const add = [...next].filter((s) => !this.subs.has(s));
    const remove = [...this.subs].filter((s) => !next.has(s));
    if (add.length) this.subscribe(add);
    if (remove.length) this.unsubscribe(remove);
  }

  _open() {
    try {
      console.log("[WS OPENING]", WS_URL);
      this.ws = new WebSocket(WS_URL);
      this.ws.addEventListener("open", this._onOpen);
      this.ws.addEventListener("close", this._onClose);
      this.ws.addEventListener("error", this._onError);
      this.ws.addEventListener("message", this._onMessage);
    } catch (e) {
      console.warn("[WS open error]", e);
      this._scheduleReconnect();
    }
  }

  _onOpen() {
    this.connected = true;
    this.authed = false;
    this.retry = 0;
    console.log("[WS OPEN] sending auth");
    this._send({ action: "auth", params: this.apiKey });
  }

  _onClose(evt) {
    this.connected = false;
    this.authed = false;
    console.log("[WS CLOSE]", evt?.code, evt?.reason);
    if (this._wantOpen) this._scheduleReconnect();
  }

  _onError(e) {
    console.warn("[WS ERROR]", e);
    this.onError(e);
    try {
      this.ws?.close();
    } catch {}
  }

  _scheduleReconnect() {
    const delay = nextDelay(this.retry++);
    console.log("[WS RECONNECT IN]", delay, "ms");
    setTimeout(() => {
      if (this._wantOpen) this._open();
    }, delay);
  }

  _send(obj) {
    try {
      const payload = JSON.stringify(obj);
      this.ws?.send(payload);
    } catch (e) {
      this.onError(e);
    }
  }

  _onMessage(ev) {
    let msgs;
    try {
      msgs = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (!Array.isArray(msgs)) msgs = [msgs];

    for (const m of msgs) {
      // Logs para ver flujo
      if (m.status || m.message) {
        console.log("[WS STATUS]", m);
      }

      if (m.status === "success" && m.message === "authenticated") {
        this.authed = true;
        console.log("[WS AUTH OK], resubscribing", [...this.subs]);
        if (this.subs.size > 0) {
          const channels = [...this.subs].map((s) => `XT.${s}`).join(",");
          console.log("[WS SUBSCRIBE AFTER AUTH]", channels);
          this._send({ action: "subscribe", params: channels });
        }
        continue;
      }

      if (m.status === "error" || m.message === "error") {
        this.onError(m);
        continue;
      }

      // Trade crypto: ev="XT", pair="X:ETHUSD", p=precio
      if (m.ev === "XT" && typeof m.p === "number" && m.p > 0 && typeof m.pair === "string") {
        console.log("[WS TICK]", m.pair, m.p);
        this.onTrade({ symbol: m.pair.trim(), price: m.p, raw: m });
      }
    }
  }
}