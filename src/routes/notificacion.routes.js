import express from 'express';
import {
  getNotificacionesCount,
  getNotificaciones,
  deleteNotificacion,
  deleteAllNotificaciones,
  marcarComoLeida,
} from '../controllers/notificacion.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Obtener cantidad de notificaciones
router.get('/count', getNotificacionesCount);

// Obtener todas las notificaciones
router.get('/', getNotificaciones);

// Marcar una notificación como leída
router.put('/:id/leer', marcarComoLeida);

// Eliminar una notificación específica
router.delete('/:id', deleteNotificacion);

// Eliminar todas las notificaciones
router.delete('/', deleteAllNotificaciones);

export default router;
