const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const BEARER_TOKEN = import.meta.env.VITE_OPENAI_API_KEY; // ✅ desde .env

// ISO 4217 más comunes (amplía si lo necesitas)
const ISO_FIAT = new Set([
  "USD","EUR","JPY","GBP","AUD","CAD","CHF","NZD","CNY","MXN",
  "SEK","NOK","DKK","ZAR","HKD","SGD","PLN","TRY","RUB","BRL",
  "INR","KRW","TWD","THB","IDR","ILS","AED","SAR","CLP","COP",
  "PEN","ARS","VND"
]);

// Sinónimos/alias cripto más comunes (amplía si lo necesitas)
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

// =====================
// Fallback 2025 (20 ítems)
// - Formato strings normalizados compatibles con Polygon
//   • Cripto: X:<BASE>USD
//   • Forex:  C:<BASE><QUOTE>
//   • Acciones: Ticker simple
// =====================
const DEFAULT_POPULAR_2025 = [
  // Crypto (10)
  "X:BTCUSD",
  "X:ETHUSD",
  "X:SOLUSD",
  "X:BNBUSD",
  "X:XRPUSD",
  "X:ADAUSD",
  "X:DOGEUSD",
  "X:AVAXUSD",
  "X:MATICUSD",
  "X:LINKUSD",

  // Stocks (8)
  "NVDA",
  "AAPL",
  "MSFT",
  "AMZN",
  "META",
  "GOOG",
  "TSLA",
  "AMD",

  // Forex (2)
  "C:EURUSD",
  "C:USDJPY",
];

// Versión detallada opcional para la UI
const DEFAULT_POPULAR_2025_DETAILED = [
  // Crypto
  { symbol: "X:BTCUSD", name: "Bitcoin", type: "crypto" },
  { symbol: "X:ETHUSD", name: "Ethereum", type: "crypto" },
  { symbol: "X:SOLUSD", name: "Solana", type: "crypto" },
  { symbol: "X:BNBUSD", name: "BNB", type: "crypto" },
  { symbol: "X:XRPUSD", name: "XRP (Ripple)", type: "crypto" },
  { symbol: "X:ADAUSD", name: "Cardano (ADA)", type: "crypto" },
  { symbol: "X:DOGEUSD", name: "Dogecoin", type: "crypto" },
  { symbol: "X:AVAXUSD", name: "Avalanche", type: "crypto" },
  { symbol: "X:MATICUSD", name: "Polygon (MATIC)", type: "crypto" },
  { symbol: "X:LINKUSD", name: "Chainlink (LINK)", type: "crypto" },

  // Stocks
  { symbol: "NVDA", name: "NVIDIA", type: "stock" },
  { symbol: "AAPL", name: "Apple", type: "stock" },
  { symbol: "MSFT", name: "Microsoft", type: "stock" },
  { symbol: "AMZN", name: "Amazon", type: "stock" },
  { symbol: "META", name: "Meta Platforms", type: "stock" },
  { symbol: "GOOG", name: "Alphabet (Class C)", type: "stock" },
  { symbol: "TSLA", name: "Tesla", type: "stock" },
  { symbol: "AMD",  name: "Advanced Micro Devices", type: "stock" },

  // Forex
  { symbol: "C:EURUSD", name: "Euro / Dólar estadounidense", type: "forex" },
  { symbol: "C:USDJPY", name: "Dólar estadounidense / Yen japonés", type: "forex" },
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

  // Quitar cotizaciones estables → USD
  b = b.replace(/USDT$/,"USD").replace(/USDC$/,"USD").replace(/BUSD$/,"USD");

  // Deduplicar USDUSD
  b = b.replace(/USDUSD$/,"USD");

  // Casos incompletos: "EUR" => "EURUSD"
  if (b.length === 3 && ISO_FIAT.has(b)) return b + "USD";

  // Si sobran letras → recorta
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
      const items = result
        .replace(/\[|\]/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const norm = items.map((x) => tryNormalizeSingleSymbol(String(x), userQuery)).filter(Boolean);
      return Array.from(new Set(norm));
    }
  }

  const single = tryNormalizeSingleSymbol(result, userQuery);
  return single || "";
}

export const searchService = {
  // Fallback detallado para UI (por si quieres mostrar nombre y tipo en una lista)
  getDefaultPopularDetailed: () => DEFAULT_POPULAR_2025_DETAILED.slice(),

  // Fallback (símbolos normalizados) – útil para usar como respuesta directa
  getDefaultPopularSymbols: () => DEFAULT_POPULAR_2025.slice(),

  searchSymbol: async (query) => {
    // Si no hay token, devolvemos directamente el fallback
    if (!BEARER_TOKEN) {
      console.warn("[searchService] VITE_OPENAI_API_KEY no configurado. Usando fallback por defecto.");
      return DEFAULT_POPULAR_2025.slice();
    }

    const systemPrompt = `Eres un asistente que devuelve símbolos compatibles con Polygon.io.

Reglas ESTRICTAS de salida:
1) Acciones (stocks): devuelve SOLO el ticker en MAYÚSCULAS (ej.: AMZN, AAPL, TSLA).
2) Criptomonedas: devuelve SOLO con prefijo X: y cotización USD (ej.: X:BTCUSD, X:ETHUSD).
   - Si el usuario usa USDT/USDC/BUSD, conviértelo a USD (ej.: BTCUSDT -> X:BTCUSD).
3) Divisas (forex): 
   - Para un par válido ISO 4217 (ej.: EURUSD, GBPJPY) devuelve SOLO con prefijo C: (ej.: C:EURUSD).
   - Si el usuario da una sola divisa ISO (ej.: EUR, JPY), por defecto devuelve C:<ISO>USD (ej.: C:EURUSD).
4) NUNCA dupliques "USD" (prohibido "EURUSDUSD" o "BTCUSDUSD").
5) Si no reconoces un mercado válido, NO devuelvas nada.
6) No agregues explicaciones ni texto adicional. Sin comillas. Sin bloques de código.
7) Formato final permitido:
   - Stocks: ^[A-Z]{1,5}$
   - Cripto: ^X:[A-Z]{2,10}USD$
   - Forex:  ^C:[A-Z]{6}$ (dos ISO 4217 concatenados)
8) Ejemplos:
   - "eurusd" -> C:EURUSD
   - "eur/usd" -> C:EURUSD
   - "eur" -> C:EURUSD
   - "btc" -> X:BTCUSD
   - "btc/usdt" -> X:BTCUSD
   - "amazon" -> AMZN
`;

    const payload = {
      model: "alibaba/tongyi-deepresearch-30b-a3b:free",
      temperature: 0,
      top_p: 0.1,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Devuélveme un símbolo compatible con Polygon.io para: ${query}` },
      ],
    };

    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BEARER_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        console.warn("[searchService] OpenRouter no OK:", response.status, response.statusText);
        return DEFAULT_POPULAR_2025.slice();
      }

      const data = await response.json();
      let raw = data?.choices?.[0]?.message?.content?.trim() || "";
      raw = cleanText(raw);

      const normalized = normalizeOutput(raw, query);

      // Si LLM no devolvió nada utilizable, regresamos el fallback por defecto
      if (!normalized || (Array.isArray(normalized) && normalized.length === 0)) {
        return DEFAULT_POPULAR_2025.slice();
      }

      // Si es array, regrésalo tal cual; si es string, devuélvelo como string
      return normalized;
    } catch (error) {
      console.error("Error searching symbol with AI:", error);
      // Fallback por defecto de 20 ítems
      return DEFAULT_POPULAR_2025.slice();
    }
  },
};