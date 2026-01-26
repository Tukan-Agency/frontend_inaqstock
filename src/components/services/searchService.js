// ✅ YA NO llamamos a OpenAI desde el frontend (CORS + seguridad).
// Ahora llamamos a tu backend: POST /api/ai/search-symbol

// --- CLAVE DEL CACHÉ EN LOCALSTORAGE ---
const CACHE_KEY = "inaqstock_search_cache_v1";

// --- SISTEMA DE CACHÉ ---
const getCache = () => {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    return {};
  }
};

const saveToCache = (query, result) => {
  try {
    const cache = getCache();
    cache[query.toLowerCase().trim()] = result;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Error guardando caché", e);
  }
};

// ISO 4217 más comunes
const ISO_FIAT = new Set([
  "USD","EUR","JPY","GBP","AUD","CAD","CHF","NZD","CNY","MXN",
  "SEK","NOK","DKK","ZAR","HKD","SGD","PLN","TRY","RUB","BRL",
  "INR","KRW","TWD","THB","IDR","ILS","AED","SAR","CLP","COP",
  "PEN","ARS","VND"
]);

// Sinónimos/alias cripto
const CRYPTO_SYNONYMS = {
  btc: "BTC", bitcoin: "BTC",
  eth: "ETH", ethereum: "ETH",
  sol: "SOL", solana: "SOL",
  doge: "DOGE", dogecoin: "DOGE",
  ada: "ADA", cardano: "ADA",
  xrp: "XRP", ripple: "XRP",
  ltc: "LTC", litecoin: "LTC",
  bnb: "BNB",
  trx: "TRX", tron: "TRX",
  avax: "AVAX",
  matic: "MATIC", polygon: "MATIC",
  dot: "DOT", polkadot: "DOT",
  link: "LINK", chainlink: "LINK"
};

// Fallback 2025 (20 ítems)
const DEFAULT_POPULAR_2025 = [
  "X:BTCUSD", "X:ETHUSD", "X:SOLUSD", "X:BNBUSD", "X:XRPUSD",
  "X:ADAUSD", "X:DOGEUSD", "X:AVAXUSD", "X:MATICUSD", "X:LINKUSD",
  "NVDA", "AAPL", "MSFT", "AMZN", "META", "GOOG", "TSLA", "AMD",
  "C:EURUSD", "C:USDJPY",
];

// Helpers de normalización
function cleanText(s) {
  return (s || "")
    .replace(/<\|begin_of_sentence\|>|<\|end_of_sentence\|>/gi, "")
    .replace(/\|/g, "")
    .replace(/[\u0000-\u001F]+/g, "")
    .replace(/“|”/g, '"')
    .replace(/‘|’/g, "'")
    .replace(/```json|```/g, "")
    .trim();
}

function looksLikeSixFiatPair(str) {
  return /^[A-Z]{6}$/.test(str) && ISO_FIAT.has(str.slice(0,3)) && ISO_FIAT.has(str.slice(3,6));
}

function normalizeFiatPairBody(body) {
  let b = (body || "").toUpperCase().replace(/[^A-Z]/g, "");
  b = b.replace(/USDT$/,"USD").replace(/USDC$/,"USD").replace(/BUSD$/,"USD");
  b = b.replace(/USDUSD$/,"USD");

  if (b.length === 3 && ISO_FIAT.has(b)) return b + "USD";

  if (b.length > 6 && /^[A-Z]+$/.test(b)) {
    if (b.endsWith("USD")) {
      const base = b.slice(0, b.length - 3);
      const last3 = base.slice(-3);
      if (ISO_FIAT.has(last3)) return last3 + "USD";
    }
    b = b.slice(0, 6);
  }

  if (/^[A-Z]{6}$/.test(b)) {
    return b;
  }
  return "";
}

function normalizeCryptoBody(body) {
  let b = (body || "").toUpperCase().replace(/[^A-Z]/g, "");
  b = b.replace(/USDT$/,"USD").replace(/USDC$/,"USD").replace(/BUSD$/,"USD");
  b = b.replace(/USDUSD$/,"USD");

  if (/^[A-Z]{2,10}$/.test(b) && !b.endsWith("USD")) {
    b = b + "USD";
  }

  if (!/^[A-Z]{2,10}USD$/.test(b)) {
    return "";
  }
  return b;
}

