import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import https from 'https';
import { sendWhatsAppResetCode, sendWhatsAppPasswordChanged, sendWhatsAppPhoneChangeCode, sendWhatsAppPhoneChanged, sendWhatsAppRegisterCode } from '../services/whatsappService.js';

// ===== Helpers y constantes de Mercado Pago =====

const MP_OAUTH_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';

// Helper para hacer POST x-www-form-urlencoded a Mercado Pago usando https nativo
const postFormUrlencoded = (url, body) => {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const formData = new URLSearchParams(body).toString();

      const options = {
        method: 'POST',
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(formData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(data || '{}');
              resolve(json);
            } catch (err) {
              reject(new Error('Error parseando respuesta de Mercado Pago'));
            }
          } else {
            reject(new Error(`Error de Mercado Pago (${res.statusCode}): ${data}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(formData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Generar JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Registro de usuario
export const register = async (req, res, next) => {
  try {
    const { email, password, nombre, apellido, alias, telefono, rol } = req.body;

    // Validar datos
    if (!email || !password || !nombre || !apellido) {
      throw new AppError('Todos los campos son obligatorios', 400);
    }

    // Verificar si el email ya existe (solo cuentas activas)
    const existingUser = await prisma.usuario.findFirst({
      where: { 
        email,
        activo: true
      }
    });

    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Si existe una cuenta inactiva con ese email, la eliminamos para permitir re-registro
    await prisma.usuario.deleteMany({
      where: {
        email,
        activo: false
      }
    });

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        email,
        password: hashedPassword,
        nombre,
        apellido,
        alias: alias || null,
        telefono,
        rol: rol || 'JUGADOR'
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        alias: true,
        telefono: true,
        rol: true,
        createdAt: true
      }
    });

    // Generar token
    const token = generateToken(usuario.id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        usuario,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Login de usuario
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validar datos
    if (!email || !password) {
      throw new AppError('Email/Alias y password son obligatorios', 400);
    }

    // Limpiar espacios del email/alias
    const emailLimpio = email.trim().toLowerCase();

    // Buscar usuario por email o alias
    const usuario = await prisma.usuario.findFirst({
      where: {
        OR: [
          { email: emailLimpio },
          { alias: emailLimpio }
        ]
      }
    });

    if (!usuario) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Verificar password
    const isPasswordValid = await bcrypt.compare(password, usuario.password);

    if (!isPasswordValid) {
      throw new AppError('Credenciales inválidas', 401);
    }

    // Todos los usuarios pueden iniciar sesión
    // El campo 'activo' solo controla funcionalidades específicas en la app

    // Generar token
    const token = generateToken(usuario.id);

    // Remover password de la respuesta
    const { password: _, ...usuarioSinPassword } = usuario;

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        usuario: usuarioSinPassword,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener perfil del usuario autenticado
export const getProfile = async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        alias: true,
        telefono: true,
        telefonosExtras: true,
        ciudad: true,
        provincia: true,
        pais: true,
        rol: true,
        foto: true,
        activo: true,
        emailVerificado: true,
        // Campos de suscripción (para propietarios)
        suscripcionActiva: true,
        suscripcionFechaInicio: true,
        suscripcionFechaFin: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar perfil
export const updateProfile = async (req, res, next) => {
  try {
    const { nombre, apellido, alias, email, telefono, telefonosExtras, ciudad, provincia, pais, foto } = req.body;

    // Si se intenta cambiar el email, verificar que no exista
    if (email && email !== req.usuario.email) {
      const existingUser = await prisma.usuario.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new AppError('El email ya está en uso', 400);
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: {
        ...(nombre && { nombre }),
        ...(apellido && { apellido }),
        ...(alias !== undefined && { alias }),
        ...(email && { email }),
        ...(telefono !== undefined && { telefono }),
        ...(telefonosExtras !== undefined && { telefonosExtras }),
        ...(ciudad !== undefined && { ciudad }),
        ...(provincia !== undefined && { provincia }),
        ...(pais !== undefined && { pais }),
        ...(foto !== undefined && { foto })
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        alias: true,
        telefono: true,
        telefonosExtras: true,
        ciudad: true,
        provincia: true,
        pais: true,
        rol: true,
        foto: true
      }
    });

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// Cambiar password
export const changePassword = async (req, res, next) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    if (!passwordActual || !passwordNuevo) {
      throw new AppError('Passwords son obligatorios', 400);
    }

    // Obtener usuario con password
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id }
    });

    // Verificar password actual
    const isPasswordValid = await bcrypt.compare(passwordActual, usuario.password);

    if (!isPasswordValid) {
      throw new AppError('Password actual incorrecto', 400);
    }

    // Hash del nuevo password
    const hashedPassword = await bcrypt.hash(passwordNuevo, 10);

    // Actualizar password
    await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { password: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Password actualizado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Login con Google
export const googleLogin = async (req, res, next) => {
  try {
    const { idToken, email, nombre, apellido, foto } = req.body;

    if (!email || !nombre) {
      throw new AppError('Datos de Google incompletos', 400);
    }

    // Buscar o crear usuario
    let usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      // Crear nuevo usuario con Google
      usuario = await prisma.usuario.create({
        data: {
          email,
          nombre,
          apellido: apellido || '',
          password: await bcrypt.hash(Math.random().toString(36), 10), // Password aleatorio
          rol: 'JUGADOR',
          foto,
          emailVerificado: true // Google ya verificó el email
        },
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          rol: true,
          foto: true,
          emailVerificado: true,
          createdAt: true
        }
      });
    } else {
      // Actualizar foto si viene de Google
      if (foto && foto !== usuario.foto) {
        usuario = await prisma.usuario.update({
          where: { id: usuario.id },
          data: { foto },
          select: {
            id: true,
            email: true,
            nombre: true,
            apellido: true,
            telefono: true,
            rol: true,
            foto: true,
            emailVerificado: true,
            createdAt: true
          }
        });
      } else {
        const { password: _, ...usuarioSinPassword } = usuario;
        usuario = usuarioSinPassword;
      }
    }

    // Verificar si está activo
    if (!usuario.activo) {
      throw new AppError('Usuario inactivo', 401);
    }

    // Generar token
    const token = generateToken(usuario.id);

    res.json({
      success: true,
      message: 'Login con Google exitoso',
      data: {
        usuario,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// ===== CONFIGURACIÓN DE NOTIFICACIONES =====

// Obtener configuración de notificaciones del usuario
export const getNotificationSettings = async (req, res, next) => {
  try {
    let settings = await prisma.notificacionSettings.findUnique({
      where: { usuarioId: req.usuario.id }
    });

    // Si no existen configuraciones, crearlas
    if (!settings) {
      settings = await prisma.notificacionSettings.create({
        data: {
          usuarioId: req.usuario.id,
          notificacionesActivas: true,
          usuariosBloqueados: []
        }
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar si las notificaciones están activas o no
export const toggleNotifications = async (req, res, next) => {
  try {
    const { activas } = req.body;

    if (typeof activas !== 'boolean') {
      throw new AppError('El campo activas debe ser un booleano', 400);
    }

    const settings = await prisma.notificacionSettings.upsert({
      where: { usuarioId: req.usuario.id },
      update: {
        notificacionesActivas: activas
      },
      create: {
        usuarioId: req.usuario.id,
        notificacionesActivas: activas,
        usuariosBloqueados: []
      }
    });

    res.json({
      success: true,
      message: `Notificaciones ${activas ? 'activadas' : 'desactivadas'}`,
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// Bloquear notificaciones de un usuario específico
export const blockUserNotifications = async (req, res, next) => {
  try {
    const { usuarioId } = req.body;

    if (!usuarioId) {
      throw new AppError('El ID del usuario es obligatorio', 400);
    }

    // Verificar que el usuario existe
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId }
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Obtener o crear configuración
    let settings = await prisma.notificacionSettings.findUnique({
      where: { usuarioId: req.usuario.id }
    });

    if (!settings) {
      settings = await prisma.notificacionSettings.create({
        data: {
          usuarioId: req.usuario.id,
          notificacionesActivas: true,
          usuariosBloqueados: [usuarioId]
        }
      });
    } else {
      // Agregar el usuario a la lista si no está
      const usuariosBloqueados = [...settings.usuariosBloqueados];
      if (!usuariosBloqueados.includes(usuarioId)) {
        usuariosBloqueados.push(usuarioId);
        settings = await prisma.notificacionSettings.update({
          where: { usuarioId: req.usuario.id },
          data: { usuariosBloqueados }
        });
      }
    }

    res.json({
      success: true,
      message: 'Usuario bloqueado correctamente',
      data: settings
    });
  } catch (error) {
    next(error);
  }
};

// Desbloquear notificaciones de un usuario específico
export const unblockUserNotifications = async (req, res, next) => {
  try {
    const { usuarioId } = req.body;

    if (!usuarioId) {
      throw new AppError('El ID del usuario es obligatorio', 400);
    }

    const settings = await prisma.notificacionSettings.findUnique({
      where: { usuarioId: req.usuario.id }
    });

    if (!settings) {
      throw new AppError('Configuración no encontrada', 404);
    }

    // Remover el usuario de la lista
    const usuariosBloqueados = settings.usuariosBloqueados.filter(id => id !== usuarioId);
    
    const updatedSettings = await prisma.notificacionSettings.update({
      where: { usuarioId: req.usuario.id },
      data: { usuariosBloqueados }
    });

    res.json({
      success: true,
      message: 'Usuario desbloqueado correctamente',
      data: updatedSettings
    });
  } catch (error) {
    next(error);
  }
};

// Obtener lista de usuarios bloqueados con sus datos
export const getBlockedUsers = async (req, res, next) => {
  try {
    const settings = await prisma.notificacionSettings.findUnique({
      where: { usuarioId: req.usuario.id }
    });

    if (!settings || settings.usuariosBloqueados.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    // Obtener datos de los usuarios bloqueados
    const usuariosBloqueados = await prisma.usuario.findMany({
      where: {
        id: { in: settings.usuariosBloqueados }
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        alias: true,
        foto: true
      }
    });

    res.json({
      success: true,
      data: usuariosBloqueados
    });
  } catch (error) {
    next(error);
  }
};

// ===== MERCADO PAGO OAUTH PARA PROPIETARIOS =====

// Obtener estado de conexión de Mercado Pago del usuario autenticado
export const getMercadoPagoStatus = async (req, res, next) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true,
        rol: true,
        mpConnected: true,
        mpUserId: true
      }
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (usuario.rol !== 'PROPIETARIO') {
      throw new AppError('Solo los propietarios pueden configurar Mercado Pago', 403);
    }

    res.json({
      success: true,
      data: {
        connected: usuario.mpConnected,
        mpUserId: usuario.mpUserId
      }
    });
  } catch (error) {
    next(error);
  }
};

// Generar URL de autorización de Mercado Pago para conectar la cuenta del propietario
export const getMercadoPagoAuthUrl = async (req, res, next) => {
  try {
    if (req.usuario.rol !== 'PROPIETARIO') {
      throw new AppError('Solo los propietarios pueden conectar Mercado Pago', 403);
    }

    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      throw new AppError('Mercado Pago no está configurado en el servidor', 500);
    }

    // Usamos el ID del usuario como state para identificarlo en el callback
    const state = req.usuario.id;

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      platform_id: 'mp',
      redirect_uri: redirectUri,
      state
    });

    const url = `https://auth.mercadopago.com/authorization?${params.toString()}`;

    res.json({
      success: true,
      url
    });
  } catch (error) {
    next(error);
  }
};

// Callback de OAuth de Mercado Pago (redirect_uri configurado en la app de MP)
export const mercadoPagoOAuthCallback = async (req, res, next) => {
  try {
    const { code, state, error: mpError } = req.query;

    if (mpError) {
      // Si el usuario canceló o hubo error del lado de MP
      return res.status(400).send(`Error al conectar Mercado Pago: ${mpError}`);
    }

    if (!code || !state) {
      throw new AppError('Parámetros inválidos en el callback de Mercado Pago', 400);
    }

    const clientId = process.env.MERCADOPAGO_CLIENT_ID;
    const clientSecret = process.env.MERCADOPAGO_CLIENT_SECRET;
    const redirectUri = process.env.MERCADOPAGO_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new AppError('Mercado Pago no está configurado en el servidor', 500);
    }

    // Intercambiar el code por access_token y refresh_token
    const tokenResponse = await postFormUrlencoded(MP_OAUTH_TOKEN_URL, {
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri
    });

    const { access_token, refresh_token, user_id } = tokenResponse;

    if (!access_token) {
      throw new AppError('No se pudo obtener el access token de Mercado Pago', 500);
    }

    // Actualizar usuario (state contiene el ID del usuario)
    const usuarioId = state.toString();

    await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        mpAccessToken: access_token,
        mpRefreshToken: refresh_token || null,
        mpUserId: user_id ? String(user_id) : null,
        mpConnected: true
      }
    });

    // Respuesta simple para el navegador al finalizar la conexión
    res.send('Integración con Mercado Pago completada. Ya puedes volver a la aplicación.');
  } catch (error) {
    next(error);
  }
};

