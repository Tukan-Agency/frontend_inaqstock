import { useEffect, useMemo, useState } from "react";

/**
 * Precios live para MUCHOS símbolos (stocks y crypto) vía backend.
 * Estrategia: polling /api/prices/last cada 2s.
 *
 * Este archivo incluye LOGS para depurar por qué no llegan precios en el navegador
 * (401, HTML, CORS, VITE_API_URL incorrecta, etc).
 */
export function useMultiLivePrices(symbols = []) {
  const [prices, setPrices] = useState({});

  const uniqSymbols = useMemo(() => {
    const arr = Array.isArray(symbols) ? symbols : [];
    return Array.from(
      new Set(arr.map((s) => String(s || "").trim().toUpperCase()).filter(Boolean))
    );
  }, [symbols]);

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL;

    if (!base) {
      console.warn("[useMultiLivePrices] Missing VITE_API_URL");
      setPrices({});
      return;
    }

    if (!uniqSymbols.length) {
      setPrices({});
      return;
    }

    let alive = true;
    let tickN = 0;

    const tick = async () => {
      tickN += 1;

      // LOG: primera vez (para no spamear tanto)
      if (tickN === 1) {
        console.log("[useMultiLivePrices] start", { base, symbols: uniqSymbols });
      }

      await Promise.all(
        uniqSymbols.map(async (sym) => {
          const url = `${base}/api/prices/last?symbol=${encodeURIComponent(sym)}`;

          try {
            const r = await fetch(url, { credentials: "include" });
            const ct = r.headers.get("content-type") || "";

            if (!r.ok) {
              const txt = await r.text().catch(() => "");
              console.error("[useMultiLivePrices] HTTP error", {
                sym,
                url,
                status: r.status,
                contentType: ct,
                body: txt.slice(0, 400),
              });
              return;
            }

            // Si el backend responde HTML/login, acá lo vas a ver
            if (!ct.includes("application/json")) {
              const txt = await r.text().catch(() => "");
              console.error("[useMultiLivePrices] Non-JSON response", {
                sym,
                url,
                status: r.status,
                contentType: ct,
                body: txt.slice(0, 400),
              });
              return;
            }

            const j = await r.json().catch(() => null);
            const p = Number(j?.data?.price);

            if (!Number.isFinite(p) || p <= 0) {
              // Log suave para entender por qué no setea precio
              if (tickN <= 3) {
                console.warn("[useMultiLivePrices] Invalid price payload", { sym, url, payload: j });
              }
              return;
            }

            if (!alive) return;

            setPrices((prev) => {
              if (prev[sym] === p) return prev;
              return { ...prev, [sym]: p };
            });

            if (tickN <= 3) {
              console.log("[useMultiLivePrices] price_ok", { sym, price: p });
            }
          } catch (e) {
            console.error("[useMultiLivePrices] fetch exception", {
              sym,
              url,
              err: e?.message || String(e),
            });
          }
        })
      );
    };

    tick();
    const id = setInterval(tick, 2000);

    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [uniqSymbols]);

  return prices;
}