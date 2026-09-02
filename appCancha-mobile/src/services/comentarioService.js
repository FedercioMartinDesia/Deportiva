import api from './api';

export const comentarioService = {
  // Obtener comentarios de una reserva
  getComentarios: async (reservaId) => {
    try {
      const response = await api.get(`/comentarios/reserva/${reservaId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Crear comentario
  createComentario: async (reservaId, mensaje) => {
    try {
      const response = await api.post(`/comentarios/reserva/${reservaId}`, { mensaje });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Eliminar comentario
  deleteComentario: async (comentarioId) => {
    try {
      const response = await api.delete(`/comentarios/${comentarioId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
