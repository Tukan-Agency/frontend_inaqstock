import { apiDataFetch } from "../services/apiService.js"; // ajusta la ruta si tu archivo real tiene otro nombre

// Actualiza el perfil del usuario autenticado
export function updateMe(payload) {
  // PUT /api/users/me
  return apiDataFetch(import.meta.env.VITE_API_URL +"/api/users/me", "PUT", payload);
}

// Cambia la contraseña del usuario autenticado
export function changeMyPassword(newPassword) {
  // POST /api/users/me/password
  return apiDataFetch(import.meta.env.VITE_API_URL + "/api/users/me/password", "POST", { newPassword });
}

// Re-obtener la sesión (si tu hook no expone refresh)
export function fetchSession() {
  return apiDataFetch(import.meta.env.VITE_API_URL +"/api/auth/session", "GET");
}