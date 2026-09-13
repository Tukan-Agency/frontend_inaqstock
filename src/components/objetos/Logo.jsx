import { useMemo, useState } from "react";
import useDarkMode from "use-dark-mode";
import { useSettings } from "../../context/SettingsContext.jsx";
import { defaultBrandingUrls, readBrandingCache, resolveLogoSrc } from "../../utils/branding.js";

export default function Logo({ size, width, height, className, useConfig = true }) {
  const { settings } = useSettings();
  const darkMode = useDarkMode();
  const isDark = darkMode.value;
  const defaults = defaultBrandingUrls();
  const [failed, setFailed] = useState(false);
  const cache = readBrandingCache();

  const imageSrc = useMemo(() => {
    if (failed) return isDark ? defaults.logoDark : defaults.logoLight;
    return resolveLogoSrc({ isDark, settings });
  }, [failed, isDark, settings, defaults.logoDark, defaults.logoLight]);

  const configuredSize = Number(settings?.logoSize ?? cache?.logoSize ?? 100) || 100;
  const configuredUnit = (settings?.logoSizeUnit || cache?.logoSizeUnit || "px") === "%" ? "%" : "px";

  const hasExplicitSize = width != null || height != null || size != null;
  const useConfigured = useConfig && !hasExplicitSize;

  const style = useConfigured
    ? configuredUnit === "%"
      ? { width: `${configuredSize}%`, height: "auto", maxWidth: "100%" }
      : { width: configuredSize, height: "auto", maxHeight: configuredSize }
    : {
        width: width || size || configuredSize,
        height: height || size || configuredSize,
      };

  return (
    <img
      src={imageSrc}
      alt={settings?.platformTitle || "Logo"}
      style={style}
      width={configuredUnit === "px" && !useConfigured ? style.width : undefined}
      height={configuredUnit === "px" && !useConfigured ? style.height : undefined}
      className={`object-contain ${className || ""}`}
      loading="eager"
      decoding="async"
      fetchPriority="high"
      onError={() => setFailed(true)}
    />
  );
}
