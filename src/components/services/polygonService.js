const API_KEY = "MF98h8vorj239xqQzHGEgjZ4JefrmFOj";
const BASE_URL = "https://api.polygon.io/v3";
const AGGS_URL = "https://api.polygon.io/v2/aggs";

export const polygonService = {
  // Obtener lista de mercados
  getMarketsList: async () => {
    try {
      const url = `${BASE_URL}/reference/tickers?active=true&limit=100&apiKey=${API_KEY}`;
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
  }
};