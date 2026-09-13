import { useEffect, useRef, useState } from "react";

export function useLivePrice(symbol) {
  const [state, setState] = useState({
    symbol: null,
    price: null,
    ts: null,
    source: null,
    status: "connecting",
    transport: null,
    mode: null,
    error: null,
  });
  const retryRef = useRef(0);

  useEffect(() => {
    const normalizedSymbol = String(symbol || "").trim().toUpperCase();
    const base = import.meta.env.VITE_API_URL || "";
    if (!normalizedSymbol || !base) {
      setState((current) => ({ ...current, symbol: normalizedSymbol || null, status: "error", error: "Servicio de precios no configurado" }));
      return undefined;
    }

    let cancelled = false;
    let socket;
    let reconnectTimer;
    let watchdogTimer;

    setState({ symbol: normalizedSymbol, price: null, ts: null, source: null, status: "connecting", transport: null, mode: null, error: null });

    const connect = () => {
      if (cancelled) return;
      const wsUrl = `${base.replace(/^http/, "ws")}/ws/prices?symbol=${encodeURIComponent(normalizedSymbol)}`;
      socket = new WebSocket(wsUrl);

      watchdogTimer = window.setTimeout(() => {
        if (!cancelled && socket?.readyState === WebSocket.OPEN) socket.close(4000, "price-timeout");
      }, 8000);

      socket.onopen = () => {
        setState((current) => ({ ...current, status: "connected", transport: "websocket", error: null }));
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "status") {
            setState((current) => ({ ...current, mode: message.mode || current.mode }));
          } else if (message.type === "price" && Number.isFinite(Number(message.price))) {
            window.clearTimeout(watchdogTimer);
            retryRef.current = 0;
            setState({
              symbol: normalizedSymbol,
              price: Number(message.price),
              ts: Number(message.ts) || Date.now(),
              source: message.source || "polygon",
              status: "live",
              transport: message.transport || "websocket",
              mode: message.mode || "rest-fallback",
              error: null,
            });
          } else if (message.type === "error") {
            setState((current) => ({ ...current, error: message.message || "Precio temporalmente no disponible" }));
          }
        } catch {
          // Ignorar mensajes que no pertenezcan al protocolo de precios.
        }
      };

      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        window.clearTimeout(watchdogTimer);
        if (cancelled) return;
        const delay = Math.min(15000, 1000 * 2 ** retryRef.current++);
        setState((current) => ({ ...current, status: "reconnecting", error: "Reconectando precios" }));
        reconnectTimer = window.setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      cancelled = true;
      window.clearTimeout(watchdogTimer);
      window.clearTimeout(reconnectTimer);
      if (socket) {
        socket.onclose = null;
        socket.close(1000, "symbol-change");
      }
    };
  }, [symbol]);

  return state;
}
