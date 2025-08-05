import { useState, useEffect } from "react";
import { apiDataFetch } from "../services/apiService.js";

/**
 * Hook simple para consumir APIs
 * @param {string} url - URL del endpoint
 * @param {string} method - Método HTTP
 * @param {Object} data - Datos para POST/PUT
 * @param {Object} headers - Headers personalizados
 * @param {boolean} autoFetch - Si debe hacer fetch automáticamente
 * @returns {Object} { data, loading, error, refetch }
 */
export const useApi = (url, method = "GET", data = null, headers = {}, autoFetch = true) => {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    if (!url) return;
    
    try {
      setLoading(true);
      setError(null);
      const result = await apiDataFetch(url, method, data, headers);
      setApiData(result);
    } catch (err) {
      setError(err.message || "Error al obtener datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [url, method, autoFetch]);

  return {
    data: apiData,
    loading,
    error,
    refetch: fetchData
  };
};