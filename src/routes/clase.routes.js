import express from 'express';
import {
  crearClase,
  getClases,
  getClaseDetalle,
  cambiarEstadoClase,
  getMisClases
} from '../controllers/clase.controller.js';
import {
  crearSesion,
  generarSesiones
} from '../controllers/sesion.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Listar clases con filtros (público)
router.get('/', getClases);

// Mis clases como profesor (debe ir antes de /:id)
router.get('/mis-clases', authenticate, getMisClases);

// Detalle de clase (público, pero si autenticado muestra info extra)
router.get('/:id', (req, res, next) => {
  // Intentar autenticar opcionalmente sin bloquear
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticate(req, res, next);
  }
  next();
}, getClaseDetalle);

// Crear clase (solo profesores)
router.post('/', authenticate, crearClase);

// Cambiar estado de clase (aprobar/rechazar/pausar)
router.patch('/:id/estado', authenticate, cambiarEstadoClase);

// Crear sesión específica para una clase
router.post('/:id/sesiones', authenticate, crearSesion);

// Generar sesiones en lote desde horarios recurrentes
router.post('/:id/sesiones/generar', authenticate, generarSesiones);

export default router;
