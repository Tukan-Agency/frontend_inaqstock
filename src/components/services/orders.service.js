import { apiDataFetch } from "./apiService.js";

// Usa header x-clientId (requerido por el backend old)
export async function listUserOrders(params = {}) {
  const { clientId, from, to, status, page, perPage } = params;

  if (clientId) {
    const url = `${import.meta.env.VITE_API_URL}/api/orders/client`;
    const resp = await apiDataFetch(url, "GET", null, {
      "x-clientId": clientId, // <- requerido por tu backend
    });
    return resp?.ordenes || [];
  }

  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  if (status) qs.set("status", status);
  if (page) qs.set("page", String(page));
  if (perPage) qs.set("perPage", String(perPage));

  const resp = await apiDataFetch(
    `${import.meta.env.VITE_API_URL}/api/orders${qs.toString() ? `?${qs}` : ""}`,
    "GET"
  );
  return resp?.data || resp?.orders || resp?.ordenes || [];
}