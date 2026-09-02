import express from 'express';
import {
  getCanchas,
  getCanchasCercanas,
  getCanchaById,
  createCancha,
  updateCancha,
  deleteCancha,
  addResena,
  getMisCanchas
} from '../controllers/cancha.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.get('/', getCanchas);
router.get('/cercanas', getCanchasCercanas);

// Rutas protegidas - propietarios (debe ir antes de /:id)
router.get('/mis-espacios', authenticate, authorize('PROPIETARIO', 'ADMIN'), getMisCanchas);

// Rutas públicas dinámicas
router.get('/:id', getCanchaById);

// Rutas protegidas - propietarios
router.get('/mis-espacios', authenticate, authorize('PROPIETARIO', 'ADMIN'), getMisCanchas);

// Rutas protegidas - solo propietarios y admin
router.post('/', authenticate, authorize('PROPIETARIO', 'ADMIN'), createCancha);
router.put('/:id', authenticate, authorize('PROPIETARIO', 'ADMIN'), updateCancha);
router.delete('/:id', authenticate, authorize('PROPIETARIO', 'ADMIN'), deleteCancha);

// Agregar reseña - cualquier usuario autenticado
router.post('/:id/resenas', authenticate, addResena);

export default router;
