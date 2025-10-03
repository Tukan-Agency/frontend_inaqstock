import axios from "axios";

const API_BASE_URL =
  (import.meta?.env?.VITE_API_URL) ||
  (typeof process !== "undefined" ? process.env?.VITE_API_URL : "") ||
  "";

// No fijamos Content-Type global para NO forzar preflight en GET.
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Logs útiles en dev
if (import.meta?.env?.DEV) {
  api.interceptors.request.use((cfg) => {
    console.debug("[api:req]", {
      method: cfg.method,
      url: (cfg.baseURL || "") + (cfg.url || ""),
      headers: cfg.headers,
      data: cfg.data,
    });
    return cfg;
  });
  api.interceptors.response.use(
    (res) => {
      console.debug("[api:res]", {
        status: res.status,
        url: (res.config.baseURL || "") + (res.config.url || ""),
        data: res.data,
      });
      return res;
    },
    (err) => {
      console.debug("[api:err]", {
        status: err?.response?.status,
        url: (err?.config?.baseURL || "") + (err?.config?.url || ""),
        data: err?.response?.data,
      });
      return Promise.reject(err);
    }
  );
}

/**
 * Función genérica para consumir cualquier API
 */
export const apiDataFetch = async (url, method = "GET", data = null, headers = {}) => {
  try {
    const isAbsolute = /^https?:\/\//i.test(url);
    const client = isAbsolute ? axios : api;

    const upperMethod = String(method || "GET").toUpperCase();

    // No pongas Content-Type en GET/HEAD
    const computedHeaders =
      data && ["POST", "PUT", "PATCH", "DELETE"].includes(upperMethod)
        ? { Accept: "application/json", "Content-Type": "application/json", ...headers }
        : { Accept: "application/json", ...headers };

    const config = {
      url,
      method: upperMethod,
      headers: computedHeaders,
      withCredentials: true,
    };

    if (data && ["POST", "PUT", "PATCH", "DELETE"].includes(upperMethod)) {
      config.data = data;
    }

    const response = await client.request(config);
    return response.data;
  } catch (error) {
    console.error("apiDataFetch error:", error?.response?.data || error?.message || error);
    throw error;
  }
};