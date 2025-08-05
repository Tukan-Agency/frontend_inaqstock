import axios from "axios";

/**
 * Función genérica para consumir cualquier API
 * @param {string} url - URL completa del endpoint
 * @param {string} method - Método HTTP (GET, POST, PUT, DELETE, etc.)
 * @param {Object} data - Datos para enviar (body para POST/PUT)
 * @param {Object} headers - Headers personalizados
 * @returns {Promise<any>} Respuesta de la API
 */
export const apiDataFetch = async (url, method = "GET", data = null, headers = {}) => {
  try {
    const config = {
      url,
      method: method.toUpperCase(),
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    // Solo agregar data si es necesario
    if (data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error en apiDataFetch:`, error);
    throw error;
  }
};