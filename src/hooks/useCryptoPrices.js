import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Multi símbolo cripto (X:...) usando endpoints SSE/poll de tu backend.
 * Ignora precios <=0.01.
 */
export function useCryptoPrices(symbols = []) {
  const stableSymbols = useMemo(
    () =>
      Array.from(
        new Set(
          symbols
            .map((s) => String(s || "").trim().toUpperCase())
            .filter((s) => s.startsWith("X:"))
        )
      ).sort(),
    [symbols]
  );

  const [prices, setPrices] = useState(() =>
    Object.fromEntries(stableSymbols.map((s) => [s, null]))
  );

  const esRefs = useRef({});
  const pollRefs = useRef({});

  // Sincronizar claves
  useEffect(() => {
    setPrices((prev) => {
      const next = { ...prev };
      let changed = false;
      stableSymbols.forEach((s) => {
        if (!(s in next)) {
          next[s] = null;
          changed = true;
        }
      });
      Object.keys(next).forEach((k) => {
        if (!stableSymbols.includes(k)) {
          delete next[k];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [stableSymbols]);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL;
    if (!base) return;

    const current = new Set([
      ...Object.keys(esRefs.current),
      ...Object.keys(pollRefs.current),
    ]);

    const toAdd = stableSymbols.filter((s) => !current.has(s));
    const toRemove = [...current].filter((s) => !stableSymbols.includes(s));

    toRemove.forEach((sym) => {
      const es = esRefs.current[sym];
      if (es) {
        try { es.close(); } catch {}
        delete esRefs.current[sym];
      }
      const id = pollRefs.current[sym];
      if (id) {
        clearInterval(id);
        delete pollRefs.current[sym];
      }
    });

    toAdd.forEach((sym) => startSSE(sym));

    function startSSE(sym) {
      let es;
      try {
        es = new EventSource(
          `${base}/api/prices/crypto/stream?symbol=${encodeURIComponent(sym)}`
        );
      } catch {
        startPoll(sym);
        return;
      }
      esRefs.current[sym] = es;
      es.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "price") {
            const p = Number(msg.price);
            if (Number.isFinite(p) && p > 0.01) {
              setPrices((prev) =>
                prev[sym] === p ? prev : { ...prev, [sym]: p }
              );
            }
          }
        } catch {}
      };
      es.onerror = () => {
        try { es.close(); } catch {}
        delete esRefs.current[sym];
        startPoll(sym);
      };
    }

    function startPoll(sym) {
      const fetchOnce = async () => {
        try {
          const r = await fetch(
            `${base}/api/prices/crypto/last?symbol=${encodeURIComponent(sym)}`
          );
          if (r.status === 204) return;
          const j = await r.json();
          const p = Number(j?.data?.price);
          if (Number.isFinite(p) && p > 0.01) {
            setPrices((prev) =>
              prev[sym] === p ? prev : { ...prev, [sym]: p }
            );
          }
        } catch {}
      };
      fetchOnce();
      pollRefs.current[sym] = setInterval(fetchOnce, 3000);
    }

    return () => {
      Object.values(esRefs.current).forEach((es) => {
        try { es.close(); } catch {}
      });
      esRefs.current = {};
      Object.values(pollRefs.current).forEach((id) => clearInterval(id));
      pollRefs.current = {};
    };
  }, [stableSymbols.join("|")]);

  return prices;
}