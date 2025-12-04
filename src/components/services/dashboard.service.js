const API_URL = import.meta.env.VITE_API_URL;

async function handleJson(res) {
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Respuesta no válida (${res.status})`);
  }
  if (!res.ok) {
    const msg = json?.msg || json?.message || json?.error || `Error HTTP: ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export const dashboardService = {
  // params: { range | from, to }
  async getOverview(params = {}) {
    const qs = new URLSearchParams();
    if (params.range) qs.set("range", String(params.range));
    if (params.from) qs.set("from", String(params.from));
    if (params.to) qs.set("to", String(params.to));

    const url = `${API_URL}/api/dashboard/overview${qs.toString() ? `?${qs}` : ""}`;
    const res = await fetch(url, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    const json = await handleJson(res);

    return {
      totalUsers: json?.totalUsers ?? 0,
      totalRequests: json?.totalRequests ?? 0,
      totalMovements: json?.totalMovements ?? 0,
      countries: Array.isArray(json?.countries) ? json.countries : [],
    };
  },
};