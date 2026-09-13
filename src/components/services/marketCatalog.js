const API_URL = import.meta.env.VITE_API_URL || "";

export async function searchCatalog(query = "") {
  const response = await fetch(
    `${API_URL}/api/markets/search?q=${encodeURIComponent(query.trim())}`,
    { credentials: "include", signal: AbortSignal.timeout(15000) }
  );
  if (!response.ok) throw new Error("No se pudo consultar el catálogo. Intenta nuevamente.");
  const data = await response.json();
  return data.instruments;
}

export async function getMarketOverview(symbols) {
  if (!symbols.length) return [];
  const response = await fetch(
    `${API_URL}/api/prices/overview?symbols=${encodeURIComponent(symbols.join(","))}`,
    { signal: AbortSignal.timeout(15000) }
  );
  if (!response.ok) return [];
  const data = await response.json();
  return data.prices || [];
}
