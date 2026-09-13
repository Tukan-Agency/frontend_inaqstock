import { useState, useEffect } from "react";

export default function useCachedApi(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;

    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);

    // Usar url como clave de cache
    const cacheKey = `cached-${url}`;

    // Verificar cache
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        setData(JSON.parse(cached));
        setLoading(false);
        return () => controller.abort();
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }

    // Si no hay cache, hacer fetch
    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("No pudimos cargar la información del mercado.");
        return res.json();
      })
      .then((json) => {
        setData(json);
        localStorage.setItem(cacheKey, JSON.stringify(json));
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message || "No pudimos cargar la información.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [url]);

  return { data, loading, error };
}
