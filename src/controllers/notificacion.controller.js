import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler.js';

const prisma = new PrismaClient();

// Obtener cantidad de notificaciones no leídas
export const getNotificacionesCount = async (req, res, next) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.json({
        success: true,
        count: 0,
      });
    }

    const count = await prisma.notificacionUsuario.count({
      where: {
        usuarioReceptorId: req.usuario.id,
        leida: false,
      },
    });

    res.json({
      success: true,
      count: count,
    });
  } catch (error) {
    next(error);
  }
};

export const getInvitacionesPendientes = async (req, res, next) => {
  try {
    const invitaciones = await prisma.notificacion.findMany({
      where: {
        usuarioId: req.usuario.id,
        tipo: 'INVITACION_PAGO',
        leida: false
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: invitaciones });
  } catch (error) {
    next(error);
  }
};

// Obtener todas las notificaciones del usuario autenticado
export const getNotificaciones = async (req, res, next) => {
  try {
    if (!req.usuario || !req.usuario.id) {
      return res.json({
        success: true,
        data: [],
      });
    }

    const notificaciones = await prisma.notificacionUsuario.findMany({
      where: {
        usuarioReceptorId: req.usuario.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: notificaciones,
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar una notificación específica
export const deleteNotificacion = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notificacion = await prisma.notificacionUsuario.findUnique({
      where: { id },
    });

    if (!notificacion) {
      throw new AppError('Notificación no encontrada', 404);
    }

    // Verificar que el usuario es el receptor
    if (notificacion.usuarioReceptorId !== req.usuario.id) {
      throw new AppError('No tienes permiso para eliminar esta notificación', 403);
    }

    await prisma.notificacionUsuario.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Notificación eliminada exitosamente',
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar todas las notificaciones del usuario
export const deleteAllNotificaciones = async (req, res, next) => {
  try {
    await prisma.notificacionUsuario.deleteMany({
      where: {
        usuarioReceptorId: req.usuario.id,
      },
    });

    res.json({
      success: true,
      message: 'Todas las notificaciones han sido eliminadas',
    });
  } catch (error) {
    next(error);
  }
};

// Marcar una notificación como leída
export const marcarComoLeida = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notificacion = await prisma.notificacionUsuario.findUnique({
      where: { id },
    });

    if (!notificacion) {
      throw new AppError('Notificación no encontrada', 404);
    }

    if (notificacion.usuarioReceptorId !== req.usuario.id) {
      throw new AppError('No tienes permiso para modificar esta notificación', 403);
    }

    await prisma.notificacionUsuario.update({
      where: { id },
      data: { leida: true },
    });

    res.json({
      success: true,
      message: 'Notificación marcada como leída',
    });
  } catch (error) {
    next(error);
  }
};

// Crear una notificación (uso interno)
export const createNotificacion = async (receptorId, titulo, mensaje, tipo = 'DEFAULT') => {
  try {
    const notificacion = await prisma.notificacionUsuario.create({
      data: {
        titulo,
        mensaje,
        tipo,
        receptorId,
      },
    });
    return notificacion;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};
