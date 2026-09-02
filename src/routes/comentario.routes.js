import express from 'express';
import {
  getComentarios,
  createComentario,
  deleteComentario
} from '../controllers/comentario.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de comentarios
router.get('/reserva/:reservaId', getComentarios);
router.post('/reserva/:reservaId', createComentario);
router.delete('/:comentarioId', deleteComentario);

export default router;
