import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Obtener todos los usuarios (jugadores y propietarios)
export const getAllUsuarios = async (req, res, next) => {
  try {
    const { rol, activo, suscripcionActiva, search, page = 1, limit = 20 } = req.query;
    
    const where = {
      rol: { not: 'ADMIN' } // No mostrar otros admins
    };
    
    if (rol) where.rol = rol;
    if (activo !== undefined) where.activo = activo === 'true';
    if (suscripcionActiva !== undefined) where.suscripcionActiva = suscripcionActiva === 'true';
    
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { alias: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          alias: true,
          telefono: true,
          foto: true,
          rol: true,
          activo: true,
          suscripcionActiva: true,
          suscripcionFechaInicio: true,
          suscripcionFechaFin: true,
          suscripcionNotas: true,
          createdAt: true,
          _count: {
            select: {
              reservas: true,
              canchasPropiedad: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.usuario.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        usuarios,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener detalle de un usuario para admin
export const getUsuarioDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        alias: true,
        telefono: true,
        ciudad: true,
        provincia: true,
        pais: true,
        foto: true,
        rol: true,
        activo: true,
        emailVerificado: true,
        suscripcionActiva: true,
        suscripcionFechaInicio: true,
        suscripcionFechaFin: true,
        suscripcionNotas: true,
        mpConnected: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reservas: true,
            canchasPropiedad: true,
            resenas: true
          }
        },
        canchasPropiedad: {
          select: {
            id: true,
            nombre: true,
            activa: true,
            ciudad: true
          }
        }
      }
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// Activar/Desactivar usuario
export const toggleUsuarioActivo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        canchasPropiedad: true
      }
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (usuario.rol === 'ADMIN') {
      throw new AppError('No puedes modificar a otro administrador', 403);
    }

    // Si es propietario, manejar canchas automáticamente
    if (usuario.rol === 'PROPIETARIO') {
      if (!activo) {
        // Al desactivar: guardar IDs de canchas activas y pausarlas
        const canchasActivas = usuario.canchasPropiedad
          .filter(c => c.activa)
          .map(c => c.id);
        
        // Guardar IDs en el usuario para restaurar después
        await prisma.usuario.update({
          where: { id },
          data: { 
            activo: false,
            canchasPausadasPorAdmin: canchasActivas
          }
        });

        // Pausar todas las canchas activas
        if (canchasActivas.length > 0) {
          await prisma.cancha.updateMany({
            where: { id: { in: canchasActivas } },
            data: { activa: false }
          });
        }
      } else {
        // Al activar: reactivar solo las canchas que fueron pausadas por el admin
        const canchasAReactivar = usuario.canchasPausadasPorAdmin || [];
        
        await prisma.usuario.update({
          where: { id },
          data: { 
            activo: true,
            canchasPausadasPorAdmin: []
          }
        });

        // Reactivar las canchas que fueron pausadas
        if (canchasAReactivar.length > 0) {
          await prisma.cancha.updateMany({
            where: { id: { in: canchasAReactivar } },
            data: { activa: true }
          });
        }
      }
    } else {
      // Para jugadores, solo actualizar estado activo
      await prisma.usuario.update({
        where: { id },
        data: { activo }
      });
    }

    const mensaje = usuario.rol === 'PROPIETARIO'
      ? (activo ? 'Suscripción activada' : 'Suscripción pausada')
      : (activo ? 'Usuario activado' : 'Usuario desactivado');

    res.json({
      success: true,
      message: mensaje,
      data: { id, activo }
    });
  } catch (error) {
    next(error);
  }
};

