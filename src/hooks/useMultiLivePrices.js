import { useEffect, useMemo, useState } from "react";
import { getMarketOverview } from "../components/services/marketCatalog.js";

/**
 * Precios en vivo para varios símbolos:
 * 1) Bootstrap REST (overview) → primera cotización rápida
 * 2) WebSocket por símbolo → actualizaciones
 */
export function useMultiLivePrices(symbols = []) {
  const normalizedSymbols = useMemo(
    () =>
      [
        ...new Set(
          symbols
            .map((symbol) => String(symbol || "").trim().toUpperCase())
            .filter(Boolean)
        ),
      ].sort(),
    [symbols]
  );
  const symbolsKey = normalizedSymbols.join("|");
  const [prices, setPrices] = useState({});
  const [status, setStatus] = useState({});

  useEffect(() => {
    const base = import.meta.env.VITE_API_URL || "";
    const activeSymbols = symbolsKey ? symbolsKey.split("|") : [];
    if (!base || !activeSymbols.length) {
      setPrices({});
      setStatus({});
      return undefined;
    }

    let cancelled = false;
    const sockets = new Map();
    const retryTimers = new Map();
    const attempts = new Map();

    setStatus((current) => {
      const next = { ...current };
      activeSymbols.forEach((symbol) => {
        if (!next[symbol] || next[symbol] === "idle") next[symbol] = "connecting";
      });
      return next;
    });

    void getMarketOverview(activeSymbols)
      .then((items) => {
        if (cancelled || !Array.isArray(items)) return;
        setPrices((current) => {
          const next = { ...current };
          let changed = false;
          items.forEach((item) => {
            const symbol = String(item.symbol || "").toUpperCase();
            const price = Number(item.price);
            if (!symbol || !Number.isFinite(price) || price <= 0) return;
            if (next[symbol] == null) {
              next[symbol] = price;
              changed = true;
            }
          });
          return changed ? next : current;
        });
        setStatus((current) => {
          const next = { ...current };
          items.forEach((item) => {
            const symbol = String(item.symbol || "").toUpperCase();
            if (symbol && next[symbol] !== "live") next[symbol] = "seeded";
          });
          return next;
        });
      })
      .catch(() => {});

    const connect = (symbol) => {
      if (cancelled) return;
      const socket = new WebSocket(
        `${base.replace(/^http/, "ws")}/ws/prices?symbol=${encodeURIComponent(symbol)}`
      );
      sockets.set(symbol, socket);

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const price = Number(message.price);
          if (message.type === "price" && Number.isFinite(price) && price > 0) {
            attempts.set(symbol, 0);
            setPrices((current) =>
              current[symbol] === price ? current : { ...current, [symbol]: price }
            );
            setStatus((current) =>
              current[symbol] === "live" ? current : { ...current, [symbol]: "live" }
            );
          }
        } catch {
          // ignore
        }
      };

      socket.onerror = () => socket.close();
      socket.onclose = () => {
        if (cancelled) return;
        const attempt = attempts.get(symbol) || 0;
        attempts.set(symbol, attempt + 1);
        setStatus((current) => ({ ...current, [symbol]: "reconnecting" }));
        retryTimers.set(
          symbol,
          window.setTimeout(() => connect(symbol), Math.min(15000, 1000 * 2 ** attempt))
        );
      };
    };

    activeSymbols.forEach(connect);

    return () => {
      cancelled = true;
      retryTimers.forEach((timer) => window.clearTimeout(timer));
      sockets.forEach((socket) => {
        socket.onclose = null;
        socket.close(1000, "positions-change");
      });
    };
  }, [symbolsKey]);

  return { prices, status };
}
