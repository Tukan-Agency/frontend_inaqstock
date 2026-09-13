import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { SettingsService } from "../components/services/settingsService.js";
import {
  defaultBrandingUrls,
  fixAssetUrl,
  readBrandingCache,
  writeBrandingCache,
} from "../utils/branding.js";

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings debe usarse dentro de un SettingsProvider");
  }
  return context;
};

const cached = readBrandingCache();
const defaults = defaultBrandingUrls();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    platformTitle: cached?.platformTitle || "Nydaqstock",
    logoLight: cached?.logoLight || defaults.logoLight,
    logoDark: cached?.logoDark || defaults.logoDark,
    logoSize: cached?.logoSize || 100,
    logoSizeUnit: cached?.logoSizeUnit || "px",
    apiKeys: { resend: "", polygon: "", openRouter: "" },
    smtp: { host: "", port: 465, user: "", pass: "", from: "" },
  });
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    fetchBranding();
  }, []);

  useEffect(() => {
    if (settings.platformTitle) {
      document.title = settings.platformTitle;
    }
    const favicon = document.querySelector("link[rel='icon']");
    if (favicon && settings.logoLight) {
      favicon.setAttribute("href", settings.logoLight);
    }
  }, [settings.platformTitle, settings.logoLight]);

  const applyBranding = (data) => {
    const logoLight = data.logoLight ? fixAssetUrl(data.logoLight) : defaults.logoLight;
    const logoDark = data.logoDark ? fixAssetUrl(data.logoDark) : defaults.logoDark;
    const platformTitle = data.platformTitle || "Nydaqstock";
    const logoSize = Number(data.logoSize) || 100;
    const logoSizeUnit = data.logoSizeUnit === "%" ? "%" : "px";
    writeBrandingCache({ platformTitle, logoLight, logoDark, logoSize, logoSizeUnit });
    setSettings((prev) => ({
      ...prev,
      platformTitle,
      logoLight,
      logoDark,
      logoSize,
      logoSizeUnit,
    }));
  };

  const fetchBranding = async () => {
    try {
      const res = await SettingsService.getBranding();
      if (res.ok && res.data) applyBranding(res.data);
    } catch (error) {
      console.error("Error al cargar branding:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await SettingsService.getSettings();
      if (res.ok && res.data) {
        applyBranding(res.data);
        setSettings((prev) => ({
          ...prev,
          platformTitle: res.data.platformTitle || prev.platformTitle,
          logoLight: res.data.logoLight ? fixAssetUrl(res.data.logoLight) : prev.logoLight,
          logoDark: res.data.logoDark ? fixAssetUrl(res.data.logoDark) : prev.logoDark,
          logoSize: Number(res.data.logoSize) || prev.logoSize || 100,
          logoSizeUnit: res.data.logoSizeUnit === "%" ? "%" : "px",
          apiKeys: {
            resend: res.data.resendApiKey || "",
            polygon: res.data.polygonApiKey || "",
            openRouter: res.data.openRouterApiKey || "",
          },
          smtp: {
            host: res.data.smtpHost || "",
            port: res.data.smtpPort || 465,
            user: res.data.smtpUser || "",
            pass: res.data.smtpPass || "",
            from: res.data.emailFrom || "",
          },
        }));
      }
    } catch (error) {
      console.error("Error al cargar configuración global:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      settings,
      loading,
      refreshSettings: fetchSettings,
      refreshBranding: fetchBranding,
    }),
    [settings, loading]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
