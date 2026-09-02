// src/controllers/invitacion.controller.js
import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Crear invitaciones a amigos específicos
export const invitarAmigos = async (req, res, next) => {
  try {
    const { reservaId } = req.params;
    const { amigosIds, mensaje, horasLimiteCancelacion = 24 } = req.body;
    const userId = req.usuario.id;

    // Verificar que la reserva existe y pertenece al usuario
    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { cancha: true }
    });

    if (!reserva) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reserva.usuarioId !== userId) {
      throw new AppError('No tienes permiso para invitar a esta reserva', 403);
    }

    if (!amigosIds || amigosIds.length === 0) {
      throw new AppError('Debes seleccionar al menos un amigo', 400);
    }

    // Obtener datos del invitador
    const invitador = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { nombre: true, apellido: true, alias: true }
    });
    const nombreInvitador = invitador.alias || `${invitador.nombre} ${invitador.apellido}`;

    // Crear invitaciones para cada amigo
    const invitaciones = await Promise.all(
      amigosIds.map(amigoId =>
        prisma.invitacionReserva.create({
          data: {
            reservaId,
            invitadorId: userId,
            invitadoId: amigoId,
            esPublica: false,
            mensaje,
            estado: 'PENDIENTE',
            horasLimiteCancelacion: parseInt(horasLimiteCancelacion) || 24
          },
          include: {
            invitado: {
              select: { id: true, nombre: true, apellido: true, alias: true }
            }
          }
        })
      )
    );

    // Crear notificaciones para cada amigo invitado con el ID de su invitación
    await Promise.all(
      invitaciones.map(inv =>
        prisma.notificacionUsuario.create({
          data: {
            usuarioReceptorId: inv.invitadoId,
            usuarioEmisorId: userId,
            titulo: '¡Te invitaron a una actividad!',
            mensaje: `${nombreInvitador} te invitó a participar en ${reserva.cancha.nombre}`,
            tipo: 'invitacion',
            datos: JSON.stringify({ invitacionId: inv.id, reservaId: reservaId })
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `Se enviaron ${invitaciones.length} invitaciones`,
      data: invitaciones
    });
  } catch (error) {
    next(error);
  }
};

// Crear invitación pública (para "Falta 1 jugador")
export const crearInvitacionPublica = async (req, res, next) => {
  try {
    const { reservaId } = req.params;
    const { generoRequerido, cuposDisponibles, mensaje, horasLimiteCancelacion = 24 } = req.body;
    const userId = req.usuario.id;

    // Verificar que la reserva existe y pertenece al usuario
    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId },
      include: { cancha: true }
    });

    if (!reserva) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reserva.usuarioId !== userId) {
      throw new AppError('No tienes permiso para crear invitaciones en esta reserva', 403);
    }

    // Verificar si ya existe una invitación pública activa
    const invitacionExistente = await prisma.invitacionReserva.findFirst({
      where: {
        reservaId,
        esPublica: true,
        estado: 'PENDIENTE'
      }
    });

    if (invitacionExistente) {
      throw new AppError('Ya existe una invitación pública activa para esta reserva', 400);
    }

    const invitacion = await prisma.invitacionReserva.create({
      data: {
        reservaId,
        invitadorId: userId,
        esPublica: true,
        generoRequerido: generoRequerido || 'INDISTINTO',
        cuposDisponibles: cuposDisponibles || 1,
        cuposOcupados: 0,
        mensaje,
        estado: 'PENDIENTE',
        horasLimiteCancelacion: parseInt(horasLimiteCancelacion) || 24
      },
      include: {
        reserva: {
          include: {
            cancha: {
              select: { id: true, nombre: true, deporte: true }
            }
          }
        },
        invitador: {
          select: { id: true, nombre: true, apellido: true, alias: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Invitación pública creada exitosamente',
      data: invitacion
    });
  } catch (error) {
    next(error);
  }
};

// Obtener invitaciones públicas disponibles (para "Falta 1 jugador")
export const getInvitacionesPublicas = async (req, res, next) => {
  try {
    const { deporte, genero, ciudad } = req.query;
    const userId = req.usuario.id;

    const where = {
      esPublica: true,
      estado: 'PENDIENTE',
      cuposOcupados: { lt: prisma.raw('cuposDisponibles') },
      invitadorId: { not: userId }, // No mostrar las propias
      reserva: {
        fecha: { gte: new Date() }, // Solo reservas futuras
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] }
      }
    };

    // Filtros opcionales
    if (deporte) {
      where.reserva.cancha = { deporte };
    }
    if (genero && genero !== 'INDISTINTO') {
      where.generoRequerido = { in: [genero, 'INDISTINTO'] };
    }

    const invitaciones = await prisma.invitacionReserva.findMany({
      where,
      include: {
        reserva: {
          include: {
            cancha: {
              select: { 
                id: true, 
                nombre: true, 
                deporte: true,
                direccion: true,
                ciudad: true
              }
            }
          }
        },
        invitador: {
          select: { id: true, nombre: true, apellido: true, alias: true, foto: true }
        }
      },
      orderBy: { reserva: { fecha: 'asc' } }
    });

    // Filtrar por cupos disponibles (ya que Prisma no soporta comparar campos)
    const invitacionesFiltradas = invitaciones.filter(
      inv => inv.cuposOcupados < inv.cuposDisponibles
    );

    res.json({
      success: true,
      data: invitacionesFiltradas
    });
  } catch (error) {
    next(error);
  }
};

