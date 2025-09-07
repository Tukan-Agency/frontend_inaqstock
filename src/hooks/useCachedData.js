import { useState, useEffect } from "react";

/**
 * Hook para manejar datos en caché utilizando localStorage.
 * @param {string} key - La clave usada en localStorage para guardar los datos.
 * @param {function} fetchDataFn - La función que devuelve los datos desde una API o fuente externa.
 * @returns {object} - { data, loading, error, setData }
 */
export default function useCachedData(key, fetchDataFn) {
  const [data, setData] = useState(() => {
    // Cargar datos desde localStorage al inicializar
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
  });

  const [loading, setLoading] = useState(!data); // Solo mostrar carga si no hay datos en caché
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!data) {
      // Si no hay datos en caché, hacer la solicitud
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const result = await fetchDataFn();
          setData(result);
          localStorage.setItem(key, JSON.stringify(result)); // Guardar en caché
        } catch (err) {
          setError(err.message || "Error al cargar los datos.");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [key, data, fetchDataFn]);

  return { data, loading, error, setData };
}