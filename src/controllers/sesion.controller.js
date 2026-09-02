import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { calcularPrecioFinal, liberarPagoPostClase } from '../services/claseService.js';

// POST /clases/:id/sesiones — Crear sesión específica para una clase
// Solo el profesor dueño de la clase puede crear sesiones.
export const crearSesion = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id: claseId } = req.params;
    const { fecha, horaInicio, horaFin } = req.body;

    if (!fecha || !horaInicio || !horaFin) {
      throw new AppError('Fecha, hora de inicio y hora de fin son obligatorios', 400);
    }

    const clase = await prisma.clase.findUnique({
      where: { id: claseId },
      select: { id: true, profesorId: true, cupoMaximo: true, estado: true, tipoClase: true }
    });

    if (!clase) {
      throw new AppError('Clase no encontrada', 404);
    }

    if (clase.profesorId !== userId) {
      throw new AppError('Solo el profesor puede crear sesiones para su clase', 403);
    }

    if (!['ACTIVA', 'BORRADOR'].includes(clase.estado)) {
      throw new AppError('Solo se pueden crear sesiones para clases activas o en borrador', 400);
    }

    // Parsear fecha
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaSesion = new Date(year, month - 1, day);

    if (fechaSesion < new Date(new Date().setHours(0, 0, 0, 0))) {
      throw new AppError('No se pueden crear sesiones en fechas pasadas', 400);
    }

    // Verificar que no haya otra sesión de la misma clase en el mismo horario
    const sesionExistente = await prisma.sesionClase.findFirst({
      where: {
        claseId,
        fecha: fechaSesion,
        horaInicio,
        estado: { not: 'CANCELADA' }
      }
    });

    if (sesionExistente) {
      throw new AppError('Ya existe una sesión programada para esta clase en esa fecha y horario', 400);
    }

    // cuposDisponibles = cupoMaximo para grupales, 1 para individuales
    const cuposDisponibles = clase.tipoClase === 'INDIVIDUAL' ? 1 : (clase.cupoMaximo || 1);

    const sesion = await prisma.sesionClase.create({
      data: {
        claseId,
        fecha: fechaSesion,
        horaInicio,
        horaFin,
        cuposDisponibles
      },
      include: {
        clase: {
          select: { nombre: true, deporte: true, precioTotal: true }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Sesión creada correctamente',
      data: sesion
    });
  } catch (error) {
    next(error);
  }
};

// POST /clases/:id/sesiones/generar — Generar sesiones en lote desde horarios recurrentes
// Genera sesiones para las próximas N semanas según los horarios definidos en la clase.
export const generarSesiones = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id: claseId } = req.params;
    const { semanas = 4 } = req.body;

    const clase = await prisma.clase.findUnique({
      where: { id: claseId },
      include: {
        horarios: { where: { activo: true } }
      }
    });

    if (!clase) throw new AppError('Clase no encontrada', 404);
    if (clase.profesorId !== userId) throw new AppError('Solo el profesor puede generar sesiones', 403);
    if (clase.horarios.length === 0) throw new AppError('La clase no tiene horarios definidos', 400);

    const cuposDisponibles = clase.tipoClase === 'INDIVIDUAL' ? 1 : (clase.cupoMaximo || 1);
    const sesionesACrear = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    for (let semana = 0; semana < parseInt(semanas); semana++) {
      for (const horario of clase.horarios) {
        // Calcular la fecha para este día de la semana
        const fecha = new Date(hoy);
        const diasHastaTarget = (horario.diaSemana - hoy.getDay() + 7) % 7;
        fecha.setDate(hoy.getDate() + diasHastaTarget + (semana * 7));

        // No crear sesiones en el pasado
        if (fecha < hoy) continue;

        sesionesACrear.push({
          claseId,
          fecha,
          horaInicio: horario.horaInicio,
          horaFin: horario.horaFin,
          cuposDisponibles
        });
      }
    }

    if (sesionesACrear.length === 0) {
      throw new AppError('No se pudieron generar sesiones con los horarios actuales', 400);
    }

    // Filtrar sesiones que ya existen
    const sesionesExistentes = await prisma.sesionClase.findMany({
      where: {
        claseId,
        estado: { not: 'CANCELADA' },
        fecha: { in: sesionesACrear.map(s => s.fecha) }
      },
      select: { fecha: true, horaInicio: true }
    });

    const existentesSet = new Set(
      sesionesExistentes.map(s => `${s.fecha.toISOString()}_${s.horaInicio}`)
    );

    const sesionesNuevas = sesionesACrear.filter(
      s => !existentesSet.has(`${s.fecha.toISOString()}_${s.horaInicio}`)
    );

    if (sesionesNuevas.length === 0) {
      return res.json({
        success: true,
        message: 'Todas las sesiones ya existían',
        data: { creadas: 0 }
      });
    }

    await prisma.sesionClase.createMany({ data: sesionesNuevas });

    res.status(201).json({
      success: true,
      message: `Se crearon ${sesionesNuevas.length} sesiones`,
      data: { creadas: sesionesNuevas.length }
    });
  } catch (error) {
    next(error);
  }
};