function inferIfCryptoFromQuery(query) {
  const q = (query || "").toLowerCase();
  for (const key of Object.keys(CRYPTO_SYNONYMS)) {
    if (q.includes(key)) return CRYPTO_SYNONYMS[key];
  }
  return "";
}

function tryNormalizeSingleSymbol(raw, userQuery) {
  let s = cleanText(raw).toUpperCase().replace(/["'\[\]\s]/g, "");

  if (!s) return "";

  if (s.includes(":")) {
    const [prefixRaw, restRaw] = s.split(":");
    const prefix = (prefixRaw || "").toUpperCase();
    const rest = (restRaw || "").toUpperCase();

    if (prefix === "C") {
      const body = normalizeFiatPairBody(rest);
      return body ? `C:${body}` : "";
    }
    if (prefix === "X") {
      const body = normalizeCryptoBody(rest);
      return body ? `X:${body}` : "";
    }
    s = rest;
  }

  if (looksLikeSixFiatPair(s)) {
    return `C:${s}`;
  }

  if (/^[A-Z]{3}$/.test(s) && ISO_FIAT.has(s)) {
    return `C:${s}USD`;
  }

  if (/^[A-Z]{4,10}USD$/.test(s)) {
    const base = s.slice(0, -3);
    if (base.length === 3 && ISO_FIAT.has(base)) {
      return `C:${s}`;
    }
    return `X:${normalizeCryptoBody(s) || base + "USD"}`;
  }

  const maybeCrypto = CRYPTO_SYNONYMS[s.toLowerCase?.()] || CRYPTO_SYNONYMS[(s || "").toLowerCase()];
  if (maybeCrypto || inferIfCryptoFromQuery(userQuery)) {
    const base = (maybeCrypto || s).toUpperCase().replace(/[^A-Z]/g, "");
    const body = normalizeCryptoBody(base + "USD");
    return body ? `X:${body}` : "";
  }

  if (/^[A-Z]{1,5}$/.test(s)) {
    return s; // acción
  }

  return "";
}

function normalizeOutput(result, userQuery) {
  if (result.startsWith("[") && result.endsWith("]")) {
    try {
      const parsed = JSON.parse(result);
      if (Array.isArray(parsed)) {
        const norm = parsed
          .map((x) => tryNormalizeSingleSymbol(String(x), userQuery))
          .filter(Boolean);
        return Array.from(new Set(norm));
      }
    } catch {
      const items = result.replace(/\[|\]/g, "").split(",").map((s) => s.trim()).filter(Boolean);
      const norm = items.map((x) => tryNormalizeSingleSymbol(String(x), userQuery)).filter(Boolean);
      return Array.from(new Set(norm));
    }
  }
  const single = tryNormalizeSingleSymbol(result, userQuery);
  return single || "";
}

export const searchService = {
  getDefaultPopularDetailed: () => [],
  getDefaultPopularSymbols: () => DEFAULT_POPULAR_2025.slice(),

  searchSymbol: async (query) => {
    // 1. Validar input vacío
    if (!query || !query.trim()) return DEFAULT_POPULAR_2025.slice();

    const normalizedQuery = query.toLowerCase().trim();

    // 2. CHECK CACHÉ: ¿Ya buscamos esto antes?
    const cache = getCache();
    if (cache[normalizedQuery]) {
      console.log(`[Cache Hit] Recuperado desde local: "${query}" ->`, cache[normalizedQuery]);
      return cache[normalizedQuery];
    }

    // 3. Llamar a BACKEND (sin CORS)
    const base = import.meta.env.VITE_API_URL;
    if (!base) {
      console.warn("[searchService] VITE_API_URL faltante.");
      return DEFAULT_POPULAR_2025.slice();
    }

    try {
      const response = await fetch(`${base}/api/ai/search-symbol`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        console.warn("[searchService] backend /api/ai/search-symbol error:", response.status);
        return DEFAULT_POPULAR_2025.slice();
      }

      const data = await response.json();
      let raw = data?.data?.content?.trim() || "";
      raw = cleanText(raw);

      const normalized = normalizeOutput(raw, query);

      // Guardar en caché si es válido
      if (normalized && (typeof normalized === "string" || normalized.length > 0)) {
        saveToCache(normalizedQuery, normalized);
      }

      if (!normalized || (Array.isArray(normalized) && normalized.length === 0)) {
        return DEFAULT_POPULAR_2025.slice();
      }

      return normalized;
    } catch (error) {
      console.error("Error searching symbol:", error);
      return DEFAULT_POPULAR_2025.slice();
    }
  },
};