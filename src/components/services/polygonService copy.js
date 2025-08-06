const API_KEY = "MF98h8vorj239xqQzHGEgjZ4JefrmFOj";
const BASE_URL = "https://api.polygon.io/v3";
const AGGS_URL = "https://api.polygon.io/v2/aggs";

export const polygonService = {
  // Obtener lista de mercados
 getAllMarkets: async (onProgress = () => {}) => {
    try {
      let allResults = [];
      let nextUrl = `${BASE_URL}/reference/tickers?market=stocks&active=true&order=asc&limit=100&sort=ticker&apiKey=${API_KEY}`;
      let page = 1;

      while (nextUrl) {
        const response = await fetch(nextUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        allResults = [...allResults, ...data.results];
        
        // Informar del progreso
        onProgress({
          currentCount: allResults.length,
          page: page,
          totalSoFar: allResults.length
        });

        // Preparar siguiente página si existe
        if (data.next_url) {
          nextUrl = `${data.next_url}&apiKey=${API_KEY}`;
          page++;
        } else {
          nextUrl = null;
        }

        // Opcional: añadir un pequeño delay para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return {
        status: "OK",
        results: allResults,
        count: allResults.length
      };
    } catch (error) {
      console.error("Error fetching all markets:", error);
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