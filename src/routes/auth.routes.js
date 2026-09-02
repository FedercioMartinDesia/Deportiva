import express from 'express';
import {
  register,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  requestPhoneChange,
  verifyPhoneChange,
  getNotificationSettings,
  toggleNotifications,
  blockUserNotifications,
  unblockUserNotifications,
  getBlockedUsers,
  getMercadoPagoStatus,
  getMercadoPagoAuthUrl,
  mercadoPagoOAuthCallback,
  disconnectMercadoPago,
  requestRegisterCode,
  verifyRegisterCode,
  registerWithVerifiedPhone
} from '../controllers/auth.controller.js';

import { getInvitacionesPendientes } from '../controllers/notificacion.controller.js'; // <-- AGREGAR ESTA LÍNEA
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);
router.post('/google-login', googleLogin);

// Rutas de verificación de teléfono para REGISTRO (públicas)
router.post('/register/request-code', requestRegisterCode);
router.post('/register/verify-code', verifyRegisterCode);
router.post('/register/verified', registerWithVerifiedPhone);

// Rutas de recuperación de contraseña (públicas)
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.get('/notificaciones/invitaciones-pendientes', authenticate, getInvitacionesPendientes);
// Callback público de OAuth de Mercado Pago (Mercado Pago redirige aquí)
router.get('/mercadopago/oauth/callback', mercadoPagoOAuthCallback);

// Rutas protegidas
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.put('/change-password', authenticate, changePassword);
router.delete('/account', authenticate, deleteAccount);

// Rutas de cambio de teléfono (protegidas)
router.post('/request-phone-change', authenticate, requestPhoneChange);
router.post('/verify-phone-change', authenticate, verifyPhoneChange);

// Rutas de notificaciones
// Rutas de notificaciones
router.get('/notifications/settings', authenticate, getNotificationSettings);
router.put('/notifications/toggle', authenticate, toggleNotifications);
router.post('/notifications/block', authenticate, blockUserNotifications);
router.post('/notifications/unblock', authenticate, unblockUserNotifications);
router.get('/notifications/blocked-users', authenticate, getBlockedUsers);

// Rutas Mercado Pago OAuth (propietarios)
router.get('/mercadopago/status', authenticate, getMercadoPagoStatus);
router.get('/mercadopago/auth-url', authenticate, getMercadoPagoAuthUrl);
router.post('/mercadopago/disconnect', authenticate, disconnectMercadoPago);

export default router;
