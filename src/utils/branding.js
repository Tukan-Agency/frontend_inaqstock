const CACHE_KEY = "platform-branding-v1";

export function getApiBase() {
  let baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
  if (baseUrl.endsWith("/api")) baseUrl = baseUrl.slice(0, -4);
  return baseUrl.replace(/\/$/, "");
}

export function fixAssetUrl(path) {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("blob:")) return path;
  const base = getApiBase();
  if (path.startsWith("/")) return `${base}${path}`;
  return `${base}/${path}`;
}

export function readBrandingCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      platformTitle: parsed.platformTitle || "Nydaqstock",
      logoLight: parsed.logoLight || null,
      logoDark: parsed.logoDark || null,
      logoSize: Number(parsed.logoSize) || 100,
      logoSizeUnit: parsed.logoSizeUnit === "%" ? "%" : "px",
      updatedAt: parsed.updatedAt || 0,
    };
  } catch {
    return null;
  }
}

export function writeBrandingCache(data) {
  try {
    const payload = {
      platformTitle: data.platformTitle || "Nydaqstock",
      logoLight: data.logoLight ? fixAssetUrl(data.logoLight) : null,
      logoDark: data.logoDark ? fixAssetUrl(data.logoDark) : null,
      logoSize: Number(data.logoSize) || 100,
      logoSizeUnit: data.logoSizeUnit === "%" ? "%" : "px",
      updatedAt: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    return payload;
  } catch {
    return null;
  }
}

export function defaultBrandingUrls() {
  const base = getApiBase();
  return {
    logoLight: `${base}/branding/logo-light.png`,
    logoDark: `${base}/branding/logo-dark.png`,
  };
}

export function resolveLogoSrc({ isDark, settings }) {
  const cache = readBrandingCache();
  const defaults = defaultBrandingUrls();
  if (isDark) {
    return (
      settings?.logoDark ||
      cache?.logoDark ||
      settings?.logoLight ||
      cache?.logoLight ||
      defaults.logoDark
    );
  }
  return (
    settings?.logoLight ||
    cache?.logoLight ||
    settings?.logoDark ||
    cache?.logoDark ||
    defaults.logoLight
  );
}
