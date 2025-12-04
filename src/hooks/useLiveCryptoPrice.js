import { useEffect, useRef, useState } from "react";

/**
 * Precio en vivo de CRYPTO usando el backend:
 * - SSE /api/prices/crypto/stream?symbol=X:BTCUSD (cada 1s)
 * - fallback polling /api/prices/crypto/last si SSE falla
 */
export function useLiveCryptoPrice(symbol) {
  const [price, setPrice] = useState(null);
  const [ts, setTs] = useState(null);
  const [status, setStatus] = useState("idle"); // idle|sse|poll|error
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

    // 1) SSE
    try {
      setStatus("sse");
      esRef.current = new EventSource(`${base}/api/prices/crypto/stream?symbol=${encodeURIComponent(symbol)}`);
    } catch {
      fallbackPoll();
      return;
    }

    esRef.current.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "price" && Number.isFinite(msg.price)) {
          setPrice(Number(msg.price));
          setTs(Number(msg.ts) || Date.now());
        }
      } catch {}
    };
    esRef.current.onerror = () => {
      fallbackPoll();
    };

    function fallbackPoll() {
      setStatus("poll");
      const fn = async () => {
        try {
          const r = await fetch(`${base}/api/prices/crypto/last?symbol=${encodeURIComponent(symbol)}`, { credentials: "include" });
          const j = await r.json();
          const p = Number(j?.data?.price);
          const t = Number(j?.data?.ts) || Date.now();
          if (Number.isFinite(p)) {
            setPrice(p);
            setTs(t);
          }
        } catch {}
      };
      fn();
      pollRef.current = setInterval(fn, 2000);
    }

    function cleanup() {
      if (esRef.current) {
        try { esRef.current.close(); } catch {}
        esRef.current = null;
      }
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setStatus("idle");
    }

    return cleanup;
  }, [symbol]);

  return { price, ts, status };
}