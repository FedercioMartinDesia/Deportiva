import express from 'express';
import {
  crearSancion,
  getMisSanciones,
  getJugadoresMisCanchas,
  eliminarSancion,
  verificarSancion,
  buscarJugadores
} from '../controllers/sancion.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de propietario
router.post('/', authorize('PROPIETARIO'), crearSancion);
router.get('/mis-sanciones', authorize('PROPIETARIO'), getMisSanciones);
router.get('/participantes-mis-espacios', authorize('PROPIETARIO'), getJugadoresMisCanchas);
router.get('/buscar-participantes', authorize('PROPIETARIO'), buscarJugadores);
router.delete('/:id', authorize('PROPIETARIO'), eliminarSancion);

// Verificar sanción (usado al crear reserva)
router.get('/verificar/:participanteId/:espacioId', verificarSancion);

export default router;
