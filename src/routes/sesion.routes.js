import express from 'express';
import {
  getSesionDetalle,
  completarSesion,
  cancelarSesion
} from '../controllers/sesion.controller.js';
import {
  reservarSesion,
  unirseListaEspera
} from '../controllers/reservaClase.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Detalle de sesión (autenticación opcional para mostrar info extra si inscripto)
router.get('/:id', (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
}, getSesionDetalle);

// Reservar lugar en una sesión
router.post('/:id/reservar', authenticate, reservarSesion);

// Unirse a la lista de espera
router.post('/:id/lista-espera', authenticate, unirseListaEspera);

// Marcar sesión como completada (solo profesor)
router.patch('/:id/completar', authenticate, completarSesion);

// Cancelar sesión (solo profesor)
router.patch('/:id/cancelar', authenticate, cancelarSesion);

export default router;
