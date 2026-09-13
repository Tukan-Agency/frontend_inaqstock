import { useState, useEffect } from "react";

export default function useCachedApi(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    setLoading(true);
    setError(null);

    // Usar url como clave de cache
    const cacheKey = `cached-${url}`;

    // Verificar cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setData(JSON.parse(cached));
      setLoading(false);
      return;
    }

    // Si no hay cache, hacer fetch
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Error en la API");
        return res.json();
      })
      .then((json) => {
        setData(json);
        localStorage.setItem(cacheKey, JSON.stringify(json));
      })
      .catch((err) => setError(err.message || "Error"))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}