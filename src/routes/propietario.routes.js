import express from 'express';
import {
  enviarNotificacionJugadores,
  getJugadoresMisCanchas
} from '../controllers/propietario.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol PROPIETARIO
router.use(authenticate);
router.use(authorize('PROPIETARIO'));

// Notificaciones a jugadores
router.post('/notificaciones/enviar', enviarNotificacionJugadores);

// Estadísticas de jugadores
router.get('/jugadores/count', getJugadoresMisCanchas);

export default router;
