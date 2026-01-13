import axios from "axios";

const API_BASE_URL =
  (import.meta?.env?.VITE_API_URL) ||
  (typeof process !== "undefined" ? process.env?.VITE_API_URL : "") ||
  "";

// 1. Crear instancia de Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Variable para guardar la función de logout
let logoutAction = null;

export const setupAxiosInterceptors = (logoutFn) => {
  logoutAction = logoutFn;
};

// 2. Interceptor de Respuesta (Manejo de sesión)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si es error 401 (Token vencido) o 403 (Prohibido)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      
      const currentPath = window.location.pathname;
      // No redirigir si ya estamos en login/registro
      if (currentPath !== "/" && currentPath !== "/register" && !currentPath.includes("reset-password")) {
        console.warn("Sesión expirada. Redirigiendo...");
        
        // Ejecutar limpieza de estado React (si existe)
        if (logoutAction) logoutAction();
        
        // Redirección forzada
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

// Logs en desarrollo
if (import.meta?.env?.DEV) {
  api.interceptors.request.use((cfg) => {
    console.debug("[api:req]", { method: cfg.method, url: cfg.url });
    return cfg;
  });
}

/**
 * 3. EXPORTAR apiDataFetch
 * Usamos la instancia 'api' para que pase por los interceptores
 */
export const apiDataFetch = async (url, method = "GET", data = null, headers = {}) => {
  try {
    const isAbsolute = /^https?:\/\//i.test(url);
    // Si es absoluta usa axios puro, si es relativa usa nuestra instancia 'api'
    const client = isAbsolute ? axios : api;

    const upperMethod = String(method || "GET").toUpperCase();

    const config = {
      url,
      method: upperMethod,
      headers: { ...headers },
      data: data
    };

    // Si usas 'api' instance, baseURL ya está configurada, no la sobreescribas si no es necesario
    
    const response = await client.request(config);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default api;