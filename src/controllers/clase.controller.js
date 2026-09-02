import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { calcularPrecioFinal } from '../services/claseService.js';

// POST /clases — Crear clase (solo PROFESOR)
// Si la clase usa una cancha de un club con vínculo EXTERNO o aprobacionAutomatica=false,
// queda en PENDIENTE_APROBACION. Si es STAFF con aprobacionAutomatica=true, pasa a ACTIVA.
// Si el profesor no está verificado, solo puede crear en BORRADOR.
export const crearClase = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const {
      nombre, deporte, tipoClase, modalidadPago, cantidadClasesPaquete,
      descripcion, requisitos, nivel, precioProfesor, canchaId,
      cupoMaximo, precioDinamicoActivo, precioDinamicoConfig,
      horasLimiteCancelacion, horarios
    } = req.body;

    // Validaciones básicas
    if (!nombre || !deporte || !tipoClase || precioProfesor == null) {
      throw new AppError('Nombre, deporte, tipo de clase y precio son obligatorios', 400);
    }

    if (tipoClase === 'GRUPAL' && !cupoMaximo) {
      throw new AppError('Las clases grupales requieren cupo máximo', 400);
    }

    // Verificar que el usuario es profesor
    const profesor = await prisma.usuario.findUnique({
      where: { id: userId },
      include: { perfilProfesor: true }
    });

    if (!profesor?.esProfesor || !profesor.perfilProfesor) {
      throw new AppError('Debes tener un perfil de profesor para crear clases', 403);
    }

    let precioEspacio = null;
    let requiereAprobacionClub = false;
    let estadoInicial = 'BORRADOR';

    // Si usa cancha de un club, verificar vínculo
    if (canchaId) {
      const cancha = await prisma.cancha.findUnique({
        where: { id: canchaId },
        select: { id: true, propietarioId: true, nombre: true, activa: true, precioPorHora: true }
      });

      if (!cancha || !cancha.activa) {
        throw new AppError('Espacio no encontrado o no está activo', 404);
      }

      // Buscar vínculo activo entre profesor y propietario del espacio
      const vinculo = await prisma.vinculoProfesorEstablecimiento.findUnique({
        where: {
          profesorId_establecimientoId: {
            profesorId: userId,
            establecimientoId: cancha.propietarioId
          }
        }
      });

      if (!vinculo || vinculo.estado !== 'ACTIVO') {
        throw new AppError('No tienes un vínculo activo con el propietario de este espacio. Solicita vinculación primero.', 403);
      }

      // Calcular precio espacio si el pago va por la app
      if (vinculo.metodoPagoEspacio === 'APP') {
        precioEspacio = cancha.precioPorHora;
      }

      // Determinar si requiere aprobación
      if (vinculo.tipoVinculo === 'STAFF' && vinculo.aprobacionAutomatica) {
        requiereAprobacionClub = false;
        // Si el profesor está verificado, va directo a ACTIVA
        estadoInicial = profesor.perfilProfesor.verificado ? 'ACTIVA' : 'BORRADOR';
      } else {
        requiereAprobacionClub = true;
        estadoInicial = profesor.perfilProfesor.verificado ? 'PENDIENTE_APROBACION' : 'BORRADOR';
      }
    } else {
      // Clase sin espacio fijo: si profesor verificado, va a ACTIVA
      estadoInicial = profesor.perfilProfesor.verificado ? 'ACTIVA' : 'BORRADOR';
    }

    const precioTotal = parseFloat(precioProfesor) + (precioEspacio || 0);

    const clase = await prisma.clase.create({
      data: {
        profesorId: userId,
        canchaId: canchaId || null,
        nombre,
        deporte,
        tipoClase,
        modalidadPago: modalidadPago || 'POR_CLASE',
        cantidadClasesPaquete: cantidadClasesPaquete ? parseInt(cantidadClasesPaquete) : null,
        descripcion: descripcion || null,
        requisitos: requisitos || null,
        nivel: nivel || 'PRINCIPIANTE',
        precioProfesor: parseFloat(precioProfesor),
        precioEspacio,
        precioTotal,
        cupoMaximo: cupoMaximo ? parseInt(cupoMaximo) : null,
        precioDinamicoActivo: precioDinamicoActivo || false,
        precioDinamicoConfig: precioDinamicoConfig || null,
        requiereAprobacionClub,
        estado: estadoInicial,
        horasLimiteCancelacion: horasLimiteCancelacion ? parseInt(horasLimiteCancelacion) : 24,
        horarios: horarios && horarios.length > 0 ? {
          create: horarios.map(h => ({
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFin: h.horaFin
          }))
        } : undefined
      },
      include: {
        cancha: { select: { id: true, nombre: true, direccion: true } },
        horarios: true
      }
    });

    // Si requiere aprobación, notificar al propietario del club
    if (requiereAprobacionClub && canchaId) {
      const cancha = await prisma.cancha.findUnique({
        where: { id: canchaId },
        select: { propietarioId: true }
      });
      if (cancha) {
        await prisma.notificacionUsuario.create({
          data: {
            usuarioReceptorId: cancha.propietarioId,
            usuarioEmisorId: userId,
            titulo: 'Nueva clase para aprobar',
            mensaje: `${req.usuario.nombre} quiere crear la clase "${nombre}" en tu establecimiento.`,
            tipo: 'CLASE_PENDIENTE_APROBACION',
            datos: JSON.stringify({ claseId: clase.id })
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: estadoInicial === 'ACTIVA'
        ? 'Clase creada y publicada'
        : estadoInicial === 'PENDIENTE_APROBACION'
          ? 'Clase creada. Queda pendiente de aprobación del establecimiento.'
          : 'Clase creada en borrador. Será publicada cuando tu perfil sea verificado.',
      data: clase
    });
  } catch (error) {
    next(error);
  }
};

// GET /clases — Listar clases con filtros
// Devuelve exactamente los campos que necesita la tarjeta de clase en el feed.
export const getClases = async (req, res, next) => {
  try {
    const {
      deporte, ciudad, tipoClase, nivel, precioMin, precioMax,
      profesorId, canchaId, pagina = 1, limite = 20,
      latitud, longitud, radio
    } = req.query;

    const page = parseInt(pagina);
    const limit = parseInt(limite);
    const skip = (page - 1) * limit;

    const where = { estado: 'ACTIVA' };

    if (deporte) where.deporte = deporte;
    if (tipoClase) where.tipoClase = tipoClase;
    if (nivel) where.nivel = nivel;
    if (profesorId) where.profesorId = profesorId;
    if (canchaId) where.canchaId = canchaId;

    if (precioMin || precioMax) {
      where.precioTotal = {};
      if (precioMin) where.precioTotal.gte = parseFloat(precioMin);
      if (precioMax) where.precioTotal.lte = parseFloat(precioMax);
    }

    if (ciudad) {
      where.cancha = { ciudad: { contains: ciudad, mode: 'insensitive' } };
    }

    const [clases, total] = await Promise.all([
      prisma.clase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          profesor: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              foto: true,
              perfilProfesor: {
                select: { calificacionPromedio: true, verificado: true }
              }
            }
          },
          cancha: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
              ciudad: true,
              latitud: true,
              longitud: true
            }
          },
          sesiones: {
            where: {
              fecha: { gte: new Date() },
              estado: 'PROGRAMADA'
            },
            take: 1,
            orderBy: { fecha: 'asc' },
            select: {
              id: true,
              fecha: true,
              horaInicio: true,
              horaFin: true,
              cuposDisponibles: true
            }
          }
        }
      }),
      prisma.clase.count({ where })
    ]);

    // Formatear respuesta alineada a la UX de la tarjeta de clase
    const clasesFormateadas = clases.map(c => {
      const proximaSesion = c.sesiones[0] || null;
      const cuposDisponibles = proximaSesion?.cuposDisponibles ?? c.cupoMaximo;
      const estaLlena = c.tipoClase === 'GRUPAL' && cuposDisponibles != null && cuposDisponibles <= 0;
      const precioFinal = proximaSesion
        ? calcularPrecioFinal(c, cuposDisponibles, proximaSesion.fecha)
        : c.precioTotal;

      return {
        id: c.id,
        nombre: c.nombre,
        deporte: c.deporte,
        tipoClase: c.tipoClase,
        nivel: c.nivel,
        modalidadPago: c.modalidadPago,
        profesor: {
          id: c.profesor.id,
          nombre: `${c.profesor.nombre} ${c.profesor.apellido}`.trim(),
          foto: c.profesor.foto,
          calificacion: c.profesor.perfilProfesor?.calificacionPromedio || 0,
          verificado: c.profesor.perfilProfesor?.verificado || false
        },
        cancha: c.cancha ? {
          id: c.cancha.id,
          nombre: c.cancha.nombre,
          direccion: c.cancha.direccion,
          latitud: c.cancha.latitud,
          longitud: c.cancha.longitud
        } : null,
        proximaSesion,
        cupoMaximo: c.cupoMaximo,
        cupoActual: c.cupoMaximo != null ? (c.cupoMaximo - (cuposDisponibles || 0)) : null,
        cuposDisponibles,
        precioProfesor: c.precioProfesor,
        precioEspacio: c.precioEspacio,
        precioTotal: c.precioTotal,
        precioFinal,
        precioDinamicoActivo: c.precioDinamicoActivo,
        estaLlena
      };
    });

    res.json({
      success: true,
      clases: clasesFormateadas,
      total,
      pagina: page
    });
  } catch (error) {
    next(error);
  }
};

