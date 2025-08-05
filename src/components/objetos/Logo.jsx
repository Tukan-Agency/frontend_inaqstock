import useDarkMode from "use-dark-mode";
import { useState, useEffect } from "react";

export default function Logo(data) {
  const width = data.data.width;
  const height = data.data.height;
  const darkmodevalue = useDarkMode().value;
  
  // Estado inicial basado en localStorage o en el tema actual
  const [logo, setLogo] = useState(() => {
    // Si hay un valor guardado en localStorage, úsalo
    const savedLogo = typeof window !== 'undefined' ? localStorage.getItem('nasdaq-logo') : null;
    if (savedLogo) return savedLogo;
    
    // Si no, usa el valor inicial según el tema
    return darkmodevalue ? "/nasdaq_logo_dark.png" : "/nasdaq_logo_light.png";
  });

  useEffect(() => {
    const newLogo = darkmodevalue ? "/nasdaq_logo_dark.png" : "/nasdaq_logo_light.png";
    
    // Solo actualiza si realmente cambió el logo
    if (newLogo !== logo) {
      setLogo(newLogo);
      // Guarda en localStorage para futuras cargas
      if (typeof window !== 'undefined') {
        localStorage.setItem('nasdaq-logo', newLogo);
      }
    }
  }, [darkmodevalue, logo]);

  return <img src={logo} width={width} height={height} alt="Logo" />;
}