// GET /sesiones/:id — Detalle de sesión con lista de participantes
// Los inscriptos ven la lista completa, los no inscriptos ven solo cantidad.
export const getSesionDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.usuario?.id;

    const sesion = await prisma.sesionClase.findUnique({
      where: { id },
      include: {
        clase: {
          include: {
            profesor: {
              select: { id: true, nombre: true, apellido: true, foto: true }
            },
            cancha: {
              select: { id: true, nombre: true, direccion: true, ciudad: true, latitud: true, longitud: true }
            }
          }
        },
        reservas: {
          where: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] } },
          include: {
            participante: {
              select: { id: true, nombre: true, alias: true, foto: true }
            }
          }
        },
        listaEspera: {
          where: { estado: { in: ['ESPERANDO', 'OFERTADO'] } },
          orderBy: { posicion: 'asc' },
          select: { id: true, usuarioId: true, posicion: true, estado: true, expiraEn: true }
        }
      }
    });

    if (!sesion) {
      throw new AppError('Sesión no encontrada', 404);
    }

    const precioFinal = calcularPrecioFinal(sesion.clase, sesion.cuposDisponibles, sesion.fecha);

    // Verificar si el usuario está inscripto o es el profesor
    const esInscripto = userId && sesion.reservas.some(r => r.participanteId === userId);
    const esProfesor = userId && userId === sesion.clase.profesorId;

    // Los inscriptos y el profesor ven la lista completa de participantes
    const inscriptos = (esInscripto || esProfesor)
      ? sesion.reservas.map(r => ({
          id: r.participante.id,
          nombre: r.participante.alias || r.participante.nombre,
          foto: r.participante.foto,
          estado: r.estado,
          montoPagado: esProfesor ? r.montoPagado : undefined
        }))
      : [];

    // Verificar si el usuario está en lista de espera
    let miPosicionEspera = null;
    if (userId) {
      const miEspera = sesion.listaEspera.find(le => le.usuarioId === userId);
      if (miEspera) {
        miPosicionEspera = {
          posicion: miEspera.posicion,
          estado: miEspera.estado,
          expiraEn: miEspera.expiraEn
        };
      }
    }

    res.json({
      success: true,
      data: {
        id: sesion.id,
        fecha: sesion.fecha,
        horaInicio: sesion.horaInicio,
        horaFin: sesion.horaFin,
        estado: sesion.estado,
        cuposDisponibles: sesion.cuposDisponibles,
        clase: {
          id: sesion.clase.id,
          nombre: sesion.clase.nombre,
          deporte: sesion.clase.deporte,
          tipoClase: sesion.clase.tipoClase,
          nivel: sesion.clase.nivel,
          precioProfesor: sesion.clase.precioProfesor,
          precioEspacio: sesion.clase.precioEspacio,
          precioTotal: sesion.clase.precioTotal,
          horasLimiteCancelacion: sesion.clase.horasLimiteCancelacion,
          profesor: {
            id: sesion.clase.profesor.id,
            nombre: `${sesion.clase.profesor.nombre} ${sesion.clase.profesor.apellido}`.trim(),
            foto: sesion.clase.profesor.foto
          },
          cancha: sesion.clase.cancha
        },
        inscriptos,
        cantidadInscriptos: sesion.reservas.length,
        listaEspera: sesion.listaEspera.length,
        miPosicionEspera,
        precioFinal
      }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /sesiones/:id/completar — Marcar sesión como completada (libera pagos)
// Solo el profesor puede marcar como completada.
export const completarSesion = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;

    const sesion = await prisma.sesionClase.findUnique({
      where: { id },
      include: { clase: { select: { profesorId: true } } }
    });

    if (!sesion) throw new AppError('Sesión no encontrada', 404);
    if (sesion.clase.profesorId !== userId && req.usuario.rol !== 'ADMIN') {
      throw new AppError('Solo el profesor o un admin puede completar sesiones', 403);
    }
    if (sesion.estado !== 'PROGRAMADA' && sesion.estado !== 'EN_CURSO') {
      throw new AppError('Solo se pueden completar sesiones programadas o en curso', 400);
    }

    const resultado = await liberarPagoPostClase(id);

    res.json({
      success: true,
      message: `Sesión completada. Se liberaron ${resultado.reservasLiberadas} pagos.`,
      data: resultado
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /sesiones/:id/cancelar — Cancelar sesión (reembolso automático)
export const cancelarSesion = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;
    const { motivo } = req.body;

    const sesion = await prisma.sesionClase.findUnique({
      where: { id },
      include: {
        clase: { select: { profesorId: true, nombre: true } },
        reservas: {
          where: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] } },
          select: { id: true, participanteId: true }
        }
      }
    });

    if (!sesion) throw new AppError('Sesión no encontrada', 404);
    if (sesion.clase.profesorId !== userId && req.usuario.rol !== 'ADMIN') {
      throw new AppError('Solo el profesor o un admin puede cancelar sesiones', 403);
    }
    if (sesion.estado === 'COMPLETADA' || sesion.estado === 'CANCELADA') {
      throw new AppError('No se puede cancelar una sesión que ya fue completada o cancelada', 400);
    }

    await prisma.$transaction(async (tx) => {
      // Cancelar sesión
      await tx.sesionClase.update({
        where: { id },
        data: { estado: 'CANCELADA' }
      });

      // Cancelar reservas activas (en producción aquí se procesarían reembolsos vía MP)
      await tx.reservaClase.updateMany({
        where: { sesionId: id, estado: { in: ['PENDIENTE', 'CONFIRMADA'] } },
        data: { estado: 'CANCELADA' }
      });

      // Expirar lista de espera
      await tx.listaEspera.updateMany({
        where: { sesionId: id, estado: { in: ['ESPERANDO', 'OFERTADO'] } },
        data: { estado: 'EXPIRADO' }
      });
    });

    // Notificar a todos los participantes
    const motivoTexto = motivo ? ` Motivo: ${motivo}` : '';
    for (const reserva of sesion.reservas) {
      await prisma.notificacionUsuario.create({
        data: {
          usuarioReceptorId: reserva.participanteId,
          usuarioEmisorId: userId,
          titulo: 'Sesión cancelada',
          mensaje: `La sesión de "${sesion.clase.nombre}" fue cancelada por el profesor.${motivoTexto} Se procesará tu reembolso.`,
          tipo: 'SESION_CANCELADA',
          datos: JSON.stringify({ sesionId: id })
        }
      });
    }

    res.json({
      success: true,
      message: `Sesión cancelada. Se notificaron ${sesion.reservas.length} participantes.`
    });
  } catch (error) {
    next(error);
  }
};
