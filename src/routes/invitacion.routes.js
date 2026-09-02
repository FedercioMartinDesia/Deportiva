// src/routes/invitacion.routes.js
import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  invitarAmigos,
  crearInvitacionPublica,
  getInvitacionesPublicas,
  getMisInvitaciones,
  getDetalleInvitacion,
  responderInvitacion,
  unirseInvitacionPublica,
  getInvitacionesReserva,
  solicitarUnirse,
  getSolicitudesInvitacion,
  responderSolicitud,
  getPerfilUsuario
} from '../controllers/invitacion.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Invitar amigos a una reserva
router.post('/reserva/:reservaId/invitar-amigos', invitarAmigos);

// Crear invitación pública (Falta 1 participante)
router.post('/reserva/:reservaId/publica', crearInvitacionPublica);

// Obtener invitaciones públicas disponibles
router.get('/publicas', getInvitacionesPublicas);

// Obtener mis invitaciones recibidas
router.get('/mis-invitaciones', getMisInvitaciones);

// Obtener detalle de una invitación
router.get('/:invitacionId/detalle', getDetalleInvitacion);

// Responder a una invitación (aceptar/rechazar)
router.put('/:invitacionId/responder', responderInvitacion);

// Unirse a una invitación pública
router.post('/:invitacionId/unirse', unirseInvitacionPublica);

// Obtener invitaciones de una reserva específica
router.get('/reserva/:reservaId', getInvitacionesReserva);

// Solicitar unirse a una invitación pública
router.post('/:invitacionId/solicitar', solicitarUnirse);

// Obtener solicitudes de una invitación (para el organizador)
router.get('/:invitacionId/solicitudes', getSolicitudesInvitacion);

// Responder a una solicitud (aceptar/rechazar)
router.put('/solicitud/:solicitudId/responder', responderSolicitud);

// Obtener perfil público de un usuario
router.get('/usuario/:userId/perfil', getPerfilUsuario);

export default router;
