import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export class TradingService {
  static async savePosition(position) {
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
      console.error('Error:', error);
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
      console.error('Error:', error);
      throw error;
    }
  }

  static async getOpenPositions() {
    try {
      const response = await axios.get(
        `${API_URL}/api/positions/open`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  static async getClosedPositions() {
    try {
      const response = await axios.get(
        `${API_URL}/api/positions/closed`,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error:', error);
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
      console.error('Error:', error);
      throw error;
    }
  }
}