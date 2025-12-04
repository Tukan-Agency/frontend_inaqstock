import { useEffect, useRef, useState } from "react";

/**
 * Hook para recibir precio en tiempo real desde tu backend WebSocket.
 * - Backend debe exponer: ws(s)://<API>/ws/prices?symbol=X:BTCUSD
 * @param {string} symbol Ej: "X:BTCUSD"
 * @returns {object} { price, ts, error, connecting }
 */
export function useBackendPriceStream(symbol) {
  const [price, setPrice] = useState(null);
  const [ts, setTs] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const wsRef = useRef(null);
  const retryRef = useRef(0);

  useEffect(() => {
    if (!symbol) return;

    let cancelled = false;
    const base = import.meta.env.VITE_API_URL;
    if (!base) {
      setError("VITE_API_URL no configurado");
      return;
    }

    const wsUrl = base.replace(/^http/, "ws") + `/ws/prices?symbol=${encodeURIComponent(symbol)}`;

    function connect() {
      if (cancelled) return;
      setConnecting(true);
      setError(null);
      try {
        wsRef.current = new WebSocket(wsUrl);
      } catch (e) {
        setError(e.message || "Error creando WebSocket");
        scheduleReconnect();
        return;
      }

      wsRef.current.onopen = () => {
        retryRef.current = 0;
        setConnecting(false);
      };

      wsRef.current.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "price") {
            setPrice(msg.price);
            setTs(msg.ts || Date.now());
          } else if (msg.type === "error") {
            setError(msg.message || "WS error");
          }
        } catch {}
      };

      wsRef.current.onerror = (err) => {
        setError("Error en WebSocket");
      };

      wsRef.current.onclose = () => {
        if (!cancelled) scheduleReconnect();
      };
    }

    function scheduleReconnect() {
      const attempt = retryRef.current++;
      const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
      setConnecting(true);
      setTimeout(() => {
        if (!cancelled) connect();
      }, delay);
    }

    connect();

    return () => {
      cancelled = true;
      try {
        wsRef.current?.close(1000, "hook_cleanup");
      } catch {}
      wsRef.current = null;
    };
  }, [symbol]);

  return { price, ts, error, connecting };
}