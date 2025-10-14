import { useState, useEffect, useRef } from "react";

const WS_URLS = {
  crypto: "wss://socket.polygon.io/crypto",
  forex: "wss://socket.polygon.io/forex",
  stocks: "wss://socket.polygon.io/stocks",
};

export function usePolygonWebSocket(symbol, marketType = "crypto") {
  const [data, setData] = useState({ bid: null, ask: null, trade: null });
  const wsRef = useRef(null);
  const apiKey = import.meta.env.VITE_POLYGON_API_KEY;

  useEffect(() => {
    if (!symbol || !apiKey) return;

    const ws = new WebSocket(WS_URLS[marketType]);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log(`🟢 WebSocket abierto para ${symbol}`);
      ws.send(JSON.stringify({ action: "auth", params: apiKey }));

      // Para CRYPTO (ej. X:BTCUSD)
      if (marketType === "crypto") {
        ws.send(JSON.stringify({ action: "subscribe", params: `XA.${symbol}` }));
      }

      // Para acciones (stocks)
      if (marketType === "stocks") {
        ws.send(JSON.stringify({ action: "subscribe", params: `T.${symbol}` }));
      }

      // Para forex
      if (marketType === "forex") {
        ws.send(JSON.stringify({ action: "subscribe", params: `C.${symbol}` }));
      }
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        const events = Array.isArray(msg) ? msg : [msg];

        events.forEach((e) => {
          if (e.ev === "XA" || e.ev === "Q" || e.ev === "C") {
            setData({
              bid: e.bp || e.bidPrice || data.bid,
              ask: e.ap || e.askPrice || data.ask,
              trade: e.p || e.price || data.trade,
            });
          } else if (e.ev === "XT" || e.ev === "T") {
            setData((prev) => ({ ...prev, trade: e.p || e.price }));
          }
        });
      } catch (error) {
        console.error("Error parseando mensaje:", error);
      }
    };

    ws.onclose = () => {
      console.warn(`🔴 WebSocket cerrado para ${symbol}`);
    };

    ws.onerror = (err) => {
      console.error("⚠️ Error en WebSocket:", err);
    };

    return () => {
      ws.close();
    };
  }, [symbol, marketType, apiKey]);

  return data;
}
