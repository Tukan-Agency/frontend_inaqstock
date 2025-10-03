import { apiDataFetch } from "./apiService.js";

// GET /api/orders/client (requiere header x-clientId)
export async function getOrdersByClient(clientId) {
  const resp = await apiDataFetch(`/api/orders/client`, "GET", null, {
    "x-clientId": clientId,
  });
  // Old responde { ok: true, ordenes: [...] }
  return resp?.ordenes || [];
}

export async function getAllOrders() {
  const resp = await apiDataFetch(`/api/orders/all`, "GET");
  return resp?.ordenes || [];
}

export async function createOrder(payload) {
  // El old espera { orden: {...} }
  return apiDataFetch(`/api/orders/new`, "POST", { orden: payload });
}

export async function updateOrder(doc) {
  return apiDataFetch(`/api/orders/update`, "PUT", doc);
}

export async function updateOrderStatus(id, status) {
  return apiDataFetch(`/api/orders/update/status`, "POST", { _id: id, status });
}

export async function updateOrderStatusEnd(id, status, operationValue, operationActions) {
  return apiDataFetch(`/api/orders/update/status/end`, "POST", {
    _id: id,
    status,
    operationValue,
    operationActions,
  });
}

export async function deleteOrderById(id) {
  return apiDataFetch(`/api/orders/delete/${id}`, "DELETE");
}