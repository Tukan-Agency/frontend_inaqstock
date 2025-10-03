import { apiDataFetch } from "./apiService.js";

 

/**
 * listUserMovements (backend old)
 * - Requiere header x-clientId en GET /api/movements/clientId
 */
export async function listUserMovements(params = {}) {
  const { clientId, from, to, type, page, perPage } = params || {};
  if (!clientId) throw new Error("clientId requerido");

  const url = `${import.meta.env.VITE_API_URL}/api/movements/clientId`; // <- aquí el fix

  const resp = await apiDataFetch(url, "GET", null, {
    "x-clientId": clientId,
  });

  // El backend devuelve { ok: true, movimientos: [...] }
  const items = resp?.movimientos || resp?.movements || resp?.data || [];
  return items;
}