import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// Enviar notificación a jugadores que han reservado en las canchas del propietario
export const enviarNotificacionJugadores = async (req, res, next) => {
  try {
    const propietarioId = req.usuario.id;
    const { titulo, mensaje, tipo, canchaIds, fechaInicio, fechaFin } = req.body;

    // Validar que el usuario es propietario
    if (req.usuario.rol !== 'PROPIETARIO') {
      throw new AppError('Solo los propietarios pueden enviar notificaciones', 403);
    }

    if (!titulo || !mensaje) {
      throw new AppError('Título y mensaje son obligatorios', 400);
    }

    // Obtener las canchas del propietario
    const misCanchas = await prisma.cancha.findMany({
      where: { propietarioId },
      select: { id: true, nombre: true }
    });

    if (misCanchas.length === 0) {
      throw new AppError('No tienes espacios registrados', 400);
    }

    // Determinar qué canchas usar
    let canchasParaNotificar = misCanchas;
    if (canchaIds && canchaIds.length > 0) {
      // Verificar que las canchas pertenecen al propietario
      canchasParaNotificar = misCanchas.filter(c => canchaIds.includes(c.id));
      if (canchasParaNotificar.length === 0) {
        throw new AppError('Los espacios seleccionados no te pertenecen', 400);
      }
    }

    const canchaIdsParaBuscar = canchasParaNotificar.map(c => c.id);
    const nombresCancha = canchasParaNotificar.map(c => c.nombre).join(', ');

    // Obtener jugadores únicos que han reservado en esas canchas
    const reservas = await prisma.reserva.findMany({
      where: {
        canchaId: { in: canchaIdsParaBuscar },
        estado: { in: ['CONFIRMADA', 'COMPLETADA', 'PENDIENTE'] }
      },
      select: {
        usuarioId: true
      },
      distinct: ['usuarioId']
    });

    const jugadorIds = [...new Set(reservas.map(r => r.usuarioId))];

    if (jugadorIds.length === 0) {
      throw new AppError('No hay participantes que hayan reservado en tus espacios', 400);
    }

    // Formatear fechas para el mensaje si están presentes
    let fechasTexto = '';
    if (fechaInicio) {
      const fechaInicioDate = new Date(fechaInicio);
      fechasTexto = fechaInicioDate.toLocaleDateString('es-AR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
      
      if (fechaFin) {
        const fechaFinDate = new Date(fechaFin);
        fechasTexto += ` al ${fechaFinDate.toLocaleDateString('es-AR', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long' 
        })}`;
      }
    }

    // Crear notificaciones para cada jugador
    const notificacionesData = jugadorIds.map(jugadorId => ({
      usuarioReceptorId: jugadorId,
      usuarioEmisorId: propietarioId,
      titulo: titulo,
      mensaje: mensaje,
      tipo: tipo?.toLowerCase() || 'promocion',
      leida: false,
      datos: JSON.stringify({
        tipo: tipo,
        canchaIds: canchaIdsParaBuscar,
        canchasNombres: nombresCancha,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        fechasTexto: fechasTexto
      })
    }));

    await prisma.notificacionUsuario.createMany({
      data: notificacionesData
    });

    res.json({
      success: true,
      message: `Notificación enviada a ${jugadorIds.length} participantes`,
      data: {
        cantidadEnviada: jugadorIds.length,
        canchas: nombresCancha,
        tipo: tipo
      }
    });

  } catch (error) {
    next(error);
  }
};

// Obtener jugadores que han reservado en mis canchas (para estadísticas)
export const getJugadoresMisCanchas = async (req, res, next) => {
  try {
    const propietarioId = req.usuario.id;

    if (req.usuario.rol !== 'PROPIETARIO') {
      throw new AppError('Solo los propietarios pueden acceder a esta información', 403);
    }

    // Obtener las canchas del propietario
    const misCanchas = await prisma.cancha.findMany({
      where: { propietarioId },
      select: { id: true }
    });

    const canchaIds = misCanchas.map(c => c.id);

    // Contar jugadores únicos
    const jugadores = await prisma.reserva.findMany({
      where: {
        canchaId: { in: canchaIds },
        estado: { in: ['CONFIRMADA', 'COMPLETADA', 'PENDIENTE'] }
      },
      select: {
        usuarioId: true
      },
      distinct: ['usuarioId']
    });

    res.json({
      success: true,
      data: {
        totalJugadores: jugadores.length
      }
    });

  } catch (error) {
    next(error);
  }
};
