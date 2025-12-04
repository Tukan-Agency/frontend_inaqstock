/**
 * Actualiza la última vela (bucket) con livePrice sin crear datos falsos.
 * Ignora precio si no es válido (>0.01).
 */
export function mergeLivePriceIntoCandles(candles = [], livePrice, nowMs, timeframe) {
  if (!Number.isFinite(livePrice) || livePrice <= 0.01 || !timeframe) return candles;

  const bucketMs = timeframeToMs(timeframe);
  if (!bucketMs) return candles;
  const bucketStart = Math.floor(nowMs / bucketMs) * bucketMs;

  const last = candles[candles.length - 1];
  if (last && last.t === bucketStart) {
    const o = last.o ?? livePrice;
    const h = Math.max(last.h ?? livePrice, livePrice);
    const l = Math.min(last.l ?? livePrice, livePrice);
    const c = livePrice;
    return [...candles.slice(0, -1), { ...last, o, h, l, c }];
  }
  // NO crear vela si la última está a futuro > bucketStart (caso datos ordenados)
  if (last && last.t > bucketStart) return candles;

  const newCandle = { t: bucketStart, o: livePrice, h: livePrice, l: livePrice, c: livePrice };
  return [...candles, newCandle];
}

function timeframeToMs(tf) {
  const { multiplier, timespan } = tf || {};
  const m = Number(multiplier);
  switch (timespan) {
    case "minute": return m * 60_000;
    case "hour": return m * 3_600_000;
    case "day": return m * 86_400_000;
    case "week": return m * 7 * 86_400_000;
    case "month": return m * 30 * 86_400_000; // aproximado
    case "year": return m * 365 * 86_400_000;
    default: return 0;
  }
}