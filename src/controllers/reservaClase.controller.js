import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  calcularPrecioFinal,
  procesarSplitPago,
  liberarSiguienteEnEspera,
  expirarListaEspera
} from '../services/claseService.js';

// POST /sesiones/:id/reservar — Reservar lugar en una sesión
// Verifica cupos, calcula precio dinámico, procesa split de pago.
// Si no hay cupos disponibles, devuelve error indicando usar lista de espera.
export const reservarSesion = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id: sesionId } = req.params;

    // Transacción para evitar race conditions en cupos
    const resultado = await prisma.$transaction(async (tx) => {
      const sesion = await tx.sesionClase.findUnique({
        where: { id: sesionId },
        include: {
          clase: {
            include: {
              cancha: { select: { propietarioId: true, precioPorHora: true } }
            }
          }
        }
      });

      if (!sesion) throw new AppError('Sesión no encontrada', 404);
      if (sesion.estado !== 'PROGRAMADA') {
        throw new AppError('Solo se pueden reservar sesiones programadas', 400);
      }

      if (sesion.clase.estado !== 'ACTIVA') {
        throw new AppError('La clase no está activa', 400);
      }

      // Verificar que no esté ya reservado
      const reservaExistente = await tx.reservaClase.findUnique({
        where: {
          sesionId_participanteId: {
            sesionId,
            participanteId: userId
          }
        }
      });

      if (reservaExistente && reservaExistente.estado !== 'CANCELADA') {
        throw new AppError('Ya tienes una reserva para esta sesión', 400);
      }

      // Verificar cupos
      if (sesion.cuposDisponibles <= 0) {
        throw new AppError('No hay cupos disponibles. Puedes unirte a la lista de espera.', 400);
      }

      // Calcular precio final (con precio dinámico si aplica)
      const precioFinal = calcularPrecioFinal(
        sesion.clase,
        sesion.cuposDisponibles,
        sesion.fecha
      );

      // Obtener configuración del vínculo para el split
      let metodoPagoEspacio = 'EXTERNO';
      let comisionClub = null;

      if (sesion.clase.canchaId && sesion.clase.cancha) {
        const vinculo = await tx.vinculoProfesorEstablecimiento.findUnique({
          where: {
            profesorId_establecimientoId: {
              profesorId: sesion.clase.profesorId,
              establecimientoId: sesion.clase.cancha.propietarioId
            }
          }
        });

        if (vinculo && vinculo.estado === 'ACTIVO') {
          metodoPagoEspacio = vinculo.metodoPagoEspacio;
          comisionClub = vinculo.comisionClub;
        }
      }

      // Calcular split de pago
      const split = procesarSplitPago({
        precioFinal,
        precioProfesor: sesion.clase.precioProfesor,
        precioEspacio: sesion.clase.precioEspacio,
        metodoPagoEspacio,
        comisionClub
      });

      // Crear o reactivar reserva
      let reserva;
      if (reservaExistente && reservaExistente.estado === 'CANCELADA') {
        reserva = await tx.reservaClase.update({
          where: { id: reservaExistente.id },
          data: {
            estado: 'PENDIENTE',
            montoPagado: precioFinal,
            splitProfesor: split.splitProfesor,
            splitClub: split.splitClub,
            splitApp: split.splitApp,
            pagoLiberado: false,
            pagoLiberadoAt: null,
            mpPreferenceId: null,
            mpPaymentId: null
          }
        });
      } else {
        reserva = await tx.reservaClase.create({
          data: {
            sesionId,
            participanteId: userId,
            estado: 'PENDIENTE',
            montoPagado: precioFinal,
            splitProfesor: split.splitProfesor,
            splitClub: split.splitClub,
            splitApp: split.splitApp
          }
        });
      }

      // Decrementar cupos disponibles
      await tx.sesionClase.update({
        where: { id: sesionId },
        data: { cuposDisponibles: { decrement: 1 } }
      });

      return { reserva, precioFinal, split, sesion };
    });

    // Notificar al profesor
    await prisma.notificacionUsuario.create({
      data: {
        usuarioReceptorId: resultado.sesion.clase.profesorId,
        usuarioEmisorId: userId,
        titulo: 'Nuevo inscripto',
        mensaje: `${req.usuario.nombre} se inscribió a tu clase "${resultado.sesion.clase.nombre}".`,
        tipo: 'NUEVA_RESERVA_CLASE',
        datos: JSON.stringify({
          reservaClaseId: resultado.reserva.id,
          sesionId
        })
      }
    });

    res.status(201).json({
      success: true,
      message: 'Reserva creada. Procede al pago para confirmar tu lugar.',
      data: {
        reservaId: resultado.reserva.id,
        sesionId,
        precioFinal: resultado.precioFinal,
        splitProfesor: resultado.split.splitProfesor,
        splitClub: resultado.split.splitClub,
        splitApp: resultado.split.splitApp,
        estado: resultado.reserva.estado
      }
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /reservas-clase/:id — Cancelar reserva (con lógica de lista de espera)
// Si se cancela dentro del límite, es sin costo. Se libera cupo y se oferta al siguiente en espera.
export const cancelarReserva = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;

    const reserva = await prisma.reservaClase.findUnique({
      where: { id },
      include: {
        sesion: {
          include: {
            clase: {
              select: {
                id: true,
                nombre: true,
                profesorId: true,
                horasLimiteCancelacion: true
              }
            }
          }
        }
      }
    });

    if (!reserva) throw new AppError('Reserva no encontrada', 404);
    if (reserva.participanteId !== userId && req.usuario.rol !== 'ADMIN') {
      throw new AppError('Solo puedes cancelar tus propias reservas', 403);
    }
    if (reserva.estado === 'CANCELADA' || reserva.estado === 'COMPLETADA') {
      throw new AppError('Esta reserva ya fue cancelada o completada', 400);
    }

    // Verificar política de cancelación
    const horasHastaSesion = (new Date(reserva.sesion.fecha).getTime() - Date.now()) / (1000 * 60 * 60);
    const cancelacionGratuita = horasHastaSesion >= reserva.sesion.clase.horasLimiteCancelacion;

    await prisma.$transaction(async (tx) => {
      // Cancelar reserva
      await tx.reservaClase.update({
        where: { id },
        data: { estado: 'CANCELADA' }
      });

      // Incrementar cupos disponibles
      await tx.sesionClase.update({
        where: { id: reserva.sesionId },
        data: { cuposDisponibles: { increment: 1 } }
      });
    });

    // Liberar al siguiente en lista de espera (fuera de la transacción principal)
    const siguienteEnEspera = await liberarSiguienteEnEspera(reserva.sesionId);

    // Notificar al profesor
    await prisma.notificacionUsuario.create({
      data: {
        usuarioReceptorId: reserva.sesion.clase.profesorId,
        usuarioEmisorId: userId,
        titulo: 'Cancelación de reserva',
        mensaje: `${req.usuario.nombre} canceló su reserva para "${reserva.sesion.clase.nombre}".`,
        tipo: 'CANCELACION_RESERVA_CLASE',
        datos: JSON.stringify({ reservaClaseId: id, sesionId: reserva.sesionId })
      }
    });

    res.json({
      success: true,
      message: cancelacionGratuita
        ? 'Reserva cancelada. Se procesará tu reembolso.'
        : `Reserva cancelada. Cancelación fuera del límite de ${reserva.sesion.clase.horasLimiteCancelacion}hs, sujeto a política de reembolso.`,
      data: {
        cancelacionGratuita,
        reembolso: cancelacionGratuita ? reserva.montoPagado : 0,
        siguienteEnEspera: !!siguienteEnEspera
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /reservas-clase/:id/pago — Procesar pago vía Mercado Pago
// Crea preferencia de pago en MP Marketplace con split de pagos.
// En producción usa la API de MP. Aquí se simula la estructura.
export const procesarPago = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;

    const reserva = await prisma.reservaClase.findUnique({
      where: { id },
      include: {
        sesion: {
          include: {
            clase: {
              include: {
                profesor: { select: { id: true, nombre: true, mpAccessToken: true, mpConnected: true } },
                cancha: {
                  select: {
                    nombre: true,
                    propietario: {
                      select: { id: true, mpAccessToken: true, mpConnected: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!reserva) throw new AppError('Reserva no encontrada', 404);
    if (reserva.participanteId !== userId) {
      throw new AppError('Solo puedes pagar tus propias reservas', 403);
    }
    if (reserva.estado !== 'PENDIENTE') {
      throw new AppError('Esta reserva no está pendiente de pago', 400);
    }

    const clase = reserva.sesion.clase;

    // Verificar que el profesor tenga MP configurado
    if (!clase.profesor.mpConnected || !clase.profesor.mpAccessToken) {
      throw new AppError('El profesor aún no configuró su cuenta de Mercado Pago', 400);
    }

    // Construir metadata para la preferencia de MP
    // En producción, aquí se crea la preferencia vía MercadoPago SDK
    const metadata = {
      tipo: 'RESERVA_CLASE',
      reservaClaseId: reserva.id,
      sesionId: reserva.sesionId,
      participanteId: userId,
      profesorId: clase.profesorId,
      splitProfesor: reserva.splitProfesor,
      splitClub: reserva.splitClub,
      splitApp: reserva.splitApp
    };

    // Estructura de preferencia de MP Marketplace
    const preferenciaMP = {
      items: [{
        title: `Clase: ${clase.nombre}`,
        description: `Sesión ${new Date(reserva.sesion.fecha).toLocaleDateString('es-AR')} ${reserva.sesion.horaInicio}-${reserva.sesion.horaFin}`,
        quantity: 1,
        unit_price: reserva.montoPagado,
        currency_id: 'ARS'
      }],
      marketplace_fee: reserva.splitApp,
      metadata,
      back_urls: {
        success: `${process.env.FRONTEND_URL || 'deportiva://'}reserva-clase/${reserva.id}/exito`,
        failure: `${process.env.FRONTEND_URL || 'deportiva://'}reserva-clase/${reserva.id}/error`,
        pending: `${process.env.FRONTEND_URL || 'deportiva://'}reserva-clase/${reserva.id}/pendiente`
      },
      notification_url: `${process.env.API_URL || 'http://localhost:5000'}/api/mercadopago/webhook-clase`
    };

    // TODO: En producción, crear preferencia real con MP SDK:
    // const preference = await mercadopago.preferences.create(preferenciaMP);
    // Por ahora simulamos un ID de preferencia
    const mpPreferenceId = `PREF_CLASE_${reserva.id}_${Date.now()}`;

    await prisma.reservaClase.update({
      where: { id },
      data: { mpPreferenceId }
    });

    res.json({
      success: true,
      message: 'Preferencia de pago creada',
      data: {
        reservaClaseId: reserva.id,
        mpPreferenceId,
        // init_point: preference.body.init_point, // URL real de MP en producción
        init_point: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${mpPreferenceId}`,
        monto: reserva.montoPagado,
        desglose: {
          profesor: reserva.splitProfesor,
          club: reserva.splitClub,
          app: reserva.splitApp
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /sesiones/:id/lista-espera — Unirse a la lista de espera
export const unirseListaEspera = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id: sesionId } = req.params;

    const sesion = await prisma.sesionClase.findUnique({
      where: { id: sesionId },
      include: {
        clase: { select: { nombre: true, tipoClase: true, estado: true } }
      }
    });

    if (!sesion) throw new AppError('Sesión no encontrada', 404);
    if (sesion.estado !== 'PROGRAMADA') {
      throw new AppError('Solo se puede entrar a lista de espera de sesiones programadas', 400);
    }
    if (sesion.clase.tipoClase !== 'GRUPAL') {
      throw new AppError('La lista de espera solo aplica a clases grupales', 400);
    }
    if (sesion.cuposDisponibles > 0) {
      throw new AppError('Hay cupos disponibles. Puedes reservar directamente.', 400);
    }

    // Verificar que no esté ya en la lista
    const entradaExistente = await prisma.listaEspera.findUnique({
      where: {
        sesionId_usuarioId: { sesionId, usuarioId: userId }
      }
    });

    if (entradaExistente && ['ESPERANDO', 'OFERTADO'].includes(entradaExistente.estado)) {
      throw new AppError('Ya estás en la lista de espera para esta sesión', 400);
    }

    // Verificar que no tenga reserva activa
    const reservaActiva = await prisma.reservaClase.findFirst({
      where: {
        sesionId,
        participanteId: userId,
        estado: { in: ['PENDIENTE', 'CONFIRMADA'] }
      }
    });

    if (reservaActiva) {
      throw new AppError('Ya tienes una reserva activa para esta sesión', 400);
    }

    // Expirar ofertas vencidas primero
    await expirarListaEspera(sesionId);

    // Obtener la posición más alta actual
    const ultimaPosicion = await prisma.listaEspera.findFirst({
      where: { sesionId },
      orderBy: { posicion: 'desc' },
      select: { posicion: true }
    });

    const nuevaPosicion = (ultimaPosicion?.posicion || 0) + 1;

    let entrada;
    if (entradaExistente) {
      // Reactivar entrada expirada
      entrada = await prisma.listaEspera.update({
        where: { id: entradaExistente.id },
        data: {
          estado: 'ESPERANDO',
          posicion: nuevaPosicion,
          notificado: false,
          expiraEn: null
        }
      });
    } else {
      entrada = await prisma.listaEspera.create({
        data: {
          sesionId,
          usuarioId: userId,
          posicion: nuevaPosicion,
          estado: 'ESPERANDO'
        }
      });
    }

    res.status(201).json({
      success: true,
      message: `Te anotaste en la lista de espera. Tu posición: ${nuevaPosicion}`,
      data: {
        listaEsperaId: entrada.id,
        posicion: nuevaPosicion,
        estado: 'ESPERANDO'
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /lista-espera/:id/confirmar — Confirmar cuando se libera un cupo
// El usuario tiene N minutos (30 por defecto) desde que se le notificó.
export const confirmarListaEspera = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;

    const entrada = await prisma.listaEspera.findUnique({
      where: { id },
      include: {
        sesion: {
          include: {
            clase: {
              include: {
                cancha: { select: { propietarioId: true, precioPorHora: true } }
              }
            }
          }
        }
      }
    });

    if (!entrada) throw new AppError('Entrada de lista de espera no encontrada', 404);
    if (entrada.usuarioId !== userId) {
      throw new AppError('Solo puedes confirmar tu propia entrada de lista de espera', 403);
    }
    if (entrada.estado !== 'OFERTADO') {
      throw new AppError('Esta entrada no está disponible para confirmación', 400);
    }

    // Verificar que no haya expirado
    if (entrada.expiraEn && new Date(entrada.expiraEn) < new Date()) {
      await prisma.listaEspera.update({
        where: { id },
        data: { estado: 'EXPIRADO' }
      });
      // Liberar al siguiente
      await liberarSiguienteEnEspera(entrada.sesionId);
      throw new AppError('El tiempo para confirmar expiró. El lugar pasó al siguiente.', 400);
    }

    // Verificar que haya cupo disponible
    if (entrada.sesion.cuposDisponibles <= 0) {
      throw new AppError('No hay cupos disponibles en este momento', 400);
    }

    // Calcular precio y split
    const clase = entrada.sesion.clase;
    const precioFinal = calcularPrecioFinal(
      clase,
      entrada.sesion.cuposDisponibles,
      entrada.sesion.fecha
    );

    let metodoPagoEspacio = 'EXTERNO';
    let comisionClub = null;

    if (clase.canchaId && clase.cancha) {
      const vinculo = await prisma.vinculoProfesorEstablecimiento.findUnique({
        where: {
          profesorId_establecimientoId: {
            profesorId: clase.profesorId,
            establecimientoId: clase.cancha.propietarioId
          }
        }
      });
      if (vinculo && vinculo.estado === 'ACTIVO') {
        metodoPagoEspacio = vinculo.metodoPagoEspacio;
        comisionClub = vinculo.comisionClub;
      }
    }

    const split = procesarSplitPago({
      precioFinal,
      precioProfesor: clase.precioProfesor,
      precioEspacio: clase.precioEspacio,
      metodoPagoEspacio,
      comisionClub
    });

    // Transacción: confirmar espera + crear reserva + decrementar cupo
    const resultado = await prisma.$transaction(async (tx) => {
      await tx.listaEspera.update({
        where: { id },
        data: { estado: 'CONFIRMADO' }
      });

      const reserva = await tx.reservaClase.create({
        data: {
          sesionId: entrada.sesionId,
          participanteId: userId,
          estado: 'PENDIENTE',
          montoPagado: precioFinal,
          splitProfesor: split.splitProfesor,
          splitClub: split.splitClub,
          splitApp: split.splitApp
        }
      });

      await tx.sesionClase.update({
        where: { id: entrada.sesionId },
        data: { cuposDisponibles: { decrement: 1 } }
      });

      return reserva;
    });

    res.json({
      success: true,
      message: '¡Lugar confirmado! Procede al pago para asegurar tu reserva.',
      data: {
        reservaClaseId: resultado.id,
        precioFinal,
        splitProfesor: split.splitProfesor,
        splitClub: split.splitClub,
        splitApp: split.splitApp
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /reservas-clase/:id/resena — Crear reseña de clase
export const crearResenaClase = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id } = req.params;
    const { calificacion, comentario } = req.body;

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      throw new AppError('La calificación debe ser entre 1 y 5', 400);
    }

    const reserva = await prisma.reservaClase.findUnique({
      where: { id },
      include: {
        sesion: { include: { clase: { select: { profesorId: true } } } }
      }
    });

    if (!reserva) throw new AppError('Reserva no encontrada', 404);
    if (reserva.participanteId !== userId) {
      throw new AppError('Solo puedes reseñar clases en las que participaste', 403);
    }
    if (reserva.estado !== 'COMPLETADA') {
      throw new AppError('Solo puedes reseñar clases completadas', 400);
    }

    const profesorId = reserva.sesion.clase.profesorId;

    // Verificar que no exista reseña previa
    const resenaExistente = await prisma.resenaClase.findUnique({
      where: { reservaClaseId: id }
    });
    if (resenaExistente) {
      throw new AppError('Ya reseñaste esta clase', 400);
    }

    const resena = await prisma.resenaClase.create({
      data: {
        reservaClaseId: id,
        participanteId: userId,
        profesorId,
        calificacion: parseInt(calificacion),
        comentario: comentario || null
      }
    });

    // Recalcular calificación promedio del profesor
    const stats = await prisma.resenaClase.aggregate({
      where: { profesorId },
      _avg: { calificacion: true },
      _count: true
    });

    await prisma.perfilProfesor.update({
      where: { usuarioId: profesorId },
      data: {
        calificacionPromedio: Math.round((stats._avg.calificacion || 0) * 10) / 10,
        cantidadResenas: stats._count
      }
    });

    res.status(201).json({
      success: true,
      message: '¡Gracias por tu reseña!',
      data: resena
    });
  } catch (error) {
    next(error);
  }
};