// Obtener mis invitaciones recibidas
export const getMisInvitaciones = async (req, res, next) => {
  try {
    const userId = req.usuario.id;

    const invitaciones = await prisma.invitacionReserva.findMany({
      where: {
        invitadoId: userId,
        estado: 'PENDIENTE'
      },
      include: {
        reserva: {
          include: {
            cancha: {
              select: { id: true, nombre: true, deporte: true, direccion: true }
            }
          }
        },
        invitador: {
          select: { id: true, nombre: true, apellido: true, alias: true, foto: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: invitaciones
    });
  } catch (error) {
    next(error);
  }
};

// Obtener detalle completo de una invitación
export const getDetalleInvitacion = async (req, res, next) => {
  try {
    const { invitacionId } = req.params;
    const userId = req.usuario.id;

    const invitacion = await prisma.invitacionReserva.findUnique({
      where: { id: invitacionId },
      include: {
        reserva: {
          include: {
            cancha: {
              select: { 
                id: true, 
                nombre: true, 
                deporte: true, 
                direccion: true,
                ciudad: true,
                precioPorHora: true,
                superficieTipo: true,
                vestuarios: true,
                estacionamiento: true,
                buffet: true,
                techada: true
              }
            },
            usuario: {
              select: { id: true, nombre: true, apellido: true, alias: true, foto: true }
            },
            invitaciones: {
              include: {
                invitado: {
                  select: { id: true, nombre: true, apellido: true, alias: true, foto: true }
                }
              }
            }
          }
        },
        invitador: {
          select: { id: true, nombre: true, apellido: true, alias: true, foto: true }
        },
        invitado: {
          select: { id: true, nombre: true, apellido: true, alias: true, foto: true }
        }
      }
    });

    if (!invitacion) {
      throw new AppError('Invitación no encontrada', 404);
    }

    // Verificar que el usuario sea el invitado o el invitador
    if (invitacion.invitadoId !== userId && invitacion.invitadorId !== userId) {
      throw new AppError('No tienes permiso para ver esta invitación', 403);
    }

    res.json({
      success: true,
      data: invitacion
    });
  } catch (error) {
    next(error);
  }
};

// Responder a una invitación (aceptar/rechazar)
export const responderInvitacion = async (req, res, next) => {
  try {
    const { invitacionId } = req.params;
    const { aceptar } = req.body;
    const userId = req.usuario.id;

    const invitacion = await prisma.invitacionReserva.findUnique({
      where: { id: invitacionId },
      include: {
        reserva: true,
        invitador: { select: { nombre: true } }
      }
    });

    if (!invitacion) {
      throw new AppError('Invitación no encontrada', 404);
    }

    // Verificar que el usuario es el invitado
    if (invitacion.invitadoId !== userId) {
      throw new AppError('No tienes permiso para responder a esta invitación', 403);
    }

    if (invitacion.estado !== 'PENDIENTE') {
      throw new AppError('Esta invitación ya fue respondida', 400);
    }

    const nuevoEstado = aceptar ? 'ACEPTADA' : 'RECHAZADA';

    const invitacionActualizada = await prisma.invitacionReserva.update({
      where: { id: invitacionId },
      data: { estado: nuevoEstado }
    });

    // TODO: Si acepta, agregar al usuario como participante de la reserva
    // TODO: Enviar notificación al invitador

    res.json({
      success: true,
      message: aceptar ? 'Invitación aceptada' : 'Invitación rechazada',
      data: invitacionActualizada
    });
  } catch (error) {
    next(error);
  }
};

// Unirse a una invitación pública
export const unirseInvitacionPublica = async (req, res, next) => {
  try {
    const { invitacionId } = req.params;
    const userId = req.usuario.id;

    const invitacion = await prisma.invitacionReserva.findUnique({
      where: { id: invitacionId },
      include: {
        reserva: {
          include: { cancha: true }
        },
        participantes: true
      }
    });

    if (!invitacion) {
      throw new AppError('Invitación no encontrada', 404);
    }

    if (!invitacion.esPublica) {
      throw new AppError('Esta no es una invitación pública', 400);
    }

    if (invitacion.estado !== 'PENDIENTE') {
      throw new AppError('Esta invitación ya no está disponible', 400);
    }

    if (invitacion.cuposOcupados >= invitacion.cuposDisponibles) {
      throw new AppError('No hay cupos disponibles', 400);
    }

    // Verificar que el usuario no sea el organizador
    if (invitacion.invitadorId === userId) {
      throw new AppError('No puedes unirte a tu propia invitación', 400);
    }

    // Verificar que el usuario no esté ya unido
    const yaUnido = invitacion.participantes.some(p => p.usuarioId === userId);
    if (yaUnido) {
      throw new AppError('Ya estás unido a esta invitación', 400);
    }

    // Agregar participante y actualizar cupos
    await prisma.$transaction([
      prisma.participanteInvitacion.create({
        data: {
          invitacionId,
          usuarioId: userId
        }
      }),
      prisma.invitacionReserva.update({
        where: { id: invitacionId },
        data: {
          cuposOcupados: { increment: 1 }
        }
      })
    ]);

    // Verificar si se completaron los cupos
    const invitacionActualizada = await prisma.invitacionReserva.findUnique({
      where: { id: invitacionId }
    });

    if (invitacionActualizada.cuposOcupados >= invitacionActualizada.cuposDisponibles) {
      await prisma.invitacionReserva.update({
        where: { id: invitacionId },
        data: { estado: 'ACEPTADA' }
      });
    }

    // TODO: Enviar notificación al organizador

    res.json({
      success: true,
      message: '¡Te uniste exitosamente!',
      data: invitacionActualizada
    });
  } catch (error) {
    next(error);
  }
};

// Obtener invitaciones de una reserva
export const getInvitacionesReserva = async (req, res, next) => {
  try {
    const { reservaId } = req.params;
    const userId = req.usuario.id;

    const reserva = await prisma.reserva.findUnique({
      where: { id: reservaId }
    });

    if (!reserva) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reserva.usuarioId !== userId) {
      throw new AppError('No tienes permiso para ver las invitaciones de esta reserva', 403);
    }

    const invitaciones = await prisma.invitacionReserva.findMany({
      where: { reservaId },
      include: {
        invitado: {
          select: { id: true, nombre: true, apellido: true, alias: true, foto: true }
        },
        participantes: {
          include: {
            usuario: {
              select: { id: true, nombre: true, apellido: true, alias: true, foto: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: invitaciones
    });
  } catch (error) {
    next(error);
  }
};

// Solicitar unirse a una invitación pública (requiere aprobación del organizador)
export const solicitarUnirse = async (req, res, next) => {
  try {
    const { invitacionId } = req.params;
    const userId = req.usuario.id;

    const invitacion = await prisma.invitacionReserva.findUnique({
      where: { id: invitacionId },
      include: {
        reserva: { include: { cancha: true } },
        participantes: true
      }
    });

    if (!invitacion) {
      throw new AppError('Invitación no encontrada', 404);
    }

    if (!invitacion.esPublica) {
      throw new AppError('Esta no es una invitación pública', 400);
    }

    if (invitacion.estado !== 'PENDIENTE') {
      throw new AppError('Esta invitación ya no está disponible', 400);
    }

    if (invitacion.invitadorId === userId) {
      throw new AppError('No puedes solicitar unirte a tu propia invitación', 400);
    }

    // Verificar que no haya solicitado ya
    const solicitudExistente = await prisma.solicitudInvitacion.findFirst({
      where: {
        invitacionId,
        usuarioId: userId
      }
    });

    if (solicitudExistente) {
      throw new AppError('Ya enviaste una solicitud para esta actividad', 400);
    }

    // Crear solicitud
    const solicitud = await prisma.solicitudInvitacion.create({
      data: {
        invitacionId,
        usuarioId: userId,
        estado: 'PENDIENTE'
      },
      include: {
        usuario: {
          select: { id: true, nombre: true, apellido: true, alias: true }
        }
      }
    });

    // Crear notificación para el organizador
    await prisma.notificacionUsuario.create({
      data: {
        remitenteId: userId,
        destinatarioId: invitacion.invitadorId,
        tipo: 'SOLICITUD_UNIRSE',
        titulo: 'Nueva solicitud para tu actividad',
        mensaje: `${req.usuario.nombre} quiere unirse a tu actividad de ${invitacion.reserva.cancha.deporte}`,
        datos: JSON.stringify({
          invitacionId,
          solicitudId: solicitud.id,
          reservaId: invitacion.reservaId
        })
      }
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud enviada. El organizador revisará tu perfil.',
      data: solicitud
    });
  } catch (error) {
    next(error);
  }
};

// Obtener solicitudes de una invitación (para el organizador)
export const getSolicitudesInvitacion = async (req, res, next) => {
  try {
    const { invitacionId } = req.params;
    const userId = req.usuario.id;

    const invitacion = await prisma.invitacionReserva.findUnique({
      where: { id: invitacionId }
    });

    if (!invitacion) {
      throw new AppError('Invitación no encontrada', 404);
    }

    if (invitacion.invitadorId !== userId) {
      throw new AppError('No tienes permiso para ver estas solicitudes', 403);
    }

    const solicitudes = await prisma.solicitudInvitacion.findMany({
      where: { invitacionId },
      include: {
        usuario: {
          select: { 
            id: true, 
            nombre: true, 
            apellido: true, 
            alias: true, 
            foto: true,
            ciudad: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: solicitudes
    });
  } catch (error) {
    next(error);
  }
};

// Responder a una solicitud (aceptar/rechazar)
export const responderSolicitud = async (req, res, next) => {
  try {
    const { solicitudId } = req.params;
    const { aceptar } = req.body;
    const userId = req.usuario.id;

    const solicitud = await prisma.solicitudInvitacion.findUnique({
      where: { id: solicitudId },
      include: {
        invitacion: {
          include: {
            reserva: { include: { cancha: true } }
          }
        },
        usuario: { select: { id: true, nombre: true } }
      }
    });

    if (!solicitud) {
      throw new AppError('Solicitud no encontrada', 404);
    }

    if (solicitud.invitacion.invitadorId !== userId) {
      throw new AppError('No tienes permiso para responder a esta solicitud', 403);
    }

    if (solicitud.estado !== 'PENDIENTE') {
      throw new AppError('Esta solicitud ya fue respondida', 400);
    }

    const nuevoEstado = aceptar ? 'ACEPTADA' : 'RECHAZADA';

    // Actualizar solicitud
    await prisma.solicitudInvitacion.update({
      where: { id: solicitudId },
      data: { estado: nuevoEstado }
    });

    if (aceptar) {
      // Agregar como participante
      await prisma.participanteInvitacion.create({
        data: {
          invitacionId: solicitud.invitacionId,
          usuarioId: solicitud.usuarioId
        }
      });

      // Actualizar cupos
      await prisma.invitacionReserva.update({
        where: { id: solicitud.invitacionId },
        data: { cuposOcupados: { increment: 1 } }
      });

      // Notificar al usuario aceptado
      await prisma.notificacionUsuario.create({
        data: {
          remitenteId: userId,
          destinatarioId: solicitud.usuarioId,
          tipo: 'SOLICITUD_ACEPTADA',
          titulo: '¡Te aceptaron en la actividad!',
          mensaje: `Tu solicitud para la actividad de ${solicitud.invitacion.reserva.cancha.deporte} fue aceptada`,
          datos: JSON.stringify({
            reservaId: solicitud.invitacion.reservaId,
            invitacionId: solicitud.invitacionId
          })
        }
      });
    } else {
      // Notificar rechazo
      await prisma.notificacionUsuario.create({
        data: {
          remitenteId: userId,
          destinatarioId: solicitud.usuarioId,
          tipo: 'SOLICITUD_RECHAZADA',
          titulo: 'Solicitud no aceptada',
          mensaje: `Tu solicitud para la actividad no fue aceptada esta vez`,
          datos: JSON.stringify({
            invitacionId: solicitud.invitacionId
          })
        }
      });
    }

    res.json({
      success: true,
      message: aceptar ? 'Participante aceptado' : 'Solicitud rechazada'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener perfil público de un usuario
export const getPerfilUsuario = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        alias: true,
        foto: true,
        ciudad: true,
        provincia: true,
        createdAt: true,
        _count: {
          select: {
            reservas: true,
            seguidores: true
          }
        }
      }
    });

    if (!usuario) {
      throw new AppError('Usuario no encontrado', 404);
    }

    res.json({
      success: true,
      data: {
        ...usuario,
        partidosJugados: usuario._count.reservas,
        amigos: usuario._count.seguidores
      }
    });
  } catch (error) {
    next(error);
  }
};
