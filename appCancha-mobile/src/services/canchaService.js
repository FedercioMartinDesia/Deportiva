import api from './api';

export const canchaService = {
  // Obtener todas las canchas con filtros
  getCanchas: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/canchas${params ? `?${params}` : ''}`);
      console.log('📡 getCanchas response:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener canchas cercanas a una ubicación
  getCanchasCercanas: async ({ latitud, longitud, radio = 10, deporte = null }) => {
    try {
      const params = new URLSearchParams({
        latitud,
        longitud,
        radio,
        ...(deporte && { deporte })
      }).toString();
      const response = await api.get(`/canchas/cercanas?${params}`);
      console.log('📡 getCanchasCercanas response:', response.data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener cancha por ID
  getCanchaById: async (id) => {
    try {
      const response = await api.get(`/canchas/${id}`);
      console.log('📡 getCanchaById raw response:', response.data);
      // El backend devuelve { success: true, data: {...} }
      const canchaData = response.data.data || response.data;
      console.log('📍 getCanchaById processed data:', canchaData);
      return canchaData;
    } catch (error) {
      console.error('❌ Error en getCanchaById:', error);
      throw error.response?.data || error;
    }
  },

  // Crear cancha (solo propietarios)
  createCancha: async (canchaData) => {
    try {
      const response = await api.post('/canchas', canchaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Actualizar cancha
  updateCancha: async (id, canchaData) => {
    try {
      const response = await api.put(`/canchas/${id}`, canchaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Eliminar cancha
  deleteCancha: async (id) => {
    try {
      const response = await api.delete(`/canchas/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Agregar reseña
  addResena: async (canchaId, resenaData) => {
    try {
      const response = await api.post(`/canchas/${canchaId}/resenas`, resenaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