// Desconectar la cuenta de Mercado Pago del propietario
export const disconnectMercadoPago = async (req, res, next) => {
  try {
    if (req.usuario.rol !== 'PROPIETARIO') {
      throw new AppError('Solo los propietarios pueden desconectar Mercado Pago', 403);
    }

    await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: {
        mpAccessToken: null,
        mpRefreshToken: null,
        mpUserId: null,
        mpConnected: false
      }
    });

    res.json({
      success: true,
      message: 'Cuenta de Mercado Pago desconectada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

// ===== Eliminar cuenta (soft delete) =====

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.usuario.id;

    // Marcar usuario como inactivo (soft delete)
    await prisma.usuario.update({
      where: { id: userId },
      data: { activo: false }
    });

    res.json({
      success: true,
      message: 'Cuenta eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

// ===== Recuperación de contraseña =====

// Generar código de 6 dígitos
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Solicitar código de recuperación por WhatsApp
export const forgotPassword = async (req, res, next) => {
  try {
    const { telefono } = req.body;

    if (!telefono) {
      throw new AppError('El número de teléfono es obligatorio', 400);
    }

    // Limpiar el teléfono (quitar espacios, guiones, paréntesis y +)
    const telefonoLimpio = telefono.replace(/[\s\-\(\)\+]/g, '');
    
    // Extraer los últimos 10 dígitos (número sin código de país)
    const ultimosDigitos = telefonoLimpio.slice(-10);

    // Buscar usuario por teléfono (búsqueda flexible, solo usuarios activos)
    const usuario = await prisma.usuario.findFirst({
      where: { 
        activo: true,
        OR: [
          { telefono: { contains: telefonoLimpio } },
          { telefono: { contains: ultimosDigitos } },
          { telefono: { endsWith: ultimosDigitos } }
        ]
      },
      select: { id: true, nombre: true, telefono: true, activo: true }
    });

    // Indicar si el teléfono no existe o la cuenta está eliminada
    if (!usuario || !usuario.activo) {
      return res.json({
        success: true,
        exists: false,
        message: 'No existe una cuenta con este número de teléfono'
      });
    }

    // Invalidar códigos anteriores
    await prisma.passwordResetCode.updateMany({
      where: { 
        email: usuario.telefono, // Usamos el campo email para guardar el teléfono
        used: false 
      },
      data: { used: true }
    });

    // Generar nuevo código
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Guardar código (usamos email para guardar el teléfono)
    await prisma.passwordResetCode.create({
      data: {
        email: usuario.telefono,
        code,
        expiresAt
      }
    });

    // Enviar WhatsApp
    await sendWhatsAppResetCode(usuario.telefono, code, usuario.nombre);

    res.json({
      success: true,
      exists: true,
      message: 'Código enviado por WhatsApp'
    });
  } catch (error) {
    next(error);
  }
};

// Verificar código de recuperación
export const verifyResetCode = async (req, res, next) => {
  try {
    const { telefono, code } = req.body;

    if (!telefono || !code) {
      throw new AppError('Teléfono y código son obligatorios', 400);
    }

    // Limpiar teléfono
    const telefonoLimpio = telefono.replace(/[\s\-\(\)\+]/g, '');
    const ultimosDigitos = telefonoLimpio.slice(-10);

    // Buscar usuario activo para obtener el teléfono exacto guardado
    const usuario = await prisma.usuario.findFirst({
      where: { 
        activo: true,
        OR: [
          { telefono: { contains: telefonoLimpio } },
          { telefono: { contains: ultimosDigitos } },
          { telefono: { endsWith: ultimosDigitos } }
        ]
      },
      select: { telefono: true }
    });

    if (!usuario) {
      throw new AppError('Código inválido o expirado', 400);
    }

    // Buscar código válido
    const resetCode = await prisma.passwordResetCode.findFirst({
      where: {
        email: usuario.telefono,
        code,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!resetCode) {
      throw new AppError('Código inválido o expirado', 400);
    }

    res.json({
      success: true,
      message: 'Código verificado correctamente',
      data: { verified: true }
    });
  } catch (error) {
    next(error);
  }
};

// Restablecer contraseña
export const resetPassword = async (req, res, next) => {
  try {
    const { telefono, code, newPassword } = req.body;

    if (!telefono || !code || !newPassword) {
      throw new AppError('Teléfono, código y nueva contraseña son obligatorios', 400);
    }

    if (newPassword.length < 6) {
      throw new AppError('La contraseña debe tener al menos 6 caracteres', 400);
    }

    // Limpiar teléfono
    const telefonoLimpio = telefono.replace(/[\s\-\(\)\+]/g, '');
    const ultimosDigitos = telefonoLimpio.slice(-10);

    // Buscar usuario activo
    const usuario = await prisma.usuario.findFirst({
      where: { 
        activo: true,
        OR: [
          { telefono: { contains: telefonoLimpio } },
          { telefono: { contains: ultimosDigitos } },
          { telefono: { endsWith: ultimosDigitos } }
        ]
      },
      select: { id: true, nombre: true, telefono: true }
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar código
    const resetCode = await prisma.passwordResetCode.findFirst({
      where: {
        email: usuario.telefono,
        code,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!resetCode) {
      throw new AppError('Código inválido o expirado', 400);
    }

    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hashedPassword }
    });

    // Marcar código como usado
    await prisma.passwordResetCode.update({
      where: { id: resetCode.id },
      data: { used: true }
    });

    // Enviar confirmación por WhatsApp
    sendWhatsAppPasswordChanged(usuario.telefono, usuario.nombre);

    res.json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

// ===== Cambio de Teléfono =====

// Solicitar código para cambio de teléfono
export const requestPhoneChange = async (req, res, next) => {
  try {
    const { nuevoTelefono } = req.body;
    const userId = req.usuario.id;

    if (!nuevoTelefono) {
      throw new AppError('El nuevo número de teléfono es obligatorio', 400);
    }

    // Obtener usuario actual
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, nombre: true, telefono: true }
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Limpiar el nuevo teléfono
    const telefonoLimpio = nuevoTelefono.replace(/[\s\-\(\)]/g, '');

    // Verificar que el nuevo teléfono no sea igual al actual
    if (usuario.telefono === telefonoLimpio) {
      throw new AppError('El nuevo número es igual al actual', 400);
    }

    // Verificar que el nuevo teléfono no esté en uso por otro usuario
    const telefonoExistente = await prisma.usuario.findFirst({
      where: {
        telefono: telefonoLimpio,
        id: { not: userId },
        activo: true
      }
    });

    if (telefonoExistente) {
      throw new AppError('Este número de teléfono ya está registrado por otro usuario', 400);
    }

    // Invalidar códigos anteriores para este usuario
    await prisma.passwordResetCode.updateMany({
      where: { 
        email: `phone_change_${userId}`,
        used: false 
      },
      data: { used: true }
    });

    // Generar nuevo código
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Guardar código (usamos email para identificar el cambio de teléfono)
    await prisma.passwordResetCode.create({
      data: {
        email: `phone_change_${userId}`,
        code,
        expiresAt
      }
    });

    // Guardar temporalmente el nuevo teléfono en metadata
    await prisma.passwordResetCode.create({
      data: {
        email: `phone_new_${userId}`,
        code: telefonoLimpio,
        expiresAt
      }
    });

    // Enviar código al NUEVO teléfono
    await sendWhatsAppPhoneChangeCode(telefonoLimpio, code, usuario.nombre);

    res.json({
      success: true,
      message: 'Código enviado al nuevo número por WhatsApp'
    });
  } catch (error) {
    next(error);
  }
};

// Verificar código y cambiar teléfono
export const verifyPhoneChange = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.usuario.id;

    if (!code) {
      throw new AppError('El código es obligatorio', 400);
    }

    // Obtener usuario actual
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { id: true, nombre: true, telefono: true }
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Buscar código válido
    const resetCode = await prisma.passwordResetCode.findFirst({
      where: {
        email: `phone_change_${userId}`,
        code,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!resetCode) {
      throw new AppError('Código inválido o expirado', 400);
    }

    // Obtener el nuevo teléfono guardado
    const newPhoneRecord = await prisma.passwordResetCode.findFirst({
      where: {
        email: `phone_new_${userId}`,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!newPhoneRecord) {
      throw new AppError('Error al procesar el cambio. Intenta nuevamente.', 400);
    }

    const nuevoTelefono = newPhoneRecord.code;
    const telefonoAnterior = usuario.telefono;

    // Actualizar teléfono del usuario
    await prisma.usuario.update({
      where: { id: userId },
      data: { telefono: nuevoTelefono }
    });

    // Marcar códigos como usados
    await prisma.passwordResetCode.updateMany({
      where: {
        OR: [
          { email: `phone_change_${userId}` },
          { email: `phone_new_${userId}` }
        ]
      },
      data: { used: true }
    });

    // Enviar confirmación al número anterior (si existe)
    if (telefonoAnterior) {
      sendWhatsAppPhoneChanged(telefonoAnterior, nuevoTelefono, usuario.nombre);
    }

    res.json({
      success: true,
      message: 'Número de teléfono actualizado correctamente',
      data: { nuevoTelefono }
    });
  } catch (error) {
    next(error);
  }
};

// ===== Verificación de teléfono en REGISTRO =====

// Solicitar código de verificación para registro (antes de crear cuenta)
export const requestRegisterCode = async (req, res, next) => {
  try {
    const { telefono, nombre, email } = req.body;

    if (!telefono) {
      throw new AppError('El número de teléfono es obligatorio', 400);
    }

    // Limpiar el teléfono
    const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');

    // Verificar que el teléfono no esté ya registrado
    const telefonoExistente = await prisma.usuario.findFirst({
      where: {
        telefono: telefonoLimpio,
        activo: true
      }
    });

    if (telefonoExistente) {
      throw new AppError('Este número de teléfono ya está registrado', 400);
    }

    // Verificar que el email no esté ya registrado (si se proporciona)
    if (email) {
      const emailExistente = await prisma.usuario.findFirst({
        where: {
          email,
          activo: true
        }
      });

      if (emailExistente) {
        throw new AppError('Este email ya está registrado', 400);
      }
    }

    // Invalidar códigos anteriores para este teléfono
    await prisma.passwordResetCode.updateMany({
      where: { 
        email: `register_${telefonoLimpio}`,
        used: false 
      },
      data: { used: true }
    });

    // Generar nuevo código
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    // Guardar código
    await prisma.passwordResetCode.create({
      data: {
        email: `register_${telefonoLimpio}`,
        code,
        expiresAt
      }
    });

    // Enviar código por WhatsApp
    await sendWhatsAppRegisterCode(telefonoLimpio, code, nombre || 'Usuario');

    res.json({
      success: true,
      message: 'Código de verificación enviado por WhatsApp'
    });
  } catch (error) {
    next(error);
  }
};

// Verificar código de registro
export const verifyRegisterCode = async (req, res, next) => {
  try {
    const { telefono, code } = req.body;

    if (!telefono || !code) {
      throw new AppError('Teléfono y código son obligatorios', 400);
    }

    // Limpiar teléfono
    const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');

    // Buscar código válido
    const resetCode = await prisma.passwordResetCode.findFirst({
      where: {
        email: `register_${telefonoLimpio}`,
        code,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!resetCode) {
      throw new AppError('Código inválido o expirado', 400);
    }

    // Marcar como verificado (pero no usado, se usará al completar el registro)
    // Guardamos un token temporal que indica que el teléfono fue verificado
    const verificationToken = `verified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await prisma.passwordResetCode.create({
      data: {
        email: `verified_${telefonoLimpio}`,
        code: verificationToken,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutos para completar registro
      }
    });

    res.json({
      success: true,
      message: 'Teléfono verificado correctamente',
      data: { 
        verified: true,
        verificationToken // El frontend debe enviar este token al registrarse
      }
    });
  } catch (error) {
    next(error);
  }
};

// Registro con teléfono verificado
export const registerWithVerifiedPhone = async (req, res, next) => {
  try {
    const { email, password, nombre, apellido, alias, telefono, rol, foto, verificationToken, telefonosExtras } = req.body;

    // Validar datos
    if (!email || !password || !nombre || !apellido || !telefono || !verificationToken) {
      throw new AppError('Todos los campos obligatorios y el token de verificación son requeridos', 400);
    }

    // Limpiar teléfono
    const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');

    // Verificar que el token de verificación sea válido
    const verifiedRecord = await prisma.passwordResetCode.findFirst({
      where: {
        email: `verified_${telefonoLimpio}`,
        code: verificationToken,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!verifiedRecord) {
      throw new AppError('El teléfono no ha sido verificado o el token expiró. Solicita un nuevo código.', 400);
    }

    // Verificar que el email no exista
    const existingUser = await prisma.usuario.findFirst({
      where: { 
        email,
        activo: true
      }
    });

    if (existingUser) {
      throw new AppError('El email ya está registrado', 400);
    }

    // Verificar que el teléfono no exista
    const telefonoExistente = await prisma.usuario.findFirst({
      where: {
        telefono: telefonoLimpio,
        activo: true
      }
    });

    if (telefonoExistente) {
      throw new AppError('Este número de teléfono ya está registrado', 400);
    }

    // Si existe una cuenta inactiva con ese email, la eliminamos
    await prisma.usuario.deleteMany({
      where: {
        email,
        activo: false
      }
    });

    // Hash del password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear usuario con settings de notificación
    const usuario = await prisma.usuario.create({
      data: {
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        alias: alias ? alias.trim() : null,
        telefono: telefonoLimpio,
        telefonosExtras: telefonosExtras || null,
        rol: rol || 'JUGADOR',
        foto: foto || null,
        activo: true,
        emailVerificado: true,
        notificacionSettings: {
          create: {
            notificacionesActivas: true,
            usuariosBloqueados: []
          }
        }
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        alias: true,
        telefono: true,
        rol: true,
        foto: true,
        createdAt: true
      }
    });

    // Marcar todos los códigos como usados
    await prisma.passwordResetCode.updateMany({
      where: {
        OR: [
          { email: `register_${telefonoLimpio}` },
          { email: `verified_${telefonoLimpio}` }
        ]
      },
      data: { used: true }
    });

    // Generar token
    const token = generateToken(usuario.id);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        usuario,
        token
      }
    });
  } catch (error) {
    next(error);
  }
};