// GET /clases/:id — Detalle de clase con sesiones próximas y asistentes
export const getClaseDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.usuario?.id;

    const clase = await prisma.clase.findUnique({
      where: { id },
      include: {
        profesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            foto: true,
            alias: true,
            perfilProfesor: {
              select: {
                calificacionPromedio: true,
                cantidadResenas: true,
                verificado: true,
                deportes: true,
                niveles: true
              }
            }
          }
        },
        cancha: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            ciudad: true,
            provincia: true,
            latitud: true,
            longitud: true,
            imagenPrincipal: true
          }
        },
        horarios: { where: { activo: true } },
        sesiones: {
          where: {
            fecha: { gte: new Date() },
            estado: { in: ['PROGRAMADA', 'EN_CURSO'] }
          },
          orderBy: { fecha: 'asc' },
          take: 10,
          include: {
            reservas: {
              where: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] } },
              include: {
                participante: {
                  select: { id: true, nombre: true, alias: true, foto: true }
                }
              }
            },
            _count: {
              select: {
                listaEspera: { where: { estado: { in: ['ESPERANDO', 'OFERTADO'] } } }
              }
            }
          }
        }
      }
    });

    if (!clase) {
      throw new AppError('Clase no encontrada', 404);
    }

    // Obtener últimas 5 reseñas del profesor para esta clase
    const resenas = await prisma.resenaClase.findMany({
      where: { profesorId: clase.profesorId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        participante: {
          select: { id: true, nombre: true, alias: true, foto: true }
        }
      }
    });

    // Verificar si el usuario actual está inscripto en alguna sesión
    let miReserva = null;
    if (userId) {
      miReserva = await prisma.reservaClase.findFirst({
        where: {
          participanteId: userId,
          sesion: { claseId: id },
          estado: { in: ['PENDIENTE', 'CONFIRMADA'] }
        },
        select: { id: true, sesionId: true, estado: true }
      });
    }

    const sesionesFormateadas = clase.sesiones.map(s => {
      const precioFinal = calcularPrecioFinal(clase, s.cuposDisponibles, s.fecha);
      return {
        id: s.id,
        fecha: s.fecha,
        horaInicio: s.horaInicio,
        horaFin: s.horaFin,
        estado: s.estado,
        cuposDisponibles: s.cuposDisponibles,
        inscriptos: s.reservas.map(r => ({
          id: r.participante.id,
          nombre: r.participante.alias || r.participante.nombre,
          foto: r.participante.foto,
          estado: r.estado
        })),
        listaEspera: s._count.listaEspera,
        precioFinal
      };
    });

    res.json({
      success: true,
      data: {
        id: clase.id,
        nombre: clase.nombre,
        deporte: clase.deporte,
        tipoClase: clase.tipoClase,
        modalidadPago: clase.modalidadPago,
        cantidadClasesPaquete: clase.cantidadClasesPaquete,
        descripcion: clase.descripcion,
        requisitos: clase.requisitos,
        nivel: clase.nivel,
        precioProfesor: clase.precioProfesor,
        precioEspacio: clase.precioEspacio,
        precioTotal: clase.precioTotal,
        precioDinamicoActivo: clase.precioDinamicoActivo,
        cupoMaximo: clase.cupoMaximo,
        horasLimiteCancelacion: clase.horasLimiteCancelacion,
        estado: clase.estado,
        profesor: {
          id: clase.profesor.id,
          nombre: `${clase.profesor.nombre} ${clase.profesor.apellido}`.trim(),
          foto: clase.profesor.foto,
          alias: clase.profesor.alias,
          calificacion: clase.profesor.perfilProfesor?.calificacionPromedio || 0,
          cantidadResenas: clase.profesor.perfilProfesor?.cantidadResenas || 0,
          verificado: clase.profesor.perfilProfesor?.verificado || false
        },
        cancha: clase.cancha,
        horarios: clase.horarios.map(h => ({
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin
        })),
        sesiones: sesionesFormateadas,
        resenas: resenas.map(r => ({
          id: r.id,
          calificacion: r.calificacion,
          comentario: r.comentario,
          fecha: r.createdAt,
          participante: {
            nombre: r.participante.alias || r.participante.nombre,
            foto: r.participante.foto
          }
        })),
        miReserva
      }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /clases/:id/estado — Aprobar/rechazar/pausar una clase
// Puede ser ejecutado por: propietario del club (aprobación) o admin
export const cambiarEstadoClase = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;
    const { estado, motivoRechazo } = req.body;

    const estadosValidos = ['ACTIVA', 'PAUSADA', 'CANCELADA', 'PENDIENTE_APROBACION'];
    if (!estadosValidos.includes(estado)) {
      throw new AppError(`Estado debe ser uno de: ${estadosValidos.join(', ')}`, 400);
    }

    const clase = await prisma.clase.findUnique({
      where: { id },
      include: {
        cancha: { select: { propietarioId: true } },
        profesor: { select: { id: true, nombre: true } }
      }
    });

    if (!clase) {
      throw new AppError('Clase no encontrada', 404);
    }

    // Permisos: el profesor puede pausar/cancelar sus propias clases
    // El propietario del club puede aprobar/rechazar clases en su establecimiento
    // El admin puede hacer todo
    const esProfesor = userId === clase.profesorId;
    const esPropietario = clase.cancha && userId === clase.cancha.propietarioId;
    const esAdmin = req.usuario.rol === 'ADMIN';

    if (!esProfesor && !esPropietario && !esAdmin) {
      throw new AppError('No tienes permisos para modificar esta clase', 403);
    }

    // Validar transiciones de estado
    if (estado === 'ACTIVA' && clase.estado === 'PENDIENTE_APROBACION') {
      if (!esPropietario && !esAdmin) {
        throw new AppError('Solo el propietario del establecimiento o un admin puede aprobar clases', 403);
      }
    }

    if (estado === 'CANCELADA' && clase.estado === 'PENDIENTE_APROBACION' && !esPropietario && !esAdmin) {
      // Rechazar = cancelar desde la vista del propietario
    }

    const updateData = { estado };
    if (estado === 'CANCELADA' && motivoRechazo) {
      updateData.motivoRechazo = motivoRechazo;
    }

    const claseActualizada = await prisma.clase.update({
      where: { id },
      data: updateData
    });

    // Notificar al profesor si la acción la hizo el propietario/admin
    if (!esProfesor) {
      let titulo, mensaje;
      if (estado === 'ACTIVA') {
        titulo = '¡Tu clase fue aprobada!';
        mensaje = `La clase "${clase.nombre}" fue aprobada y ya está publicada.`;
      } else if (estado === 'CANCELADA') {
        titulo = 'Clase rechazada';
        mensaje = motivoRechazo
          ? `Tu clase "${clase.nombre}" fue rechazada. Motivo: ${motivoRechazo}`
          : `Tu clase "${clase.nombre}" fue rechazada.`;
      } else if (estado === 'PAUSADA') {
        titulo = 'Clase pausada';
        mensaje = `Tu clase "${clase.nombre}" fue pausada por el establecimiento.`;
      }

      if (titulo) {
        await prisma.notificacionUsuario.create({
          data: {
            usuarioReceptorId: clase.profesorId,
            usuarioEmisorId: userId,
            titulo,
            mensaje,
            tipo: 'CLASE_ESTADO_CAMBIO',
            datos: JSON.stringify({ claseId: id, nuevoEstado: estado })
          }
        });
      }
    }

    res.json({
      success: true,
      message: `Clase actualizada a ${estado}`,
      data: claseActualizada
    });
  } catch (error) {
    next(error);
  }
};

