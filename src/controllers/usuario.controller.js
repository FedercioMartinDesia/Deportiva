import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Obtener todos los usuarios (solo admin)
export const getUsuarios = async (req, res, next) => {
  try {
    const { rol, page = 1, limit = 10 } = req.query;

    const where = {
      ...(rol && { rol })
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [usuarios, total] = await Promise.all([
      prisma.usuario.findMany({
        where,
        select: {
          id: true,
          email: true,
          nombre: true,
          apellido: true,
          telefono: true,
          rol: true,
          activo: true,
          createdAt: true
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.usuario.count({ where })
    ]);

    res.json({
      success: true,
      data: usuarios,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener usuario por ID
export const getUsuarioById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        foto: true,
        activo: true,
        createdAt: true,
        _count: {
          select: {
            reservas: true,
            canchasPropiedad: true,
            resenas: true
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

// Actualizar usuario (solo admin o el mismo usuario)
export const updateUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar permisos
    if (req.usuario.id !== id && req.usuario.rol !== 'ADMIN') {
      throw new AppError('No tienes permiso para actualizar este usuario', 403);
    }

    const { nombre, apellido, telefono, rol, activo } = req.body;

    // Solo admin puede cambiar rol y estado activo
    const dataToUpdate = {
      ...(nombre && { nombre }),
      ...(apellido && { apellido }),
      ...(telefono && { telefono })
    };

    if (req.usuario.rol === 'ADMIN') {
      if (rol) dataToUpdate.rol = rol;
      if (activo !== undefined) dataToUpdate.activo = activo;
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        nombre: true,
        apellido: true,
        telefono: true,
        rol: true,
        activo: true
      }
    });

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
};

// Desactivar usuario (soft delete)
export const deleteUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar permisos
    if (req.usuario.id !== id && req.usuario.rol !== 'ADMIN') {
      throw new AppError('No tienes permiso para eliminar este usuario', 403);
    }

    await prisma.usuario.update({
      where: { id },
      data: { activo: false }
    });

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener estadísticas del usuario
export const getEstadisticasUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [
      totalReservas,
      reservasCompletadas,
      reservasCanceladas,
      totalGastado,
      canchasFavoritas
    ] = await Promise.all([
      prisma.reserva.count({
        where: { usuarioId: id }
      }),
      prisma.reserva.count({
        where: { usuarioId: id, estado: 'COMPLETADA' }
      }),
      prisma.reserva.count({
        where: { usuarioId: id, estado: 'CANCELADA' }
      }),
      prisma.reserva.aggregate({
        where: { usuarioId: id, pagado: true },
        _sum: { precioTotal: true }
      }),
      prisma.reserva.groupBy({
        by: ['canchaId'],
        where: { usuarioId: id },
        _count: true,
        orderBy: { _count: { canchaId: 'desc' } },
        take: 5
      })
    ]);

    res.json({
      success: true,
      data: {
        totalReservas,
        reservasCompletadas,
        reservasCanceladas,
        totalGastado: totalGastado._sum.precioTotal || 0,
        canchasFavoritas
      }
    });
  } catch (error) {
    next(error);
  }
};

// Buscar usuarios por alias o nombre
export const searchUsuarios = async (req, res, next) => {
  try {
    const { alias, nombre, limit = 10 } = req.query;
    const currentUserId = req.usuario.id;

    if (!alias && !nombre) {
      throw new AppError('Debe proporcionar alias o nombre para buscar', 400);
    }

    const where = {
      activo: true,
      rol: 'JUGADOR',
      NOT: {
        id: currentUserId
      },
      ...(alias && {
        alias: {
          contains: alias,
          mode: 'insensitive'
        }
      }),
      ...(nombre && {
        OR: [
          {
            nombre: {
              contains: nombre,
              mode: 'insensitive'
            }
          },
          {
            apellido: {
              contains: nombre,
              mode: 'insensitive'
            }
          }
        ]
      })
    };

    const usuarios = await prisma.usuario.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        alias: true,
        email: true,
        foto: true,
        ciudad: true
      },
      take: parseInt(limit),
      orderBy: {
        alias: 'asc'
      }
    });

    res.json({
      success: true,
      usuarios,
      total: usuarios.length
    });
  } catch (error) {
    next(error);
  }
};

// Seguir a un usuario
export const followUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.usuario.id;

    if (id === currentUserId) {
      throw new AppError('No puedes seguirte a ti mismo', 400);
    }

    const usuarioASeeguir = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuarioASeeguir) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar si ya lo está siguiendo
    const yaLaSigue = await prisma.seguimiento.findUnique({
      where: {
        seguidorId_seguidoId: {
          seguidorId: currentUserId,
          seguidoId: id
        }
      }
    });

    if (yaLaSigue) {
      throw new AppError('Ya estás siguiendo a este usuario', 400);
    }

    // Crear el seguimiento
    const seguimiento = await prisma.seguimiento.create({
      data: {
        seguidorId: currentUserId,
        seguidoId: id
      }
    });

    res.json({
      success: true,
      message: 'Ahora estás siguiendo a este usuario',
      data: {
        usuarioId: id,
        nombre: usuarioASeeguir.nombre,
        apellido: usuarioASeeguir.apellido
      }
    });
  } catch (error) {
    next(error);
  }
};

