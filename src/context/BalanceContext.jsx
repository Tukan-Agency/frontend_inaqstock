// src/contexts/BalanceContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const BalanceContext = createContext();

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalance debe usarse dentro de BalanceProvider');
  }
  return context;
};

export const BalanceProvider = ({ children }) => {
  const [balances, setBalances] = useState({
    balance: 0,
    capital: 0,
    ganancias: 0,
    margen: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener balances del backend
  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/balance', {
        method: 'GET',
        credentials: 'include', // Para enviar cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener balances');
      }

      const data = await response.json();
      
      if (data.success) {
        setBalances(data.data);
      } else {
        throw new Error(data.message || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Cargar balances al montar el componente
  useEffect(() => {
    fetchBalances();
  }, []);

  // Actualizar balances cada 30 segundos si la página está visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchBalances();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, []);

  const value = {
    balances,
    loading,
    error,
    fetchBalances, // Para actualizar manualmente
    refreshBalances: fetchBalances // Alias más claro
  };

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  );
};