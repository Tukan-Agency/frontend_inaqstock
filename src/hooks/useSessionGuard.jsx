
// hooks/useSessionGuard.jsx
import { useEffect, useContext, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionContext } from '../context/session';
import axios from 'axios';

export const useSessionGuard = (options = {}) => {
  const {
    redirectOnUnauth = true,
    redirectPath = "/",
    enablePeriodicCheck = true,
    checkInterval = 2,
  } = options;

  const { session, getUser, forceLogout } = useContext(sessionContext);
  const navigate = useNavigate();
  
  // REFS para evitar bucles
  const isAuthenticatedRef = useRef(session.status === "authenticated");
  const interceptorRef = useRef(null);

  // Actualizar ref cuando cambia el estado
  useEffect(() => {
    isAuthenticatedRef.current = session.status === "authenticated";
  }, [session.status]);

  // 1. INTERCEPTOR GLOBAL - Solo una vez
  useEffect(() => {
    // Solo configurar interceptor si no existe
    if (!interceptorRef.current) {
      interceptorRef.current = axios.interceptors.response.use(
        (response) => response,
        (error) => {
          // Usar ref en lugar de session.status
          if (error.response?.status === 401 && isAuthenticatedRef.current) {
            console.log("Interceptor: Sesión expirada (401)");
            forceLogout("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
            if (redirectOnUnauth) {
              navigate(redirectPath, { 
                replace: true,
                state: { message: "Sesión expirada" }
              });
            }
          }
          return Promise.reject(error);
        }
      );
    }

    // Cleanup
    return () => {
      if (interceptorRef.current) {
        axios.interceptors.response.eject(interceptorRef.current);
        interceptorRef.current = null;
      }
    };
  }, []); // <-- Array VACÍO: Solo se ejecuta una vez

  // 2. VERIFICACIÓN PERIÓDICA - Sin dependencias que causen bucles
  useEffect(() => {
    let intervalId;

    const verifySession = async () => {
      // Verificar usando ref, no session.status directamente
      if (isAuthenticatedRef.current) {
        try {
          const isValid = await getUser();
          if (!isValid && redirectOnUnauth) {
            navigate(redirectPath, { 
              replace: true,
              state: { message: "Sesión expirada" }
            });
          }
        } catch (error) {
          console.error("Error en verificación periódica:", error);
        }
      }
    };

    if (enablePeriodicCheck && isAuthenticatedRef.current) {
      intervalId = setInterval(verifySession, checkInterval * 60 * 1000);
      // Verificar inmediatamente
      verifySession();
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enablePeriodicCheck, checkInterval]); // <-- Menos dependencias

  // 3. REDIRECCIÓN AUTOMÁTICA - Solo para cambios específicos
  useEffect(() => {
    if (!redirectOnUnauth) return;

    const handleRedirection = async () => {
      switch (session.status) {
        case "unauthenticated":
          navigate(redirectPath, { 
            replace: true,
            state: { message: "Por favor inicia sesión" }
          });
          break;
        
        case "pending":
          // Solo un timeout, no llamar a getUser (puede causar bucle)
          const timeout = setTimeout(() => {
            // Si sigue en pending después de 3s, puede que haya un problema
            console.warn("Sesión en estado 'pending' por mucho tiempo");
          }, 3000);
          return () => clearTimeout(timeout);
        
        default:
          break;
      }
    };

    handleRedirection();
  }, [session.status, redirectOnUnauth, redirectPath, navigate]); // <-- Quité getUser

  // Retornar estado de sesión
  return {
    session,
    isAuthenticated: session.status === "authenticated",
    isPending: session.status === "pending",
    isUnauthenticated: session.status === "unauthenticated",
    refreshSession: getUser,
    logout: forceLogout,
  };
};

// HOC - Este está BIEN, no lo toques
export const withSessionGuard = (Component, options = {}) => {
  return function ProtectedComponent(props) {
    const { session } = useContext(sessionContext);
    const navigate = useNavigate();
    const { redirectPath = "/" } = options;

    useEffect(() => {
      if (session.status === "unauthenticated") {
        navigate(redirectPath, { 
          replace: true,
          state: { message: "Acceso no autorizado" }
        });
      }
    }, [session.status, navigate, redirectPath]);

    if (session.status === "pending") {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Verificando sesión...</p>
          </div>
        </div>
      );
    }

    if (session.status === "unauthenticated") {
      return null;
    }

    return <Component {...props} />;
  };
};