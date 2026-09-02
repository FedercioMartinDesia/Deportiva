import api from './api';

export const reservaService = {
  // Crear reserva
  createReserva: async (reservaData) => {
    try {
      const response = await api.post('/reservas', reservaData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener mis reservas
  getMisReservas: async () => {
    try {
      const response = await api.get('/reservas/mis-reservas');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener reserva por ID
  getReservaById: async (id) => {
    try {
      const response = await api.get(`/reservas/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Cancelar reserva
  cancelReserva: async (id) => {
    try {
      const response = await api.put(`/reservas/${id}/cancelar`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Confirmar pago
  confirmarPago: async (id, metodoPago) => {
    try {
      const response = await api.put(`/reservas/${id}/confirmar-pago`, { metodoPago });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createPagoReserva: async (id, cantidadCupos = 1) => {
    try {
      const response = await api.post(`/reservas/${id}/pagos`, { cantidadCupos });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  pagarSaldoOrganizador: async (id) => {
    try {
      const response = await api.post(`/reservas/${id}/pagar-saldo`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Ver disponibilidad de cancha
  getDisponibilidad: async (canchaId, fecha) => {
    try {
      const response = await api.get(`/reservas/cancha/${canchaId}/disponibilidad`, {
        params: { fecha },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtener reservas del propietario (jugadores que reservaron sus canchas)
  getReservasOwner: async () => {
    try {
      const response = await api.get('/reservas/owner/mis-reservas');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Actualizar estado de reserva (para propietario)
  updateReservaStatus: async (id, estado) => {
    try {
      const response = await api.put(`/reservas/${id}/estado`, { estado });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Eliminar una reserva (solo pasadas o canceladas)
  deleteReserva: async (id) => {
    try {
      const response = await api.delete(`/reservas/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Eliminar todas las reservas pasadas y canceladas
  deletePastReservas: async () => {
    try {
      const response = await api.delete('/reservas/pasadas');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
