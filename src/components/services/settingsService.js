import axios from "axios";

// Detectamos URL base
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const SettingsService = {
  // Obtener ajustes
  getSettings: async () => {
    const response = await axios.get(`${API_URL}/api/settings`, { 
      withCredentials: true 
    });
    return response.data;
  },

  // Actualizar ajustes: Orquesta la subida de logo y la actualización de texto por separado
  // para coincidir con tus rutas del backend (/upload-logo y /update)
   updateSettings: async (formData) => {
    let logoResponse = null;
    let textResponse = null;

    // 1. Manejo de Logos
    const lightFile = formData.get('logoLight');
    const darkFile = formData.get('logoDark');

    // Si hay al menos un archivo, hacemos la petición de subida
    if ((lightFile && lightFile instanceof File) || (darkFile && darkFile instanceof File)) {
      const logoData = new FormData();
      if (lightFile instanceof File) logoData.append('logoLight', lightFile);
      if (darkFile instanceof File) logoData.append('logoDark', darkFile);
      
      logoResponse = await axios.post(`${API_URL}/api/settings/upload-logo`, logoData, {
         withCredentials: true,
         headers: { "Content-Type": "multipart/form-data" }
      });
    }

    // 2. Actualizamos los textos (Título, API Keys) en la ruta de datos
    // Extraemos los valores del FormData para enviarlos como JSON
    const payload = {
      platformTitle: formData.get('platformTitle'),
      resendApiKey: formData.get('resendApiKey'),
      polygonApiKey: formData.get('polygonApiKey'),
      openRouterApiKey: formData.get('openRouterApiKey'),
    };

    // Llamamos a POST /api/settings/update
    textResponse = await axios.post(`${API_URL}/api/settings/update`, payload, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" }
    });

    // 3. Combinamos las respuestas para el frontend
    return {
      ok: true,
      data: {
        ...(textResponse.data?.data || {}),
        ...(logoResponse?.data?.logoUrl ? { logoUrl: logoResponse.data.logoUrl } : {})
      }
    };
  },
};