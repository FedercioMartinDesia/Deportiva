import api from './api';

export const profesorService = {
  // Registro de perfil de profesor (POST /api/profesores/registro)
  registroProfesor: async (data) => {
    try {
      const response = await api.post('/profesores/registro', data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener perfil de profesor
  getPerfilProfesor: async (id) => {
    try {
      const response = await api.get(`/profesores/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Solicitar vínculo con establecimiento
  solicitarVinculo: async (profesorId, data) => {
    try {
      const response = await api.post(`/profesores/${profesorId}/vincular-establecimiento`, data);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener mis vínculos
  getMisVinculos: async () => {
    try {
      const response = await api.get('/profesores/mis-vinculos');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
