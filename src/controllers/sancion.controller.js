import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Crear una nueva sanción
export const crearSancion = async (req, res) => {
  try {
    const propietarioId = req.usuario.id;
    const { participanteId, espacioId, tipo, motivo } = req.body;

    // Validar que el usuario es propietario
    if (req.usuario.rol !== 'PROPIETARIO') {
      return res.status(403).json({
        success: false,
        message: 'Solo los propietarios pueden aplicar sanciones'
      });
    }

    // Verificar que el participante existe
    const participante = await prisma.usuario.findUnique({
      where: { id: participanteId }
    });

    if (!participante) {
      return res.status(404).json({
        success: false,
        message: 'Participante no encontrado'
      });
    }

    // Si se especifica espacio, verificar que pertenece al propietario
    if (espacioId) {
      const espacio = await prisma.cancha.findFirst({
        where: {
          id: espacioId,
          propietarioId: propietarioId
        }
      });

      if (!espacio) {
        return res.status(403).json({
          success: false,
          message: 'El espacio no te pertenece'
        });
      }
    }

    // Verificar si ya existe una sanción activa para este participante/espacio
    const sancionExistente = await prisma.sancion.findFirst({
      where: {
        propietarioId,
        participanteId,
        espacioId: espacioId || null,
        activa: true
      }
    });

    if (sancionExistente) {
      // Actualizar la sanción existente
      const sancionActualizada = await prisma.sancion.update({
        where: { id: sancionExistente.id },
        data: { tipo, motivo },
        include: {
          participante: {
            select: { id: true, nombre: true, apellido: true, email: true, foto: true }
          },
          espacio: {
            select: { id: true, nombre: true }
          }
        }
      });

      return res.json({
        success: true,
        message: 'Sanción actualizada',
        data: sancionActualizada
      });
    }

    // Crear nueva sanción
    const sancion = await prisma.sancion.create({
      data: {
        propietarioId,
        participanteId,
        espacioId: espacioId || null,
        tipo,
        motivo
      },
      include: {
        participante: {
          select: { id: true, nombre: true, apellido: true, email: true, foto: true }
        },
        espacio: {
          select: { id: true, nombre: true }
        }
      }
    });

    // Enviar notificación al participante si es ADVERTIDO o BANEADO
    if (tipo === 'ADVERTIDO' || tipo === 'BANEADO') {
      const mensajes = {
        ADVERTIDO: '⚠️ Has recibido una advertencia. Estás marcado como "Fuera de Juego". Mejora tu conducta para evitar sanciones mayores.',
        BANEADO: '🚫 Has sido sancionado y no podrás reservar en este espacio. Contacta al propietario para más información.'
      };

      await prisma.notificacionUsuario.create({
        data: {
          usuarioReceptorId: participanteId,
          usuarioEmisorId: propietarioId,
          titulo: tipo === 'BANEADO' ? '🚫 Sanción Aplicada' : '⚠️ Advertencia Recibida',
          mensaje: mensajes[tipo],
          tipo: 'sancion',
          datos: JSON.stringify({ sancionId: sancion.id, tipo, espacioId })
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Sanción aplicada correctamente',
      data: sancion
    });

  } catch (error) {
    console.error('Error creando sanción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al aplicar la sanción'
    });
  }
};

// Obtener sanciones aplicadas por el propietario
export const getMisSanciones = async (req, res) => {
  try {
    const propietarioId = req.usuario.id;

    const sanciones = await prisma.sancion.findMany({
      where: {
        propietarioId,
        activa: true
      },
      include: {
        jugador: {
          select: { 
            id: true, 
            nombre: true, 
            apellido: true, 
            email: true, 
            telefono: true,
            foto: true 
          }
        },
        cancha: {
          select: { id: true, nombre: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: sanciones
    });

  } catch (error) {
    console.error('Error obteniendo sanciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las sanciones'
    });
  }
};

// Obtener jugadores que han reservado en mis canchas (para aplicar sanciones)
export const getJugadoresMisCanchas = async (req, res) => {
  try {
    const propietarioId = req.usuario.id;
    const { search } = req.query;

    // Obtener las canchas del propietario
    const misCanchas = await prisma.cancha.findMany({
      where: { propietarioId },
      select: { id: true }
    });

    const canchaIds = misCanchas.map(c => c.id);

    // Buscar jugadores que han reservado en las canchas
    let whereClause = {
      canchaId: { in: canchaIds },
      usuario: {
        rol: 'JUGADOR'
      }
    };

    // Obtener reservas con jugadores únicos
    const reservas = await prisma.reserva.findMany({
      where: whereClause,
      select: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            foto: true
          }
        }
      },
      distinct: ['usuarioId']
    });

    // Extraer jugadores únicos
    let jugadores = reservas.map(r => r.usuario);

    // Filtrar por búsqueda si existe
    if (search) {
      const searchLower = search.toLowerCase();
      jugadores = jugadores.filter(j => 
        j.nombre.toLowerCase().includes(searchLower) ||
        j.apellido.toLowerCase().includes(searchLower) ||
        j.email.toLowerCase().includes(searchLower)
      );
    }

    // Agregar estado de sanción actual si existe
    const jugadoresConSancion = await Promise.all(
      jugadores.map(async (jugador) => {
        const sancion = await prisma.sancion.findFirst({
          where: {
            propietarioId,
            jugadorId: jugador.id,
            activa: true
          },
          select: { tipo: true, motivo: true, canchaId: true }
        });
        return {
          ...jugador,
          sancionActual: sancion || null
        };
      })
    );

    res.json({
      success: true,
      data: jugadoresConSancion
    });

  } catch (error) {
    console.error('Error obteniendo jugadores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los participantes'
    });
  }
};

