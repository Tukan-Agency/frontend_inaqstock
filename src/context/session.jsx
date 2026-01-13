import { createContext, useEffect, useState, useRef } from "react";
import axios from "axios";

export const sessionContext = createContext({});

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useState({
    status: "pending",
    user: {},
  });
  const intervalRef = useRef(null);
  const logoutTimerRef = useRef(null);

  // Función para cerrar sesión y redirigir al login
  const forceLogout = (message = "Sesión expirada") => {
    // Limpiar intervalos
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    
    // Cerrar sesión en el estado
    setSession({ 
      status: "unauthenticated", 
      user: {} 
    });
    
    // Opcional: Redirigir al login
    // window.location.href = "/login";
    
    // Opcional: Mostrar notificación
    console.warn(message);
    
    // También podrías hacer logout en el backend
    axios.post(import.meta.env.VITE_API_URL + "/api/auth/logout", {}, {
      withCredentials: true
    }).catch(() => {
      // Ignorar errores en logout
    });
  };

  const getUser = async () => {
    try {
      const res = await axios.get(
        import.meta.env.VITE_API_URL + "/api/auth/session",
        {
          withCredentials: true,
          timeout: 5000, // Timeout de 5 segundos
        }
      );

      if (res.status === 200) {
        setSession({
          status: "authenticated",
          user: res.data,
        });
        
        // Si el token tiene expiración, configurar timer para cerrar sesión
        if (res.data.expiresAt) {
          const expiresAt = new Date(res.data.expiresAt).getTime();
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          
          if (timeUntilExpiry > 0) {
            // Configurar timer para cerrar sesión cuando expire el token
            logoutTimerRef.current = setTimeout(() => {
              forceLogout("Tu sesión ha expirado automáticamente");
            }, timeUntilExpiry);
          } else {
            // Token ya expiró
            forceLogout("Sesión expirada");
          }
        }
        
        return true;
      } else {
        forceLogout("Error de autenticación");
        return false;
      }
    } catch (error) {
      // Solo cerrar sesión si es error 401 (No autorizado)
      if (error.response?.status === 401) {
        forceLogout("Sesión expirada o inválida");
      } else if (!error.response) {
        // Error de red, no cerrar sesión inmediatamente
        console.error("Error de conexión:", error.message);
      }
      return false;
    }
  };

  // Función para verificar sesión periódicamente
  const startSessionVerification = () => {
    // Limpiar intervalo previo si existe
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Verificar sesión cada 5 minutos (300000 ms)
    intervalRef.current = setInterval(async () => {
      if (session.status === "authenticated") {
        await getUser();
      }
    }, 5 * 60 * 1000); // 5 minutos
  };

  // Función para limpiar sesión manualmente
  const clearSession = () => {
    forceLogout("Sesión cerrada por el usuario");
  };

  // Efecto principal para validar sesión al montar
  useEffect(() => {
    getUser().then((isAuthenticated) => {
      if (isAuthenticated) {
        startSessionVerification();
      }
    });

    // Cleanup al desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  // Reiniciar verificación cuando cambia el estado de sesión
  useEffect(() => {
    if (session.status === "authenticated") {
      startSessionVerification();
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    }
  }, [session.status]);

  // Interceptor de axios para manejar errores 401 globalmente
  useEffect(() => {
    // Interceptor de respuesta
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && session.status === "authenticated") {
          // Cerrar sesión si recibimos 401
          forceLogout("Sesión expirada (interceptor)");
        }
        return Promise.reject(error);
      }
    );

    // Limpiar interceptor al desmontar
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [session.status]);

  return (
    <sessionContext.Provider
      value={{ 
        session, 
        clearSession, 
        setSession, 
        getUser,
        forceLogout 
      }}
    >
      {children}
    </sessionContext.Provider>
  );
};