const API_BASE = (
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  (typeof process !== "undefined" &&
    process.env &&
    process.env.VITE_API_URL) ||
  ""
).replace(/\/+$/, ""); // sin / al final

function url(path) {
  // path debe empezar con '/'
  return `${API_BASE}${path}`;
}

async function jsonFetch(input, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000); // 15s

  try {
    const res = await fetch(input, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {}),
      },
      signal: controller.signal,
      ...init,
    });

    // Si el server devolvió HTML u otra cosa, intenta parsear texto
    const text = await res.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    if (!res.ok) {
      const msg = data?.message || data?.msg || res.statusText;
      throw new Error(msg || "Error de red");
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function listAllUsers() {
  // Siempre con /api delante en el path
  const data = await jsonFetch(url("/api/users/admin"), { method: "GET" });
  const arr = Array.isArray(data?.users) ? data.users : [];
  return arr.map((u) => ({
    id: u._id,
    sequenceId: u.sequenceId,
    name: u.name,
    surname: u.surname,
    email: u.email,
    currency: {
      code: u.currency?.code || u.currency?.name || "USD",
      name: u.currency?.name || "USD",
    },
    country: {
      name: u.country?.name,
      code: u.country?.code,
      flag: u.country?.flag,
    },
    address: u.address,
    contactNumber: String(u.contactNumber ?? ""),
    whatsapp: String(u.whatsapp ?? ""),
    birthday: u.birthday,
    company: u.company,
  }));
}

export async function updateUserAdmin(id, payload) {
  const body = {
    name: payload.name,
    surname: payload.surname,
    email: payload.email,
    address: payload.address,
    company: payload.company,
    contactNumber: payload.contactNumber,
    whatsapp: payload.whatsapp,
    birthday: payload.birthday,
    country: payload.country, // {name, code, flag}
    currency: {
      // backend espera currency.name
      name: payload?.currency?.name || payload?.currency?.code || "USD",
    },
  };
  if (payload.newPassword) body.newPassword = payload.newPassword;

  return jsonFetch(url(`/api/users/admin/${id}`), {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export async function deleteUserAdmin(id) {
  return jsonFetch(url(`/api/users/admin/${id}`), { method: "DELETE" });
}