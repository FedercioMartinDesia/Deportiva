import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Obtener comentarios de una reserva
export const getComentarios = async (req, res, next) => {
  try {
    const { reservaId } = req.params;
    const userId = req.usuario.id;

    // Verificar que el usuario sea el dueño de la reserva
    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
    });

    if (!reserva) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reserva.usuarioId !== userId) {
      throw new AppError('No tienes permiso para ver estos comentarios', 403);
    }

    // Obtener comentarios
    const comentarios = await prisma.comentarioReserva.findMany({
      where: { reservaId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            foto: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({
      success: true,
      data: comentarios,
    });
  } catch (error) {
    next(error);
  }
};

// Crear comentario
export const createComentario = async (req, res, next) => {
  try {
    const { reservaId } = req.params;
    const { mensaje } = req.body;
    const userId = req.usuario.id;

    if (!mensaje || !mensaje.trim()) {
      throw new AppError('El mensaje es obligatorio', 400);
    }

    // Verificar que el usuario sea el dueño de la reserva
    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
    });

    if (!reserva) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reserva.usuarioId !== userId) {
      throw new AppError('No tienes permiso para comentar en esta reserva', 403);
    }

    // Crear comentario
    const comentario = await prisma.comentarioReserva.create({
      data: {
        reservaId,
        usuarioId: userId,
        mensaje: mensaje.trim(),
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            foto: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Comentario creado exitosamente',
      data: comentario,
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar comentario
export const deleteComentario = async (req, res, next) => {
  try {
    const { comentarioId } = req.params;
    const userId = req.usuario.id;

    // Verificar que el comentario existe y pertenece al usuario
    const comentario = await prisma.comentarioReserva.findUnique({
      where: { id: comentarioId },
    });

    if (!comentario) {
      throw new AppError('Comentario no encontrado', 404);
    }

    if (comentario.usuarioId !== userId) {
      throw new AppError('No tienes permiso para eliminar este comentario', 403);
    }

    await prisma.comentarioReserva.delete({
      where: { id: comentarioId },
    });

    res.json({
      success: true,
      message: 'Comentario eliminado exitosamente',
    });
  } catch (error) {
    next(error);
  }
};
