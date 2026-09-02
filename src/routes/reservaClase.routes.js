import express from 'express';
import {
  cancelarReserva,
  procesarPago,
  confirmarListaEspera,
  crearResenaClase
} from '../controllers/reservaClase.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Cancelar reserva de clase (con lógica de lista de espera)
router.delete('/:id', authenticate, cancelarReserva);

// Procesar pago vía Mercado Pago
router.post('/:id/pago', authenticate, procesarPago);

// Crear reseña de clase
router.post('/:id/resena', authenticate, crearResenaClase);

// Confirmar entrada de lista de espera
router.post('/lista-espera/:id/confirmar', authenticate, confirmarListaEspera);

export default router;
