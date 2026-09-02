import express from 'express';
import {
  getAllUsuarios,
  getUsuarioDetalle,
  toggleUsuarioActivo,
  gestionarSuscripcion,
  eliminarUsuario,
  getEstadisticasAdmin,
  toggleCanchasPropietario,
  enviarNotificacionMasiva
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación y rol ADMIN
router.use(authenticate);
router.use(authorize('ADMIN'));

// Dashboard/Estadísticas
router.get('/estadisticas', getEstadisticasAdmin);

// Gestión de usuarios
router.get('/usuarios', getAllUsuarios);
router.get('/usuarios/:id', getUsuarioDetalle);
router.patch('/usuarios/:id/toggle-activo', toggleUsuarioActivo);
router.patch('/usuarios/:id/suscripcion', gestionarSuscripcion);
router.delete('/usuarios/:id', eliminarUsuario);

// Gestión de espacios de propietario
router.patch('/usuarios/:id/espacios/toggle', toggleCanchasPropietario);

// Notificaciones masivas
router.post('/notificaciones/enviar', enviarNotificacionMasiva);

export default router;
