const API_URL = import.meta.env.VITE_API_URL;

async function handleJson(res) {
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : {}; } catch { throw new Error(`Respuesta no válida (${res.status})`); }
  if (!res.ok) {
    const msg = json?.msg || json?.message || json?.error || `Error HTTP: ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

export const adminRequestsService = {
  async getAll(params = {}) {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.perPage) qs.set("perPage", String(params.perPage));
    if (params.status) qs.set("status", String(params.status));
    if (params.q) qs.set("q", String(params.q));

    const url = `${API_URL}/api/admin/requests/all${qs.toString() ? `?${qs}` : ""}`;
    const res = await fetch(url, { method: "GET", credentials: "include", headers: { Accept: "application/json" } });
    const json = await handleJson(res);
    return { list: Array.isArray(json?.requests) ? json.requests : [], total: json?.total ?? 0, page: json?.page ?? 0, perPage: json?.perPage ?? 0 };
  },

  // Encadena la actualización de movimientos (por requestId) para mantener la sincronía
  async updateStatus(id, status) {
    // 1) Actualiza la solicitud
    const res = await fetch(`${API_URL}/api/admin/requests/update/status`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _id: id, status }),
    });
    await handleJson(res);

    // 2) Sincroniza movimientos por requestId
    const res2 = await fetch(`${API_URL}/api/movements/update/status-by-requestId`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id, status }),
    });
    await handleJson(res2);

    return true;
  },

  async create(requestPayload) {
    const res = await fetch(`${API_URL}/api/admin/requests/new`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload?.request ? requestPayload : { request: requestPayload }),
    });
    const json = await handleJson(res);
    return json?.uid;
  },
};