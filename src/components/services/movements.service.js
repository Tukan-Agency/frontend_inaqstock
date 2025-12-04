import { apiDataFetch } from "./apiService.js";

const API_URL = import.meta.env.VITE_API_URL;

// Reutilizamos el mismo manejador que ya usas con apiDataFetch
async function simpleFetch(url, method = "GET", body, headers = {}) {
  return apiDataFetch(url, method, body, headers);
}

/**
 * listUserMovements
 * - Backend: GET /api/movements/client con header x-clientId
 * - UPDATE: Ahora acepta param 'mode'
 */
export async function listUserMovements(params = {}) {
  const { clientId, mode } = params || {};
  if (!clientId) throw new Error("clientId requerido");

  // Pasamos el mode en la query string. Default: 'real'
  const url = `${API_URL}/api/movements/client?mode=${mode || 'real'}`;
  const resp = await simpleFetch(url, "GET", null, { "x-clientId": clientId });

  const items = resp?.movimientos || resp?.movements || resp?.data || [];
  return items;
}

/**
 * create
 * - Backend: POST /api/movements/new
 * - Body: { clientId, clientName, requestId, type, requestDate, status, value }
 */
export async function createMovement({ clientId, clientName, requestId, type, requestDate, status = "Creado", value }) {
  const url = `${API_URL}/api/movements/new`;
  const body = {
    clientId,
    clientName,
    requestId,
    type,
    requestDate,
    status,
    value: String(value ?? ""),
  };
  const resp = await simpleFetch(url, "POST", body);
  return resp;
}

/**
 * updateStatusByRequestId
 * - Backend: POST /api/movements/update/status-by-requestId
 * - Body: { requestId, status }
 */
export async function updateMovementStatusByRequestId(requestId, status) {
  const url = `${API_URL}/api/movements/update/status-by-requestId`;
  const body = { requestId, status };
  const resp = await simpleFetch(url, "POST", body);
  return resp?.ok === true;
}