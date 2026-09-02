import express from 'express';
import {
  getUsuarios,
  getUsuarioById,
  updateUsuario,
  deleteUsuario,
  getEstadisticasUsuario,
  searchUsuarios,
  followUsuario,
  unfollowUsuario,
  getAmigos,
  bloquearUsuario,
  desbloquearUsuario,
  getBloqueados
} from '../controllers/usuario.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas especiales (sin parámetro de ID)
router.get('/buscar', searchUsuarios);
router.get('/amigos', getAmigos);
router.post('/seguir/:id', followUsuario);
router.post('/dejar-de-seguir/:id', unfollowUsuario);

// Rutas de bloqueo
router.get('/bloqueados', getBloqueados);
router.post('/bloquear/:id', bloquearUsuario);
router.post('/desbloquear/:id', desbloquearUsuario);

// Rutas de admin
router.get('/', authorize('ADMIN'), getUsuarios);

// Rutas generales (con parámetro de ID)
router.get('/:id', getUsuarioById);
router.get('/:id/perfil', getUsuarioById); // Alias para perfil público
router.get('/:id/estadisticas', getEstadisticasUsuario);
router.put('/:id', updateUsuario);
router.delete('/:id', deleteUsuario);

export default router;