// Gestionar suscripción de propietario
export const gestionarSuscripcion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { suscripcionActiva, suscripcionFechaInicio, suscripcionFechaFin, suscripcionNotas } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (usuario.rol !== 'PROPIETARIO') {
      throw new AppError('Solo se puede gestionar suscripción de propietarios', 400);
    }

    const updateData = {};
    
    if (suscripcionActiva !== undefined) updateData.suscripcionActiva = suscripcionActiva;
    if (suscripcionFechaInicio) updateData.suscripcionFechaInicio = new Date(suscripcionFechaInicio);
    if (suscripcionFechaFin) updateData.suscripcionFechaFin = new Date(suscripcionFechaFin);
    if (suscripcionNotas !== undefined) updateData.suscripcionNotas = suscripcionNotas;

    const updated = await prisma.usuario.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        suscripcionActiva: true,
        suscripcionFechaInicio: true,
        suscripcionFechaFin: true,
        suscripcionNotas: true
      }
    });

    // Si desactivamos suscripción, pausar canchas del propietario
    if (suscripcionActiva === false) {
      await prisma.cancha.updateMany({
        where: { propietarioId: id },
        data: { activa: false }
      });
    }

    res.json({
      success: true,
      message: 'Suscripción actualizada',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar usuario (soft delete o hard delete)
export const eliminarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hardDelete = false } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (usuario.rol === 'ADMIN') {
      throw new AppError('No puedes eliminar a otro administrador', 403);
    }

    if (hardDelete) {
      // Eliminar permanentemente - primero eliminar todas las relaciones dependientes
      // Usar transacción para asegurar consistencia
      await prisma.$transaction(async (tx) => {
        // 1. Eliminar participaciones en invitaciones
        await tx.participanteInvitacion.deleteMany({
          where: { usuarioId: id }
        });

        // 2. Eliminar solicitudes de invitación
        await tx.solicitudInvitacion.deleteMany({
          where: { usuarioId: id }
        });

        // 3. Eliminar invitaciones donde es invitado (setear a null no funciona, eliminar)
        await tx.invitacionReserva.deleteMany({
          where: { invitadoId: id }
        });

        // 4. Eliminar invitaciones que envió
        await tx.invitacionReserva.deleteMany({
          where: { invitadorId: id }
        });

        // 5. Eliminar pagos de reserva
        await tx.pagoReserva.deleteMany({
          where: { usuarioId: id }
        });

        // 6. Eliminar comentarios de reserva
        await tx.comentarioReserva.deleteMany({
          where: { usuarioId: id }
        });

        // 7. Eliminar reseñas
        await tx.resena.deleteMany({
          where: { usuarioId: id }
        });

        // 8. Eliminar reservas del usuario
        await tx.reserva.deleteMany({
          where: { usuarioId: id }
        });

        // 9. Si es propietario, eliminar sus canchas (esto eliminará horarios, sanciones, etc. por cascade)
        if (usuario.rol === 'PROPIETARIO') {
          await tx.cancha.deleteMany({
            where: { propietarioId: id }
          });
        }

        // 10. Finalmente eliminar el usuario (seguimientos, bloqueos, notificaciones, sanciones se eliminan por cascade)
        await tx.usuario.delete({
          where: { id }
        });
      });
      
      res.json({
        success: true,
        message: 'Usuario eliminado permanentemente'
      });
    } else {
      // Soft delete - solo desactivar
      await prisma.usuario.update({
        where: { id },
        data: { activo: false }
      });

      // Pausar canchas si es propietario
      if (usuario.rol === 'PROPIETARIO') {
        await prisma.cancha.updateMany({
          where: { propietarioId: id },
          data: { activa: false }
        });
      }

      res.json({
        success: true,
        message: 'Usuario desactivado'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas generales para el admin
export const getEstadisticasAdmin = async (req, res, next) => {
  try {
    const [
      totalJugadores,
      totalPropietarios,
      jugadoresActivos,
      propietariosActivos,
      propietariosConSuscripcion,
      totalCanchas,
      canchasActivas,
      totalReservas,
      reservasHoy
    ] = await Promise.all([
      prisma.usuario.count({ where: { rol: 'JUGADOR' } }),
      prisma.usuario.count({ where: { rol: 'PROPIETARIO' } }),
      prisma.usuario.count({ where: { rol: 'JUGADOR', activo: true } }),
      prisma.usuario.count({ where: { rol: 'PROPIETARIO', activo: true } }),
      prisma.usuario.count({ where: { rol: 'PROPIETARIO', suscripcionActiva: true } }),
      prisma.cancha.count(),
      prisma.cancha.count({ where: { activa: true } }),
      prisma.reserva.count(),
      prisma.reserva.count({
        where: {
          fecha: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        usuarios: {
          totalJugadores,
          totalPropietarios,
          jugadoresActivos,
          propietariosActivos,
          propietariosConSuscripcion
        },
        canchas: {
          total: totalCanchas,
          activas: canchasActivas
        },
        reservas: {
          total: totalReservas,
          hoy: reservasHoy
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Pausar/Reactivar todas las canchas de un propietario
export const toggleCanchasPropietario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activa } = req.body;

    const usuario = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    if (usuario.rol !== 'PROPIETARIO') {
      throw new AppError('El usuario no es propietario', 400);
    }

    await prisma.cancha.updateMany({
      where: { propietarioId: id },
      data: { activa }
    });

    res.json({
      success: true,
      message: activa ? 'Espacios reactivados' : 'Espacios pausados'
    });
  } catch (error) {
    next(error);
  }
};

// Enviar notificación masiva a usuarios
export const enviarNotificacionMasiva = async (req, res, next) => {
  try {
    const { titulo, mensaje, destinatarios, tipo = 'sistema' } = req.body;

    if (!titulo || !mensaje) {
      throw new AppError('Título y mensaje son obligatorios', 400);
    }

    if (!destinatarios || !['JUGADORES', 'PROPIETARIOS', 'TODOS'].includes(destinatarios)) {
      throw new AppError('Destinatarios debe ser JUGADORES, PROPIETARIOS o TODOS', 400);
    }

    // Obtener usuarios según destinatarios
    const whereClause = {
      rol: { not: 'ADMIN' }
    };

    if (destinatarios === 'JUGADORES') {
      whereClause.rol = 'JUGADOR';
    } else if (destinatarios === 'PROPIETARIOS') {
      whereClause.rol = 'PROPIETARIO';
    }

    const usuarios = await prisma.usuario.findMany({
      where: whereClause,
      select: { id: true }
    });

    if (usuarios.length === 0) {
      throw new AppError('No hay usuarios para notificar', 400);
    }

    // Crear notificaciones directamente para cada usuario
    const notificacionesData = usuarios.map(usuario => ({
      usuarioReceptorId: usuario.id,
      usuarioEmisorId: null,
      titulo: titulo,
      mensaje: mensaje,
      tipo: tipo,
      leida: false
    }));

    await prisma.notificacionUsuario.createMany({
      data: notificacionesData
    });

    res.json({
      success: true,
      message: `Notificación enviada a ${usuarios.length} usuarios`,
      data: {
        destinatarios: destinatarios,
        cantidadEnviada: usuarios.length
      }
    });
  } catch (error) {
    next(error);
  }
};
