import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const SettingsService = {
  getBranding: async () => {
    const response = await axios.get(`${API_URL}/api/settings/branding`, {
      withCredentials: true,
    });
    return response.data;
  },

  getSettings: async () => {
    const response = await axios.get(`${API_URL}/api/settings`, {
      withCredentials: true,
    });
    return response.data;
  },

  updateSettings: async (formData) => {
    let logoResponse = null;
    let textResponse = null;

    const lightFile = formData.get("logoLight");
    const darkFile = formData.get("logoDark");

    if ((lightFile && lightFile instanceof File) || (darkFile && darkFile instanceof File)) {
      const logoData = new FormData();
      if (lightFile instanceof File) logoData.append("logoLight", lightFile);
      if (darkFile instanceof File) logoData.append("logoDark", darkFile);

      logoResponse = await axios.post(`${API_URL}/api/settings/upload-logo`, logoData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
    }

    const payload = {
      platformTitle: formData.get("platformTitle"),
      logoSize: formData.get("logoSize"),
      logoSizeUnit: formData.get("logoSizeUnit"),
      resendApiKey: formData.get("resendApiKey"),
      polygonApiKey: formData.get("polygonApiKey"),
      openRouterApiKey: formData.get("openRouterApiKey"),
      smtpHost: formData.get("smtpHost"),
      smtpPort: formData.get("smtpPort"),
      smtpUser: formData.get("smtpUser"),
      smtpPass: formData.get("smtpPass"),
      emailFrom: formData.get("emailFrom"),
    };

    textResponse = await axios.post(`${API_URL}/api/settings/update`, payload, {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    });

    return {
      ok: true,
      data: {
        ...(textResponse.data?.data || {}),
        ...(logoResponse?.data?.data || {}),
        logoLight: logoResponse?.data?.logoLight || textResponse.data?.data?.logoLight,
        logoDark: logoResponse?.data?.logoDark || textResponse.data?.data?.logoDark,
      },
    };
  },
};

export const IncidentsService = {
  list: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/api/incidents${query ? `?${query}` : ""}`, {
      withCredentials: true,
    });
    return response.data;
  },
  health: async () => {
    const response = await axios.get(`${API_URL}/api/incidents/health`, {
      withCredentials: true,
    });
    return response.data;
  },
  checkPolygon: async () => {
    const response = await axios.post(`${API_URL}/api/incidents/health/polygon`, {}, {
      withCredentials: true,
    });
    return response.data;
  },
  checkSmtp: async () => {
    const response = await axios.post(`${API_URL}/api/incidents/health/smtp`, {}, {
      withCredentials: true,
    });
    return response.data;
  },
  resolve: async (id) => {
    const response = await axios.post(`${API_URL}/api/incidents/${id}/resolve`, {}, {
      withCredentials: true,
    });
    return response.data;
  },
};
