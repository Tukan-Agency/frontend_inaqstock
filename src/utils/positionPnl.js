export function isCryptoSymbol(symbol = "") {
  return String(symbol).toUpperCase().startsWith("X:");
}

export function isStockSymbol(symbol = "") {
  const s = String(symbol || "").toUpperCase();
  return Boolean(s) && !s.includes(":");
}

/** Formato de dinero del PnL: más decimales si el movimiento es chico (volúmenes bajos). */
export function formatProfitAmount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const abs = Math.abs(n);
  const digits = abs === 0 ? 2 : abs < 0.01 ? 4 : abs < 1 ? 3 : 2;
  return n.toFixed(digits);
}

export function formatProfitPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const abs = Math.abs(n);
  const digits = abs === 0 ? 2 : abs < 0.01 ? 4 : abs < 1 ? 3 : 2;
  return n.toFixed(digits);
}

/**
 * @param {object} position
 * @param {number|null|undefined} livePrice
 * @param {{ source?: string, status?: string }} options
 *
 * Skeleton solo si aún no hay cotización.
 * Con cotización siempre se calcula PnL (puede ser 0.00 legítimo).
 * El "0 al inicio" se evita en la UI esperando status live/seeded estable.
 */
export function calculatePositionPnl(position, livePrice, options = {}) {
  const price = Number(livePrice);
  const open = Number(position.openPrice);
  const quantity = Number(position.volume) || 0;
  const hasLivePrice = Number.isFinite(price) && price > 0;
  const feedStatus = options.status || options.source || null;

  // Sin precio todavía → skeleton
  if (!hasLivePrice || !open || !quantity) {
    return {
      ...position,
      currentPrice: hasLivePrice ? price : null,
      profit: null,
      profitPercentage: null,
      profitRaw: null,
      profitPctRaw: null,
      pnlReady: false,
      profitLoading: true,
      priceSource: feedStatus,
    };
  }

  // Crypto: esperar primer tick "live" del WS (no el seed REST que suele = apertura).
  // Evita el 0.00 flash inicial; no vuelve a skeleton después de ready.
  if (isCryptoSymbol(position.symbol) && feedStatus && feedStatus !== "live") {
    return {
      ...position,
      currentPrice: price,
      profit: null,
      profitPercentage: null,
      profitRaw: null,
      profitPctRaw: null,
      pnlReady: false,
      profitLoading: true,
      priceSource: feedStatus,
    };
  }

  const direction = position.type === "Venta" ? -1 : 1;
  const difference = (price - open) * direction;
  const commission = Number(position.commission) || 0;
  const swap = Number(position.swap) || 0;
  const rawProfit = difference * quantity - commission - swap;
  const rawPct = open !== 0 ? (difference / open) * 100 : 0;

  return {
    ...position,
    currentPrice: price,
    profit: formatProfitAmount(rawProfit),
    profitPercentage: formatProfitPercent(rawPct),
    profitRaw: rawProfit,
    profitPctRaw: rawPct,
    pnlReady: true,
    profitLoading: false,
    priceSource: feedStatus,
  };
}
