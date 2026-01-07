import axios from "axios";

// Detectar la URL del backend
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const RecoveryService = {
  // 1. Enviar correo de recuperación (POST /api/auth/forgot-password)
  async requestReset(email) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      return response.data;
    } catch (error) {
      console.error("Error requesting reset:", error);
      // Retornar error controlado
      return { 
        ok: false, 
        message: error.response?.data?.message || "Error de conexión con el servidor" 
      };
    }
  },

  // 2. Restablecer la contraseña (POST /api/auth/reset-password)
  async performReset(token, newPassword) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/reset-password`, {
        token,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error("Error performing reset:", error);
      return { 
        ok: false, 
        message: error.response?.data?.message || "Error al restablecer contraseña" 
      };
    }
  }
};