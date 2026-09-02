// src/services/invitacionService.js
import api from './api';

export const invitacionService = {
  // Invitar amigos específicos a una reserva
  invitarAmigos: async (reservaId, amigosIds, opciones = {}) => {
    const response = await api.post(`/invitaciones/reserva/${reservaId}/invitar-amigos`, {
      amigosIds,
      mensaje: opciones.mensaje || null,
      horasLimiteCancelacion: opciones.horasLimiteCancelacion || 24
    });
    return response.data;
  },

  // Crear invitación pública (Falta 1 jugador)
  crearInvitacionPublica: async (reservaId, { generoRequerido, cuposDisponibles, mensaje, horasLimiteCancelacion }) => {
    const response = await api.post(`/invitaciones/reserva/${reservaId}/publica`, {
      generoRequerido,
      cuposDisponibles,
      mensaje,
      horasLimiteCancelacion: horasLimiteCancelacion || 24
    });
    return response.data;
  },

  // Obtener invitaciones públicas disponibles
  getInvitacionesPublicas: async (filtros = {}) => {
    const params = new URLSearchParams();
    if (filtros.deporte) params.append('deporte', filtros.deporte);
    if (filtros.genero) params.append('genero', filtros.genero);
    if (filtros.ciudad) params.append('ciudad', filtros.ciudad);
    
    const response = await api.get(`/invitaciones/publicas?${params.toString()}`);
    return response.data;
  },

  // Obtener mis invitaciones recibidas
  getMisInvitaciones: async () => {
    const response = await api.get('/invitaciones/mis-invitaciones');
    return response.data;
  },

  // Obtener detalle de una invitación
  getDetalleInvitacion: async (invitacionId) => {
    const response = await api.get(`/invitaciones/${invitacionId}/detalle`);
    return response.data;
  },

  // Responder a una invitación
  responderInvitacion: async (invitacionId, aceptar) => {
    const response = await api.put(`/invitaciones/${invitacionId}/responder`, { aceptar });
    return response.data;
  },

  // Unirse a una invitación pública
  unirseInvitacionPublica: async (invitacionId) => {
    const response = await api.post(`/invitaciones/${invitacionId}/unirse`);
    return response.data;
  },

  // Obtener invitaciones de una reserva
  getInvitacionesReserva: async (reservaId) => {
    const response = await api.get(`/invitaciones/reserva/${reservaId}`);
    return response.data;
  },

  // Solicitar unirse a una invitación pública
  solicitarUnirse: async (invitacionId) => {
    const response = await api.post(`/invitaciones/${invitacionId}/solicitar`);
    return response.data;
  },

  // Obtener solicitudes de una invitación (para el organizador)
  getSolicitudesInvitacion: async (invitacionId) => {
    const response = await api.get(`/invitaciones/${invitacionId}/solicitudes`);
    return response.data;
  },

  // Responder a una solicitud (aceptar/rechazar)
  responderSolicitud: async (solicitudId, aceptar) => {
    const response = await api.put(`/invitaciones/solicitud/${solicitudId}/responder`, { aceptar });
    return response.data;
  }
};
