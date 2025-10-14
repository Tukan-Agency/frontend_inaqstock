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
    const msg = json?.message || json?.error || `Error HTTP: ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

// Usuario
export async function getMyVerification() {
  const res = await fetch(`${API_URL}/api/verification/me`, {
    method: "GET",
    credentials: "include",
  });
  const json = await handleJson(res);
  return json?.data;
}

export async function uploadMyDocument(docType, file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}/api/verification/documents/${docType}`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const json = await handleJson(res);
  return json?.data;
}

// Admin
export async function adminListRequests() {
  const res = await fetch(`${API_URL}/api/verification/admin/requests`, {
    method: "GET",
    credentials: "include",
  });
  const json = await handleJson(res);
  return json?.data || [];
}

export async function adminGetUserVerification(userId) {
  const res = await fetch(`${API_URL}/api/verification/admin/${userId}`, {
    method: "GET",
    credentials: "include",
  });
  const json = await handleJson(res);
  return json?.data;
}

export async function adminUploadDocument(userId, docType, file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_URL}/api/verification/admin/${userId}/documents/${docType}/upload`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const json = await handleJson(res);
  return json?.data;
}

export async function adminApproveDocument(userId, docType) {
  const res = await fetch(`${API_URL}/api/verification/admin/${userId}/documents/${docType}/approve`, {
    method: "PUT",
    credentials: "include",
  });
  const json = await handleJson(res);
  return json?.data;
}

export async function adminRejectDocument(userId, docType) {
  const res = await fetch(`${API_URL}/api/verification/admin/${userId}/documents/${docType}/reject`, {
    method: "PUT",
    credentials: "include",
  });
  const json = await handleJson(res);
  return json?.data;
}

export async function adminSetGlobal(userId, verified) {
  const res = await fetch(`${API_URL}/api/verification/admin/${userId}/global`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ verified }),
  });
  const json = await handleJson(res);
  return json?.data;
}