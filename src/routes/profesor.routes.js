import express from 'express';
import {
  registroProfesor,
  getPerfilProfesor,
  solicitarVinculo,
  gestionarVinculo,
  getMisVinculos,
  getVinculosEstablecimiento
} from '../controllers/profesor.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Registro de profesor (cualquier usuario autenticado puede convertirse en profesor)
router.post('/registro', authenticate, registroProfesor);

// Mis vínculos como profesor (debe ir ANTES de /:id)
router.get('/mis-vinculos', authenticate, getMisVinculos);

// Vínculos de un establecimiento (vista propietario, debe ir ANTES de /:id)
router.get('/establecimientos/:id/vinculos', authenticate, authorize('PROPIETARIO', 'ADMIN'), getVinculosEstablecimiento);

// Aprobar/rechazar/desactivar vínculo (solo propietario del establecimiento)
router.patch('/establecimientos/:id/vinculos/:vinculoId', authenticate, authorize('PROPIETARIO', 'ADMIN'), gestionarVinculo);

// Perfil público del profesor (acceso público, dinámico, va al final)
router.get('/:id', getPerfilProfesor);

// Solicitar vínculo con un establecimiento
router.post('/:id/vincular-establecimiento', authenticate, solicitarVinculo);

export default router;
