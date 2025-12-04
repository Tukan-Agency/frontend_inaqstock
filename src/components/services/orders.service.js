import { apiDataFetch } from "./apiService.js";

const API = import.meta.env.VITE_API_URL || "";

// Usa header x-clientId (requerido por el backend)
// UPDATE: Ahora acepta 'mode' en params
export async function listUserOrders(params = {}) {
  const { clientId, from, to, status, page, perPage, mode } = params;

  if (clientId) {
    // Añadimos el modo a la query string. Por defecto 'real'.
    const url = `${API}/api/orders/client?mode=${mode || 'real'}`;
    const resp = await apiDataFetch(url, "GET", null, {
      "x-clientId": String(clientId), // <- requerido por tu backend
    });
    return resp?.ordenes || [];
  }

  // Listado general (opcional). El backend expone /api/orders/all
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  if (status) qs.set("status", status);
  if (page) qs.set("page", String(page));
  if (perPage) qs.set("perPage", String(perPage));

  const url = `${API}/api/orders/all${qs.toString() ? `?${qs}` : ""}`;
  const resp = await apiDataFetch(url, "GET");
  // Compat con diferentes nombres de campo
  return resp?.ordenes || resp?.orders || resp?.data || [];
}

// Crear orden (legacy-compat: el backend acepta body.orden)
export async function createOrder(orden) {
  const url = `${API}/api/orders/new`;
  return apiDataFetch(url, "POST", { orden });
}

// Actualizar acciones y fecha (PUT /update)
export async function updateOrderActions({ _id, operationActions, operationDate }) {
  const url = `${API}/api/orders/update`;
  const body = { _id, operationActions };
  if (operationDate) body.operationDate = operationDate;
  return apiDataFetch(url, "PUT", body);
}

// Actualizar estado simple (POST /update/status)
export async function updateOrderStatus({ _id, status }) {
  const url = `${API}/api/orders/update/status`;
  return apiDataFetch(url, "POST", { _id, status });
}

// Finalizar con valor (si más adelante lo usas como en el proyecto viejo)
export async function updateOrderStatusEnd({ _id, status, operationValue, operationActions, isWithdrawl, isCapital }) {
  const url = `${API}/api/orders/update/status/end`;
  const body = { _id, status };
  if (typeof operationValue === "number") body.operationValue = operationValue;
  if (Array.isArray(operationActions)) body.operationActions = operationActions;
  if (typeof isWithdrawl === "boolean") body.isWithdrawl = isWithdrawl;
  if (typeof isCapital === "boolean") body.isCapital = isCapital;
  return apiDataFetch(url, "POST", body);
}

// Eliminar orden
export async function deleteOrderById(id) {
  const url = `${API}/api/orders/delete/${id}`;
  return apiDataFetch(url, "DELETE");
}