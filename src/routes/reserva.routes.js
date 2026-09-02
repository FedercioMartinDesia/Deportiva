import express from 'express';
import {
  createReserva,
  getMyReservas,
  getReservaById,
  cancelReserva,
  confirmarPago,
  getDisponibilidad,
  getReservasByCancha,
  createPagoReservaMP,
  pagarSaldoOrganizadorMP,
  getMyReservasAsOwner,
  updateReservaEstado,
  deleteReserva,
  deletePastReservas
} from '../controllers/reserva.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de usuario (participante)
router.post('/', createReserva);
router.get('/mis-reservas', getMyReservas);
router.delete('/pasadas', deletePastReservas);
router.get('/:id', getReservaById);
router.put('/:id/cancelar', cancelReserva);
router.put('/:id/confirmar-pago', confirmarPago);
router.delete('/:id', deleteReserva);

// Rutas de propietario
router.get('/owner/mis-reservas', authorize('PROPIETARIO'), getMyReservasAsOwner);
router.put('/:id/estado', authorize('PROPIETARIO'), updateReservaEstado);

// Pagos con Mercado Pago
router.post('/:id/pagos', createPagoReservaMP);
router.post('/:id/pagar-saldo', pagarSaldoOrganizadorMP);

// Consultar disponibilidad
router.get('/espacio/:espacioId/disponibilidad', getDisponibilidad);

// Obtener reservas de un espacio (propietario/admin)
router.get('/espacio/:espacioId/reservas', authorize('PROPIETARIO', 'ADMIN'), getReservasByCancha);

export default router;
