import React, { createContext, useContext, useState, useEffect } from "react";
import { SettingsService } from "../components/services/settingsService.js";

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings debe usarse dentro de un SettingsProvider");
  }
  return context;
};

// Helper corregido: Solo quita '/api' si está al final, respetando subdominios como api.dominio.com
const fixUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  
  let baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // Si la URL base termina en "/api" (ej: localhost:3000/api), lo quitamos.
  // Pero si es "https://api.midominio.com", NO lo toca.
  if (baseUrl.endsWith("/api")) {
    baseUrl = baseUrl.slice(0, -4);
  }
  
  // Evitar doble barra //
  if (baseUrl.endsWith("/") && path.startsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  } else if (!baseUrl.endsWith("/") && !path.startsWith("/")) {
    baseUrl = `${baseUrl}/`;
  }

  return `${baseUrl}${path}`;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    platformTitle: "Inversión de mercados",
    logoLight: null,
    logoDark: null,
    apiKeys: { resend: "", polygon: "", openRouter: "" }
  });
  const [loading, setLoading] = useState(true);

  // 1. Cargar ajustes al iniciar
  useEffect(() => {
    fetchSettings();
  }, []);

  // 2. Actualizar el <title> del navegador dinámicamente
  useEffect(() => {
    if (settings.platformTitle) {
      document.title = settings.platformTitle;
    }
  }, [settings.platformTitle]);

  const fetchSettings = async () => {
    try {
      const res = await SettingsService.getSettings();
      if (res.ok && res.data) {
        setSettings({
          platformTitle: res.data.platformTitle || "Inversión de mercados",
          logoLight: res.data.logoLight ? fixUrl(res.data.logoLight) : null,
          logoDark: res.data.logoDark ? fixUrl(res.data.logoDark) : null,
          apiKeys: {
            resend: res.data.resendApiKey || "",
            polygon: res.data.polygonApiKey || "",
            openRouter: res.data.openRouterApiKey || ""
          }
        });
      }
    } catch (error) {
      console.error("Error al cargar configuración global:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshSettings = () => fetchSettings();

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};