// Eliminar/desactivar una sanción
export const eliminarSancion = async (req, res) => {
  try {
    const propietarioId = req.usuario.id;
    const { id } = req.params;

    const sancion = await prisma.sancion.findFirst({
      where: {
        id,
        propietarioId
      }
    });

    if (!sancion) {
      return res.status(404).json({
        success: false,
        message: 'Sanción no encontrada'
      });
    }

    await prisma.sancion.update({
      where: { id },
      data: { activa: false }
    });

    // Notificar al jugador que la sanción fue levantada
    await prisma.notificacionUsuario.create({
      data: {
        usuarioReceptorId: sancion.jugadorId,
        usuarioEmisorId: propietarioId,
        titulo: '✅ Sanción Levantada',
        mensaje: 'Tu sanción ha sido levantada. Ya puedes volver a reservar normalmente.',
        tipo: 'sancion',
        datos: JSON.stringify({ sancionId: id })
      }
    });

    res.json({
      success: true,
      message: 'Sanción eliminada correctamente'
    });

  } catch (error) {
    console.error('Error eliminando sanción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la sanción'
    });
  }
};

// Verificar si un jugador está sancionado para una cancha específica
export const verificarSancion = async (req, res) => {
  try {
    const { jugadorId, canchaId } = req.params;

    // Obtener la cancha para saber el propietario
    const cancha = await prisma.cancha.findUnique({
      where: { id: canchaId },
      select: { propietarioId: true }
    });

    if (!cancha) {
      return res.status(404).json({
        success: false,
        message: 'Espacio no encontrado'
      });
    }

    // Buscar sanción activa
    const sancion = await prisma.sancion.findFirst({
      where: {
        jugadorId,
        propietarioId: cancha.propietarioId,
        activa: true,
        OR: [
          { canchaId: canchaId },
          { canchaId: null } // Sanción general para todas las canchas del propietario
        ]
      },
      include: {
        propietario: {
          select: { nombre: true, apellido: true }
        }
      }
    });

    res.json({
      success: true,
      sancionado: !!sancion,
      sancion: sancion ? {
        tipo: sancion.tipo,
        motivo: sancion.motivo,
        propietario: `${sancion.propietario.nombre} ${sancion.propietario.apellido}`
      } : null
    });

  } catch (error) {
    console.error('Error verificando sanción:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar sanción'
    });
  }
};

// Buscar jugadores por email/nombre (para sancionar aunque no hayan reservado)
export const buscarJugadores = async (req, res) => {
  try {
    const { search } = req.query;
    const propietarioId = req.usuario.id;

    if (!search || search.length < 3) {
      return res.json({
        success: true,
        data: []
      });
    }

    const jugadores = await prisma.usuario.findMany({
      where: {
        rol: 'JUGADOR',
        activo: true,
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { apellido: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        foto: true
      },
      take: 20
    });

    // Agregar estado de sanción actual
    const jugadoresConSancion = await Promise.all(
      jugadores.map(async (jugador) => {
        const sancion = await prisma.sancion.findFirst({
          where: {
            propietarioId,
            jugadorId: jugador.id,
            activa: true
          },
          select: { tipo: true, motivo: true }
        });
        return {
          ...jugador,
          sancionActual: sancion || null
        };
      })
    );

    res.json({
      success: true,
      data: jugadoresConSancion
    });

  } catch (error) {
    console.error('Error buscando jugadores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar participantes'
    });
  }
};
