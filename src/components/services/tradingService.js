import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export class TradingService {
  // ✅ Nuevo método para recargar saldo en la cuenta Demo
  static async resetDemoFunds(amount) {
    try {
      const response = await axios.post(
        `${API_URL}/api/demo/reset`,
        { amount },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error resetDemoFunds:', error);
      throw error;
    }
  }

  static async savePosition(position) {
    // position debe incluir { symbol, volume, type, openPrice, mode: 'real'|'demo' }
    try {
      const response = await axios.post(
        `${API_URL}/api/positions`, 
        position,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error savePosition:', error);
      throw error;
    }
  }

  static async closePosition(positionId, closingData) {
    try {
      const response = await axios.post(
        `${API_URL}/api/positions/${positionId}/close`,
        closingData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error closePosition:', error);
      throw error;
    }
  }

  // ✅ Actualizado para pedir posiciones según el modo (real o demo)
  static async getOpenPositions(mode = 'real') {
    try {
      const response = await axios.get(
        `${API_URL}/api/positions/open`,
        {
          params: { mode }, // Envía ?mode=demo
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getOpenPositions:', error);
      throw error;
    }
  }

  // ✅ Actualizado para pedir historial según el modo
  static async getClosedPositions(mode = 'real') {
    try {
      const response = await axios.get(
        `${API_URL}/api/positions/closed`,
        {
          params: { mode }, // Envía ?mode=demo
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getClosedPositions:', error);
      throw error;
    }
  }

  static async updatePositionPrice(positionId, currentPrice) {
    try {
      const response = await axios.put(
        `${API_URL}/api/positions/${positionId}/price`,
        { currentPrice },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updatePositionPrice:', error);
      throw error;
    }
  }
}