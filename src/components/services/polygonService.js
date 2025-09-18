const API_KEY = "7ZDpKAA_vz3jIGp2T2POBDyYR_1RJ5xn";
const BASE_URL = "https://api.polygon.io/v3";
const BASE_URL_V2 = "https://api.polygon.io/v2";
const AGGS_URL = "https://api.polygon.io/v2/aggs";

export const polygonService = {
  // Obtener lista de mercados
  getMarketsList: async () => {
    try {
      const url = `${BASE_URL}/reference/tickers?market=stocks&active=true&order=asc&limit=100&sort=ticker&apiKey=${API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching markets list:", error);
      throw error;
    }
  },

  // Obtener precio de un mercado específico
  getMarketPrice: async (ticker) => {
    try {
      const url = `${AGGS_URL}/ticker/${ticker}/prev?apiKey=${API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching market price:", error);
      throw error;
    }
  },

  // Obtener snapshot de todas las criptomonedas populares
  getPopularCrypto: async () => {
    try {
      const url = `${BASE_URL_V2}/snapshot/locale/global/markets/crypto/tickers?apiKey=${API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filtrar por las más populares (mayor volumen)
      return data.tickers?.sort((a, b) => b.day?.v - a.day?.v).slice(0, 20);
    } catch (error) {
      console.error("Error fetching popular crypto:", error);
      throw error;
    }
  },

  // Obtener precios específicos de criptos populares
  getSpecificCrypto: async () => {
    try {
      const popularTickers = ['X:BTCUSD', 'X:ETHUSD', 'X:ADAUSD', 'X:SOLUSD', 'X:DOTUSD'];
      const promises = popularTickers.map(ticker => 
        fetch(`${AGGS_URL}/ticker/${ticker}/prev?apiKey=${API_KEY}`)
          .then(res => res.json())
      );
      
      return Promise.all(promises);
    } catch (error) {
      console.error("Error fetching specific crypto:", error);
      throw error;
    }
  },

  // Obtener snapshot de acciones más activas
  getPopularStocks: async () => {
    try {
      const url = `${BASE_URL_V2}/snapshot/locale/us/markets/stocks/tickers?apiKey=${API_KEY}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Ordenar por volumen para obtener las más activas
      return data.tickers?.sort((a, b) => b.day?.v - a.day?.v).slice(0, 50);
    } catch (error) {
      console.error("Error fetching popular stocks:", error);
      throw error;
    }
  },

  // Obtener precios de acciones específicas populares
  getSpecificStocks: async () => {
    try {
      const popularStocks = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'NVDA', 'META'];
      const promises = popularStocks.map(ticker => 
        fetch(`${AGGS_URL}/ticker/${ticker}/prev?apiKey=${API_KEY}`)
          .then(res => res.json())
      );
      
      return Promise.all(promises);
    } catch (error) {
      console.error("Error fetching specific stocks:", error);
      throw error;
    }
  }
};