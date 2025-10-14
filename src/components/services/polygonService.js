const API_KEY = import.meta.env.VITE_POLYGON_API_KEY; // ✅ desde .env

const BASE_URL = "https://api.polygon.io/v3";
const BASE_URL_V2 = "https://api.polygon.io/v2";
const AGGS_URL = "https://api.polygon.io/v2/aggs";

const getTodayDateKey = () => {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
};

const setLocalData = (key, data) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const getLocalData = (key) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export const polygonService = {
  // Obtener lista de mercados con caché diaria
  getMarketsList: async () => {
    const cacheKey = "markets-cache";
    const dateKey = "markets-date";
    const todayKey = getTodayDateKey();

    const cachedData = getLocalData(cacheKey);
    const cachedDate = getLocalData(dateKey);

    if (cachedData && cachedDate === todayKey) {
      return cachedData;
    }

    try {
      const url = `${BASE_URL}/reference/tickers?market=stocks&active=true&order=asc&limit=1000&sort=ticker&apiKey=${API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setLocalData(cacheKey, data);
      setLocalData(dateKey, todayKey);
      return data;
    } catch (error) {
      console.error("Error fetching markets list:", error);
      throw error;
    }
  },

  // Obtener snapshot de criptomonedas populares con caché diaria
  getPopularCrypto: async () => {
    const cacheKey = "crypto-cache";
    const dateKey = "crypto-date";
    const todayKey = getTodayDateKey();

    const cachedData = getLocalData(cacheKey);
    const cachedDate = getLocalData(dateKey);

    if (cachedData && cachedDate === todayKey) {
      return cachedData;
    }

    try {
      const url = `${BASE_URL_V2}/snapshot/locale/global/markets/crypto/tickers?apiKey=${API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const sortedData = data.tickers
        ?.sort((a, b) => b.day?.v - a.day?.v)
        .slice(0, 30);

      setLocalData(cacheKey, sortedData);
      setLocalData(dateKey, todayKey);
      return sortedData;
    } catch (error) {
      console.error("Error fetching popular crypto:", error);
      throw error;
    }
  },

  // Obtener precio de un mercado específico (Crypto, Forex o Stocks)
  getMarketPrice: async (ticker) => {
    try {
      const clean = ticker.replace(/^X:/, "").replace(/^C:/, "");
      let url = "";

      // --- Crypto (global) ---
      if (ticker.startsWith("X:")) {
        url = `${BASE_URL_V2}/snapshot/locale/global/markets/crypto/tickers/${ticker}?apiKey=${API_KEY}`;
      }
      // --- Forex ---
      else if (ticker.startsWith("C:")) {
        url = `${BASE_URL_V2}/snapshot/locale/global/markets/forex/tickers/${ticker}?apiKey=${API_KEY}`;
      }
      // --- Stocks (US) ---
      else {
        url = `${BASE_URL_V2}/snapshot/locale/us/markets/stocks/tickers/${clean}?apiKey=${API_KEY}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! ${response.status}`);

      const data = await response.json();

      // --- Normalización universal ---
      if (data.ticker) {
        const t = data.ticker;
        const current = t.lastTrade?.p || t.day?.c || 0;
        const open = t.day?.o || t.prevDay?.o || current;
        const change =
          open && current ? (((current - open) / open) * 100).toFixed(2) : "0.00";

        return {
          price: current, // ✅ clave para MarketTradePanel
          results: [
            {
              c: current,
              o: open,
              v: t.day?.v || 0,
              h: t.day?.h,
              l: t.day?.l,
            },
          ],
          bid: t.lastQuote?.p || current,
          ask: t.lastTrade?.p || current,
          change,
        };
      }

      return data;
    } catch (error) {
      console.error("Error fetching market price:", error);
      return { results: [], bid: 0, ask: 0, change: "0.00" };
    }
  },
};
