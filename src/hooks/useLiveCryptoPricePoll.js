import { useEffect, useRef, useState } from "react";

/**
 * Polling cada 1000 ms al backend /api/prices/crypto/live
 * Ignora valores inválidos (null, NaN, <=0).
 */
export function useLiveCryptoPricePoll(symbol) {
  const [price, setPrice] = useState(null);
  const [ts, setTs] = useState(null);
  const [status, setStatus] = useState("idle"); // idle|poll|error
  const lastValidRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!symbol) return;
    cleanup();
    const base = import.meta.env.VITE_API_URL;
    if (!base) {
      setStatus("error");
      return;
    }
    setStatus("poll");

    const fetchOnce = async () => {
      try {
        const r = await fetch(`${base}/api/prices/crypto/live?symbol=${encodeURIComponent(symbol)}`);
        const j = await r.json();
        const p = Number(j?.data?.price);
        const t = Number(j?.data?.ts) || Date.now();
        if (Number.isFinite(p) && p > 0) {
          lastValidRef.current = p;
          setPrice(p);
          setTs(t);
        } else if (lastValidRef.current != null) {
          // Mantener último válido
          setPrice(lastValidRef.current);
          setTs(Date.now());
        }
      } catch {
        if (lastValidRef.current != null) {
          setPrice(lastValidRef.current);
          setTs(Date.now());
        }
      }
    };

    fetchOnce();
    timerRef.current = setInterval(fetchOnce, 1000);

    function cleanup() {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return cleanup;
  }, [symbol]);

  return { price, ts, status };
}