// Dejar de seguir a un usuario
export const unfollowUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.usuario.id;

    if (id === currentUserId) {
      throw new AppError('No puedes dejar de seguirte a ti mismo', 400);
    }

    const usuarioADejarDeSeguir = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!usuarioADejarDeSeguir) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Eliminar el seguimiento
    const seguimiento = await prisma.seguimiento.deleteMany({
      where: {
        seguidorId: currentUserId,
        seguidoId: id
      }
    });

    if (seguimiento.count === 0) {
      throw new AppError('No estás siguiendo a este usuario', 404);
    }

    res.json({
      success: true,
      message: 'Has dejado de seguir a este usuario',
      data: {
        usuarioId: id
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener amigos (usuarios seguidos)
export const getAmigos = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;

    const seguimientos = await prisma.seguimiento.findMany({
      where: {
        seguidorId: usuarioId
      },
      select: {
        seguido: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            alias: true,
            email: true,
            foto: true,
            ciudad: true
          }
        }
      }
    });

    const amigos = seguimientos.map(s => s.seguido);

    res.json({
      success: true,
      amigos,
      total: amigos.length
    });
  } catch (error) {
    next(error);
  }
};

// Bloquear usuario
export const bloquearUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.usuario.id;

    if (id === currentUserId) {
      throw new AppError('No puedes bloquearte a ti mismo', 400);
    }

    const usuarioABloquear = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombre: true, apellido: true, alias: true }
    });

    if (!usuarioABloquear) {
      throw new AppError('Usuario no encontrado', 404);
    }

    // Verificar si ya está bloqueado
    const yaBloqueo = await prisma.bloqueo.findUnique({
      where: {
        bloqueadorId_bloqueadoId: {
          bloqueadorId: currentUserId,
          bloqueadoId: id
        }
      }
    });

    if (yaBloqueo) {
      throw new AppError('Ya has bloqueado a este usuario', 400);
    }

    // Crear el bloqueo
    await prisma.bloqueo.create({
      data: {
        bloqueadorId: currentUserId,
        bloqueadoId: id
      }
    });

    // Si lo seguía, dejar de seguirlo
    await prisma.seguimiento.deleteMany({
      where: {
        seguidorId: currentUserId,
        seguidoId: id
      }
    });

    // Si él me seguía, eliminar ese seguimiento también
    await prisma.seguimiento.deleteMany({
      where: {
        seguidorId: id,
        seguidoId: currentUserId
      }
    });

    const nombreMostrar = usuarioABloquear.alias || `${usuarioABloquear.nombre} ${usuarioABloquear.apellido}`;

    res.json({
      success: true,
      message: `Has bloqueado a "${nombreMostrar}"`,
      data: {
        usuarioId: id,
        nombre: usuarioABloquear.nombre,
        apellido: usuarioABloquear.apellido,
        alias: usuarioABloquear.alias
      }
    });
  } catch (error) {
    next(error);
  }
};

// Desbloquear usuario
export const desbloquearUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.usuario.id;

    const usuarioADesbloquear = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombre: true, apellido: true, alias: true }
    });

    if (!usuarioADesbloquear) {
      throw new AppError('Usuario no encontrado', 404);
    }

    const bloqueo = await prisma.bloqueo.deleteMany({
      where: {
        bloqueadorId: currentUserId,
        bloqueadoId: id
      }
    });

    if (bloqueo.count === 0) {
      throw new AppError('No has bloqueado a este usuario', 404);
    }

    const nombreMostrar = usuarioADesbloquear.alias || `${usuarioADesbloquear.nombre} ${usuarioADesbloquear.apellido}`;

    res.json({
      success: true,
      message: `Has desbloqueado a "${nombreMostrar}"`,
      data: {
        usuarioId: id
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener usuarios bloqueados
export const getBloqueados = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id;

    const bloqueos = await prisma.bloqueo.findMany({
      where: {
        bloqueadorId: usuarioId
      },
      select: {
        bloqueado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            alias: true,
            foto: true
          }
        },
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const bloqueados = bloqueos.map(b => ({
      ...b.bloqueado,
      bloqueadoEn: b.createdAt
    }));

    res.json({
      success: true,
      bloqueados,
      total: bloqueados.length
    });
  } catch (error) {
    next(error);
  }
};
