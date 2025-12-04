import { useEffect, useRef, useState } from "react";

/**
 * WS → SSE → Poll fallback para recibir precio live.
 * symbol: ej "AAPL" (stocks)
 */
export function useLivePrice(symbol) {
  const [price, setPrice] = useState(null);
  const [ts, setTs] = useState(null);
  const [source, setSource] = useState(null);
  const [status, setStatus] = useState("idle"); // idle|ws|sse|poll|error

  const wsRef = useRef(null);
  const esRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!symbol) return;
    cleanup();

    const base = import.meta.env.VITE_API_URL;
    if (!base) {
      setStatus("error");
      return;
    }

    // 1) WebSocket
    const wsUrl =
      (base.startsWith("https") ? base.replace("https", "wss") : base.replace("http", "ws")) +
      `/ws/prices?symbol=${encodeURIComponent(symbol)}`;

    try {
      setStatus("ws");
      wsRef.current = new WebSocket(wsUrl);
    } catch {
      fallbackToSSE();
      return;
    }

    wsRef.current.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "price" && Number.isFinite(msg.price)) {
          setPrice(msg.price);
          setTs(msg.ts || Date.now());
          setSource(msg.source || "ws");
        }
      } catch {}
    };
    wsRef.current.onerror = () => fallbackToSSE();
    wsRef.current.onclose = () => fallbackToSSE();

    function fallbackToSSE() {
      // 2) SSE
      try {
        const sseUrl = `${base}/api/prices/stream?symbol=${encodeURIComponent(symbol)}`;
        setStatus("sse");
        esRef.current = new EventSource(sseUrl);
      } catch {
        fallbackToPoll();
        return;
      }
      esRef.current.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "price" && Number.isFinite(msg.price)) {
            setPrice(msg.price);
            setTs(msg.ts || Date.now());
            setSource(msg.source || "sse");
          }
        } catch {}
      };
      esRef.current.onerror = () => {
        fallbackToPoll();
      };
    }

    function fallbackToPoll() {
      setStatus("poll");
      const fn = async () => {
        try {
          const r = await fetch(`${base}/api/prices/last?symbol=${encodeURIComponent(symbol)}`);
          const j = await r.json();
          const p = Number(j?.data?.price);
          if (Number.isFinite(p)) {
            setPrice(p);
            setTs(Number(j?.data?.ts) || Date.now());
            setSource(j?.data?.source || "poll");
          }
        } catch {}
      };
      fn();
      pollRef.current = setInterval(fn, 3000);
    }

    function cleanup() {
      try { wsRef.current?.close(1000, "cleanup"); } catch {}
      wsRef.current = null;
      if (esRef.current) {
        try { esRef.current.close(); } catch {}
        esRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    return cleanup;
  }, [symbol]);

  return { price, ts, source, status };
}