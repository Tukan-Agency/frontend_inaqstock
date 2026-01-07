import React from "react";
import useDarkMode from "use-dark-mode";
import { useSettings } from "../../context/SettingsContext.jsx";

// Definimos los defaults locales (los que tenías antes) por si falla la API
const DEFAULT_LIGHT = "/nasdaq_logo_light_v2.png";
const DEFAULT_DARK = "/nasdaq_logo_dark_v2.png";

export default function Logo({ size = 40, width, height, className }) {
  const { settings } = useSettings();
  const darkMode = useDarkMode(); 
  const isDark = darkMode.value;

  // Lógica de selección de imagen:
  // 1. Intentamos usar el logo del backend correspondiente al tema.
  // 2. Si no hay, intentamos usar el logo del backend del otro tema (fallback).
  // 3. Si no hay nada en el backend, usamos la imagen local de public/ (DEFAULT).
  let imageSrc;

  if (isDark) {
    imageSrc = settings?.logoDark || settings?.logoLight || DEFAULT_DARK;
  } else {
    imageSrc = settings?.logoLight || settings?.logoDark || DEFAULT_LIGHT;
  }

  console.log("Logo imageSrc:", settings);
  // Dimensiones: soportamos 'size' o 'width/height' específicos
  const finalWidth = width || size;
  const finalHeight = height || size;

  return (
    <img
      src={imageSrc}
      alt={settings?.platformTitle || "Logo"}
      width={finalWidth}
      height={finalHeight}
      className={`object-contain ${className || ""}`}
      // Si la URL del backend falla (404), hacemos fallback a la imagen local
      onError={(e) => {
        const fallback = isDark ? DEFAULT_DARK : DEFAULT_LIGHT;
        // Evitar bucle infinito si el fallback también falla
        if (e.target.src.includes(fallback)) return;
        e.target.src = fallback;
      }}
    />
  );
}