import { createMovement } from "./movements.service.js";

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

export const requestsService = {
  // Retiro
  async createWithdraw({ clientId, clientName, ibanAccount, bankName, numberAccount, requestedValue }) {
    const requestDate = new Date().toISOString();
    const payload = {
      request: {
        clientId,
        clientName,
        ibanAccount: ibanAccount || "",
        bankName,
        numberAccount: numberAccount ?? null,
        requestedValue: Number(requestedValue),
        requestStatus: "Creado",
        requestDate,
        requestType: "Retiro",
      },
    };

    // 1) Crear solicitud
    const res = await fetch(`${API_URL}/api/requests/new`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await handleJson(res); // { ok, uid }

    // 2) Crear movimiento (clave para que el usuario lo vea)
    await createMovement({
      clientId,
      clientName,
      requestId: json?.uid,
      type: "Retiro",
      requestDate,
      status: "Creado",
      value: Number(requestedValue),
    });

    return json?.uid;
  },

  // Depósito
  async createDeposit({ clientId, clientName, bankName, requestedValue }) {
    const requestDate = new Date().toISOString();
    const payload = {
      request: {
        clientId,
        clientName,
        ibanAccount: "",
        bankName,
        numberAccount: null,
        requestedValue: Number(requestedValue),
        requestStatus: "Creado",
        requestDate,
        requestType: "Deposito",
      },
    };

    // 1) Crear solicitud
    const res = await fetch(`${API_URL}/api/requests/new`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await handleJson(res);

    // 2) Crear movimiento (clave para que el usuario lo vea)
    await createMovement({
      clientId,
      clientName,
      requestId: json?.uid,
      type: "Deposito",
      requestDate,
      status: "Creado",
      value: Number(requestedValue),
    });

    return json?.uid;
  },
};