// GET /clases/mis-clases — Clases del profesor autenticado (panel del profesor)
export const getMisClases = async (req, res, next) => {
  try {
    const userId = req.usuario.id;

    const clases = await prisma.clase.findMany({
      where: { profesorId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        cancha: { select: { id: true, nombre: true, direccion: true } },
        horarios: { where: { activo: true } },
        sesiones: {
          where: {
            fecha: { gte: new Date() },
            estado: 'PROGRAMADA'
          },
          take: 1,
          orderBy: { fecha: 'asc' },
          select: {
            id: true,
            fecha: true,
            horaInicio: true,
            cuposDisponibles: true,
            _count: {
              select: {
                reservas: { where: { estado: { in: ['PENDIENTE', 'CONFIRMADA'] } } }
              }
            }
          }
        },
        _count: {
          select: {
            sesiones: { where: { estado: 'PROGRAMADA' } }
          }
        }
      }
    });

    const clasesFormateadas = clases.map(c => ({
      id: c.id,
      nombre: c.nombre,
      deporte: c.deporte,
      tipoClase: c.tipoClase,
      nivel: c.nivel,
      estado: c.estado,
      precioTotal: c.precioTotal,
      cupoMaximo: c.cupoMaximo,
      cancha: c.cancha,
      horarios: c.horarios,
      proximaSesion: c.sesiones[0] ? {
        id: c.sesiones[0].id,
        fecha: c.sesiones[0].fecha,
        horaInicio: c.sesiones[0].horaInicio,
        cuposDisponibles: c.sesiones[0].cuposDisponibles,
        inscriptos: c.sesiones[0]._count.reservas
      } : null,
      totalSesionesProgramadas: c._count.sesiones
    }));

    res.json({ success: true, data: clasesFormateadas });
  } catch (error) {
    next(error);
  }
};
