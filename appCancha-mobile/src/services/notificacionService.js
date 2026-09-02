// appCancha-mobile/src/services/notificacionService.js
import api from './api';

export const notificacionService = {
  getInvitacionesPendientes: async () => {
    const response = await api.get('/notificaciones/invitaciones-pendientes');
    return response.data;
  },

  marcarComoLeida: async (id) => {
    await api.put(`/notificaciones/${id}/leida`);
  },
};