import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';

const BalanceContext = createContext(null);

export const useBalance = () => {
  const ctx = useContext(BalanceContext);
  if (!ctx) throw new Error('useBalance debe usarse dentro de BalanceProvider');
  return ctx;
};

export const BalanceProvider = ({ children }) => {
  const [balances, setBalances] = useState({
    real: { capital: 0, balance: 0, margen: 0, ganancias: 0, capitalLibre: 0 },
    demo: { capital: 0, balance: 0, margen: 0, ganancias: 0, capitalLibre: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Carga inicial de balances vía REST
  const fetchBalances = useCallback(async () => {
    const base = import.meta.env.VITE_API_URL;
    try {
      const res = await fetch(base + '/api/balance', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (json?.success && json?.data) {
        setBalances({
          real: json.data.real || {},
          demo: json.data.demo || {}
        });
      }
    } catch (e) {
      console.error("Error fetchBalances:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Obtener ID de usuario desde la API (CORREGIDO: /api/auth/session)
  const fetchUserId = async () => {
    try {
      const base = import.meta.env.VITE_API_URL;
      // ✅ RUTA CORREGIDA: Apuntando a authRouter
      const res = await fetch(base + '/api/auth/session', { 
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        console.warn(`Error obteniendo sesión: ${res.status}`);
        return null;
      }
      
      const data = await res.json();
      // Tu endpoint devuelve el ID en data.id o data._id o data.user._id
      return data.id || data._id || (data.user && data.user._id);
    } catch (e) {
      console.error("Error obteniendo sesión para socket:", e);
      return null;
    }
  };

  useEffect(() => {
    // Cargar datos iniciales
    fetchBalances();

    // Conectar Socket.IO
    const socket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true, // Envía cookies (incluido token)
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
      reconnectionAttempts: 5
    });

    socket.on('connect', async () => {
      console.log("🟢 Socket conectado (ID:", socket.id + ")");

      // Obtener ID real desde el backend (ya que no podemos leer la cookie httpOnly)
      const userId = await fetchUserId();
      
      if (userId) {
        console.log("📤 Enviando join_room para:", userId);
        socket.emit('join_room', userId);
      } else {
        console.warn("⚠️ No se pudo obtener ID de usuario. El socket no recibirá actualizaciones.");
      }
    });

    // Escuchar actualizaciones de balance
    socket.on('balance_update', (newData) => {
      console.log("⚡ Balance actualizado:", newData);
      setBalances(prev => ({
        ...prev,
        real: newData.real || prev.real,
        demo: newData.demo || prev.demo
      }));
    });

    socket.on('connect_error', (err) => {
      console.warn("⚠️ Error conexión socket:", err.message);
    });

    // Limpieza al desmontar
    return () => {
      socket.disconnect();
    };
  }, [fetchBalances]);

  return (
    <BalanceContext.Provider value={{ balances, loading, error, refresh: fetchBalances }}>
      {children}
    </BalanceContext.Provider>
  );
};