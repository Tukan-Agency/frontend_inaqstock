import { useEffect, useRef, useState } from "react";

/**
 * Precio en vivo via backend:
 * 1) WS  /ws/prices?symbol=...
 * 2) SSE /api/prices/stream?symbol=...
 * 3) Poll /api/prices/last?symbol=...
 *
 * IMPORTANTE:
 * - Usa credentials: "include" para que funcione con cookies/sesión.
 * - Reporta error para poder depurar cuando stocks no respondan.
 */
export function useLivePrice(symbol) {
  const [price, setPrice] = useState(null);
  const [ts, setTs] = useState(null);
  const [source, setSource] = useState(null);
  const [status, setStatus] = useState("idle"); // idle|ws|sse|poll|error
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const esRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    const sym = symbol ? String(symbol).trim() : "";
    if (!sym) return;

    cleanup();
    setError(null);

    const base = import.meta.env.VITE_API_URL;
    if (!base) {
      setStatus("error");
      setError("Falta VITE_API_URL");
      return;
    }

    const setValid = (p, t, src) => {
      const num = Number(p);
      if (!Number.isFinite(num)) return;
      setPrice(num);
      setTs(Number(t) || Date.now());
      setSource(src || null);
    };

    // 1) WebSocket
    const wsUrl =
      (base.startsWith("https") ? base.replace("https", "wss") : base.replace("http", "ws")) +
      `/ws/prices?symbol=${encodeURIComponent(sym)}`;

    try {
      setStatus("ws");
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg?.type === "price" && Number.isFinite(Number(msg.price))) {
            setValid(msg.price, msg.ts, msg.source || "ws");
          }
        } catch {
          // ignore
        }
      };

      wsRef.current.onerror = () => fallbackToSSE("ws-error");
      wsRef.current.onclose = () => fallbackToSSE("ws-close");
    } catch (e) {
      fallbackToSSE("ws-ctor");
    }

    function fallbackToSSE(reason) {
      cleanupWs();
      try {
        // ✅ withCredentials true para cookies
        const sseUrl = `${base}/api/prices/stream?symbol=${encodeURIComponent(sym)}`;
        setStatus("sse");
        setSource("sse");
        setError(null);

        // Algunos navegadores ignoran withCredentials en EventSource “nativo”,
        // pero dejamos esto por compatibilidad (si tu runtime lo soporta).
        esRef.current = new EventSource(sseUrl, { withCredentials: true });

        esRef.current.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data);
            if (msg?.type === "price" && Number.isFinite(Number(msg.price))) {
              setValid(msg.price, msg.ts, msg.source || "sse");
              setError(null);
            }
          } catch {
            // ignore
          }
        };

        esRef.current.onerror = () => {
          fallbackToPoll(`sse-error:${reason || ""}`);
        };
      } catch (e) {
        fallbackToPoll(`sse-ctor:${reason || ""}`);
      }
    }

    function fallbackToPoll(reason) {
      cleanupWs();
      cleanupSse();

      setStatus("poll");
      setSource("poll");

      const fn = async () => {
        try {
          // ✅ CRÍTICO: include cookies
          const r = await fetch(
            `${base}/api/prices/last?symbol=${encodeURIComponent(sym)}`,
            { credentials: "include" }
          );

          // Si te responde HTML/login o 401, lo reportamos
          const ct = r.headers.get("content-type") || "";
          if (!r.ok) {
            setStatus("error");
            setError(`HTTP ${r.status} en /api/prices/last (${reason || "poll"})`);
            return;
          }
          if (!ct.includes("application/json")) {
            setStatus("error");
            setError(`Respuesta no-JSON (${ct}) en /api/prices/last`);
            return;
          }

          const j = await r.json();
          const data = j?.data ?? null;

          // Soporta { ok:true, data:{price,ts,source} }
          if (j?.ok === false) {
            setStatus("error");
            setError(j?.message || "Backend ok:false en /api/prices/last");
            return;
          }

          const p = Number(data?.price);
          if (Number.isFinite(p) && p > 0) {
            setValid(p, data?.ts, data?.source || "poll");
            setError(null);
          } else {
            // No marcamos error duro si solo no hay precio aún
            // pero dejamos una pista
            setError((prev) => prev || "Sin precio válido aún (stocks pueden tardar).");
          }
        } catch (e) {
          setStatus("error");
          setError(e?.message || "Error fetch /api/prices/last");
        }
      };

      fn();
      pollRef.current = setInterval(fn, 2000);
    }

    function cleanupWs() {
      try {
        wsRef.current?.close(1000, "cleanup");
      } catch {
        // ignore
      }
      wsRef.current = null;
    }

    function cleanupSse() {
      if (esRef.current) {
        try {
          esRef.current.close();
        } catch {
          // ignore
        }
        esRef.current = null;
      }
    }

    function cleanupPoll() {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }

    function cleanup() {
      cleanupWs();
      cleanupSse();
      cleanupPoll();
    }

    return cleanup;
  }, [symbol]);

  return { price, ts, source, status, error };
}