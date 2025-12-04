const API_KEY = import.meta.env.VITE_POLYGON_API_KEY;
const BASE = "https://api.polygon.io";

// Cache simple en memoria para evitar rate limit
const _cache = new Map();
function fromCache(key) {
  const hit = _cache.get(key);
  if (!hit) return null;
  if (hit.expireAt && Date.now() > hit.expireAt) {
    _cache.delete(key);
    return null;
  }
  return hit.data;
}
function toCache(key, data, ttlMs = 3000) {
  _cache.set(key, { data, expireAt: ttlMs ? Date.now() + ttlMs : 0 });
}

async function fetchJSON(url, { cacheKey, ttlMs } = {}) {
  if (cacheKey) {
    const cached = fromCache(cacheKey);
    if (cached) return cached;
  }
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Polygon ${res.status}: ${text || url}`);
  }
  const json = await res.json();
  if (cacheKey) toCache(cacheKey, json, ttlMs);
  return json;
}

// Detección de tipo de símbolo
function symType(symbol = "") {
  if (symbol.startsWith("X:")) return "crypto";
  if (symbol.startsWith("C:")) return "forex";
  return "stock";
}

export const polygonService = {
  // Prev close: devuelve el JSON crudo con results[0] (o,h,l,c,v)
  // Esto es lo que ya usas en MarketList.
  async getMarketPrice(symbol) {
    const url = `${BASE}/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${API_KEY}`;
    const cacheKey = `prev:${symbol}`;
    return fetchJSON(url, { cacheKey, ttlMs: 60_000 }); // 1 min de cache es suficiente para prev
  },

  // Agregados para velas (por si quieres centralizar lo del chart)
  async getAggregates({ symbol, multiplier = 1, timespan = "day", from, to, adjusted = true, sort = "asc", limit = 50000 }) {
    const url = `${BASE}/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=${adjusted}&sort=${sort}&limit=${limit}&apiKey=${API_KEY}`;
    const cacheKey = `aggs:${symbol}:${multiplier}:${timespan}:${from}:${to}:${adjusted}:${sort}:${limit}`;
    return fetchJSON(url, { cacheKey, ttlMs: 15_000 });
  },

  // Precio "en vivo" (Number). Usa los endpoints adecuados por tipo de activo.
  async getRealtimePrice(symbol) {
    const kind = symType(symbol);
    let url;
    let cacheKey;

    if (kind === "crypto") {
      // Snapshot por ticker (incluye lastTrade y lastQuote)
      url = `${BASE}/v2/snapshot/locale/global/markets/crypto/tickers/${symbol}?apiKey=${API_KEY}`;
      cacheKey = `snap:crypto:${symbol}`;
      const json = await fetchJSON(url, { cacheKey, ttlMs: 3000 });
      const t = json?.ticker;
      const price =
        t?.lastTrade?.p ??
        t?.lastQuote?.p ?? // algunos snapshots traen p (mid) o bid/ask por separado
        t?.lastQuote?.ask ??
        t?.lastQuote?.bid ??
        t?.day?.c ??
        null;
      if (price == null) throw new Error("Precio no disponible (crypto)");
      return Number(price);
    }

    if (kind === "forex") {
      // Snapshot por ticker (FX)
      url = `${BASE}/v2/snapshot/locale/global/markets/forex/tickers/${symbol}?apiKey=${API_KEY}`;
      cacheKey = `snap:forex:${symbol}`;
      const json = await fetchJSON(url, { cacheKey, ttlMs: 3000 });
      const t = json?.ticker;
      const price =
        t?.lastTrade?.p ??
        t?.lastQuote?.p ??
        t?.lastQuote?.ask ??
        t?.lastQuote?.bid ??
        t?.day?.c ??
        null;
      if (price == null) throw new Error("Precio no disponible (forex)");
      return Number(price);
    }

    // Acciones: último trade; fallback a snapshot si falla
    try {
      url = `${BASE}/v2/last/trade/${symbol}?apiKey=${API_KEY}`;
      cacheKey = `lasttrade:stock:${symbol}`;
      const json = await fetchJSON(url, { cacheKey, ttlMs: 3000 });
      const price = json?.results?.p ?? json?.last?.price ?? null;
      if (price == null) throw new Error("sin last trade");
      return Number(price);
    } catch {
      const snapUrl = `${BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${API_KEY}`;
      const json = await fetchJSON(snapUrl, { cacheKey: `snap:stock:${symbol}`, ttlMs: 3000 });
      const t = json?.ticker;
      const price =
        t?.lastTrade?.p ??
        t?.lastQuote?.p ??
        t?.lastQuote?.ask ??
        t?.lastQuote?.bid ??
        t?.day?.c ??
        null;
      if (price == null) throw new Error("Precio no disponible (stock)");
      return Number(price);
    }
  },

  // Bid/ask “vivo” (si está disponible en snapshot/last quote)
  // Devuelve { bid, ask, price } (numbers o null).
  async getRealtimeQuote(symbol) {
    const kind = symType(symbol);
    let url, cacheKey;

    if (kind === "crypto") {
      url = `${BASE}/v2/snapshot/locale/global/markets/crypto/tickers/${symbol}?apiKey=${API_KEY}`;
      cacheKey = `snapq:crypto:${symbol}`;
      const json = await fetchJSON(url, { cacheKey, ttlMs: 3000 });
      const q = json?.ticker?.lastQuote;
      const t = json?.ticker?.lastTrade;
      return {
        bid: typeof q?.bid === "number" ? q.bid : null,
        ask: typeof q?.ask === "number" ? q.ask : null,
        price: typeof t?.p === "number" ? t.p : null,
      };
    }

    if (kind === "forex") {
      url = `${BASE}/v2/snapshot/locale/global/markets/forex/tickers/${symbol}?apiKey=${API_KEY}`;
      cacheKey = `snapq:forex:${symbol}`;
      const json = await fetchJSON(url, { cacheKey, ttlMs: 3000 });
      const q = json?.ticker?.lastQuote;
      const t = json?.ticker?.lastTrade;
      return {
        bid: typeof q?.bid === "number" ? q.bid : null,
        ask: typeof q?.ask === "number" ? q.ask : null,
        price: typeof t?.p === "number" ? t.p : null,
      };
    }

    // Acciones: NBBO (bid/ask) si está disponible en tu plan
    try {
      url = `${BASE}/v2/last/nbbo/${symbol}?apiKey=${API_KEY}`;
      cacheKey = `nbbo:${symbol}`;
      const json = await fetchJSON(url, { cacheKey, ttlMs: 3000 });
      const r = json?.results || json;
      return {
        bid: typeof r?.bidPrice === "number" ? r.bidPrice : null,
        ask: typeof r?.askPrice === "number" ? r.askPrice : null,
        price: null,
      };
    } catch {
      // Fallback a snapshot
      const snapUrl = `${BASE}/v2/snapshot/locale/us/markets/stocks/tickers/${symbol}?apiKey=${API_KEY}`;
      const json = await fetchJSON(snapUrl, { cacheKey: `snapq:stock:${symbol}`, ttlMs: 3000 });
      const q = json?.ticker?.lastQuote;
      const t = json?.ticker?.lastTrade;
      return {
        bid: typeof q?.bid === "number" ? q.bid : null,
        ask: typeof q?.ask === "number" ? q.ask : null,
        price: typeof t?.p === "number" ? t.p : null,
      };
    }
  },
};