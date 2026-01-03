import { useEffect, useRef, useState } from "react";

/**
 * Precio en vivo unificado para CRYPTO y STOCKS usando el backend con Polygon.
 * - Polling /api/prices/last cada 2s para simplicidad
 */
export function useLiveCryptoPrice(symbol) {
  const [price, setPrice] = useState(null);
  const [ts, setTs] = useState(null);
  const [status, setStatus] = useState("idle"); // idle|loading|error
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!symbol) return;

    setStatus("loading");
    setError(null);

    const fn = async () => {
      try {
        const base = import.meta.env.VITE_API_URL;
        const r = await fetch(`${base}/api/prices/last?symbol=${encodeURIComponent(symbol)}`, { credentials: "include" });
        const j = await r.json();
        console.log("Precio response:", j); // Logging para depurar
        if (j.ok && j.data) {
          setPrice(Number(j.data.price));
          setTs(Number(j.data.ts) || Date.now());
          setStatus("idle");
          setError(null);
        } else {
          setError(j.message || "Error en respuesta");
          setStatus("error");
        }
      } catch (err) {
        console.error("Error fetching price:", err); // Logging
        setError(err.message);
        setStatus("error");
      }
    };

    fn(); // Llamada inicial
    pollRef.current = setInterval(fn, 2000); // Polling cada 2s

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [symbol]);

  return { price, ts, status, error };
}