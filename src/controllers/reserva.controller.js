import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import https from 'https';

const MP_PREFERENCE_URL = 'https://api.mercadopago.com/checkout/preferences';
const MP_PAYMENT_URL = 'https://api.mercadopago.com/v1/payments';
const MP_PLATFORM_ACCESS_TOKEN = process.env.MERCADOPAGO_PLATFORM_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN || '';

const postJsonWithBearer = (url, body, accessToken) => {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const payload = JSON.stringify(body);

      const options = {
        method: 'POST',
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          Authorization: `Bearer ${accessToken}`
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(data || '{}');
              resolve(json);
            } catch (err) {
              reject(new Error('Error parseando respuesta de Mercado Pago'));
            }
          } else {
            reject(new Error(`Error de Mercado Pago (${res.statusCode}): ${data}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(payload);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

const getJsonWithBearer = (url, accessToken) => {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);

      const options = {
        method: 'GET',
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const json = JSON.parse(data || '{}');
              resolve(json);
            } catch (err) {
              reject(new Error('Error parseando respuesta de Mercado Pago'));
            }
          } else {
            reject(new Error(`Error de Mercado Pago (${res.statusCode}): ${data}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Crear nueva reserva
export const createReserva = async (req, res, next) => {
  try {
    const {
      canchaId,
      fecha,
      horaInicio,
      horaFin,
      duracionHoras,
      notas
    } = req.body;

    // Validar datos
    if (!canchaId || !fecha || !horaInicio || !horaFin) {
      throw new AppError('Todos los campos son obligatorios', 400);
    }

    // Verificar que la cancha existe y está activa
    const cancha = await prisma.cancha.findUnique({
      where: { id: canchaId }
    });

    if (!cancha || !cancha.activa) {
      throw new AppError('Espacio no disponible', 404);
    }

    // Verificar si el jugador tiene una sanción activa para esta cancha
    const sancionActiva = await prisma.sancion.findFirst({
      where: {
        jugadorId: req.usuario.id,
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

    // Si está BANEADO, no puede reservar
    if (sancionActiva && sancionActiva.tipo === 'BANEADO') {
      throw new AppError('No puedes reservar en este espacio debido a una sanción activa. Contacta al propietario para más información.', 403);
    }

    // Convertir fecha a Date object (asegurar que se interprete correctamente)
    // El formato esperado es "YYYY-MM-DD"
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaReserva = new Date(year, month - 1, day); // month es 0-indexed
    
    // Verificar que la fecha no sea en el pasado
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    fechaReserva.setHours(0, 0, 0, 0);
    
    if (fechaReserva < hoy) {
      throw new AppError('No puedes reservar en fechas pasadas', 400);
    }

    // Verificar si ya existe una reserva para esa cancha en ese horario
    const reservaExistente = await prisma.reserva.findFirst({
      where: {
        canchaId,
        fecha: fechaReserva,
        horaInicio,
        estado: {
          in: ['PENDIENTE', 'CONFIRMADA']
        }
      }
    });

    if (reservaExistente) {
      throw new AppError('El horario ya está reservado', 400);
    }

    // Calcular precio total
    const precioTotal = cancha.precioPorHora * (duracionHoras || 1);

    // Crear reserva
    const reserva = await prisma.reserva.create({
      data: {
        usuarioId: req.usuario.id,
        canchaId,
        fecha: fechaReserva,
        horaInicio,
        horaFin,
        duracionHoras: duracionHoras || 1,
        precioTotal,
        notas
      },
      include: {
        cancha: {
          select: {
            nombre: true,
            direccion: true,
            ciudad: true,
            deporte: true
          }
        },
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true,
            telefono: true
          }
        }
      }
    });

    // Si el jugador tiene sanción ADVERTIDO u OBSERVADO, notificar al propietario
    if (sancionActiva && (sancionActiva.tipo === 'ADVERTIDO' || sancionActiva.tipo === 'OBSERVADO')) {
      const tipoMensaje = sancionActiva.tipo === 'ADVERTIDO' 
        ? '⚠️ Jugador con advertencia' 
        : '👁️ Jugador en observación';
      
      await prisma.notificacionUsuario.create({
        data: {
          usuarioReceptorId: cancha.propietarioId,
          usuarioEmisorId: req.usuario.id,
          titulo: `${tipoMensaje} ha reservado`,
          mensaje: `${reserva.usuario.nombre} ${reserva.usuario.apellido} ha reservado en ${cancha.nombre} para el ${fecha} a las ${horaInicio}. Motivo de sanción: ${sancionActiva.motivo}`,
          tipo: 'alerta_sancion',
          datos: JSON.stringify({ 
            reservaId: reserva.id, 
            sancionId: sancionActiva.id,
            tipoSancion: sancionActiva.tipo 
          })
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: reserva
    });
  } catch (error) {
    next(error);
  }
};

// Obtener todas las reservas del usuario
export const getMyReservas = async (req, res, next) => {
  try {
    const { estado, page = 1, limit = 100 } = req.query;

    const where = {
      usuarioId: req.usuario.id,
      ...(estado && { estado })
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reservas, total] = await Promise.all([
      prisma.reserva.findMany({
        where,
        include: {
          cancha: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
              ciudad: true,
              deporte: true,
              imagenPrincipal: true,
              imagenes: true
            }
          },
          // Incluir invitaciones de esta reserva
          invitaciones: {
            include: {
              participantes: {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      nombre: true,
                      apellido: true,
                      foto: true
                    }
                  }
                }
              },
              solicitudes: {
                where: { estado: 'PENDIENTE' }
              }
            }
          },
          // Incluir pagos
          pagos: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true
                }
              }
            }
          }
        },
        orderBy: { fecha: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.reserva.count({ where })
    ]);

    res.json({
      success: true,
      data: reservas,
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

// Obtener reserva por ID
export const getReservaById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        cancha: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            telefono: true,
            foto: true
          }
        },
        pagos: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                alias: true,
                email: true,
                foto: true
              }
            }
          }
        },
        invitaciones: {
          include: {
            invitado: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                alias: true,
                foto: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!reserva) {
      throw new AppError('Reserva no encontrada', 404);
    }

    // Verificar que el usuario tenga acceso a esta reserva
    if (reserva.usuarioId !== req.usuario.id && 
        reserva.cancha.propietarioId !== req.usuario.id && 
        req.usuario.rol !== 'ADMIN') {
      throw new AppError('No tienes permiso para ver esta reserva', 403);
    }

    res.json({
      success: true,
      data: reserva
    });
  } catch (error) {
    next(error);
  }
};

// Cancelar reserva
export const cancelReserva = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivoCancelacion } = req.body;

    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        cancha: {
          select: {
            propietarioId: true,
            nombre: true
          }
        }
      }
    });

    if (!reserva) {
      throw new AppError('Reserva no encontrada', 404);
    }

    const esOrganizador = reserva.usuarioId === req.usuario.id;
    const esAdmin = req.usuario.rol === 'ADMIN';
    const esPropietario = req.usuario.rol === 'PROPIETARIO' && reserva.cancha.propietarioId === req.usuario.id;

    if (!esOrganizador && !esAdmin && !esPropietario) {
      throw new AppError('No tienes permiso para cancelar esta reserva', 403);
    }

    if (!['PENDIENTE', 'CONFIRMADA'].includes(reserva.estado)) {
      throw new AppError('Esta reserva no puede ser cancelada', 400);
    }

    const fechaReserva = new Date(reserva.fecha);
    const ahora = new Date();
    const horasRestantes = (fechaReserva - ahora) / (1000 * 60 * 60);

    if (horasRestantes < 2) {
      throw new AppError('No puedes cancelar con menos de 2 horas de anticipación', 400);
    }

    let pagosPagados = [];
    let propietario = null;

    if (esPropietario) {
      propietario = await prisma.usuario.findUnique({
        where: { id: reserva.cancha.propietarioId },
        select: {
          mpAccessToken: true,
          mpConnected: true
        }
      });

      if (propietario && propietario.mpConnected && propietario.mpAccessToken) {
        pagosPagados = await prisma.pagoReserva.findMany({
          where: {
            reservaId: id,
            estado: 'PAGADO',
            mpPaymentId: {
              not: null
            }
          }
        });

        for (const pago of pagosPagados) {
          try {
            await postJsonWithBearer(
              `${MP_PAYMENT_URL}/${pago.mpPaymentId}/refunds`,
              {},
              propietario.mpAccessToken
            );
          } catch (err) {
            throw new AppError('Error al procesar reembolsos en Mercado Pago', 500);
          }
        }
      }
    }

    const reservaActualizada = await prisma.$transaction(async (tx) => {
      if (esPropietario && pagosPagados.length > 0) {
        const ids = pagosPagados.map((p) => p.id);
        await tx.pagoReserva.updateMany({
          where: {
            id: {
              in: ids
            }
          },
          data: {
            estado: 'REEMBOLSADO'
          }
        });
      }

      const pagosRestantes = await tx.pagoReserva.aggregate({
        where: {
          reservaId: id,
          estado: 'PAGADO'
        },
        _sum: {
          monto: true
        }
      });

      const montoPagadoTotal = pagosRestantes._sum.monto || 0;

      return tx.reserva.update({
        where: { id },
        data: {
          estado: 'CANCELADA',
          canceladaPor: req.usuario.id,
          motivoCancelacion,
          montoPagadoTotal,
          pagado: false
        }
      });
    });

    // Notificar a los participantes de la reserva
    const participantes = await prisma.participanteInvitacion.findMany({
      where: {
        invitacion: {
          reservaId: id
        }
      },
      select: { usuarioId: true }
    });

    const fechaFormateada = new Date(reserva.fecha).toLocaleDateString('es-AR');
    const usuariosANotificar = [
      ...participantes.map(p => p.usuarioId),
      // Si el organizador no es quien cancela, notificarlo también
      ...(reserva.usuarioId !== req.usuario.id ? [reserva.usuarioId] : [])
    ];

    // Crear notificaciones para todos los involucrados
    for (const usuarioId of usuariosANotificar) {
      await prisma.notificacionUsuario.create({
        data: {
          destinatarioId: usuarioId,
          remitenteId: req.usuario.id,
          titulo: 'Reserva cancelada',
          mensaje: `La reserva en ${reserva.cancha.nombre} del ${fechaFormateada} a las ${reserva.horaInicio} fue cancelada.`,
          tipo: 'RESERVA_CANCELADA'
        }
      });
    }

    res.json({
      success: true,
      message: 'Reserva cancelada exitosamente',
      data: reservaActualizada
    });
  } catch (error) {
    next(error);
  }
};

// Confirmar pago de reserva
export const confirmarPago = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { metodoPago } = req.body;

    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        cancha: {
          select: { nombre: true }
        }
      }
    });

    if (!reserva) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reserva.usuarioId !== req.usuario.id) {
      throw new AppError('No tienes permiso para modificar esta reserva', 403);
    }

    const reservaActualizada = await prisma.reserva.update({
      where: { id },
      data: {
        pagado: true,
        metodoPago,
        estado: 'CONFIRMADA'
      }
    });

    // Notificar a los participantes que la reserva fue confirmada
    const participantes = await prisma.participanteInvitacion.findMany({
      where: {
        invitacion: {
          reservaId: id
        }
      },
      select: { usuarioId: true }
    });

    const fechaFormateada = new Date(reserva.fecha).toLocaleDateString('es-AR');
    
    for (const participante of participantes) {
      await prisma.notificacionUsuario.create({
        data: {
          destinatarioId: participante.usuarioId,
          remitenteId: req.usuario.id,
          titulo: 'Reserva confirmada',
          mensaje: `¡La reserva en ${reserva.cancha.nombre} del ${fechaFormateada} a las ${reserva.horaInicio} está confirmada!`,
          tipo: 'RESERVA_CONFIRMADA'
        }
      });
    }

    res.json({
      success: true,
      message: 'Pago confirmado exitosamente',
      data: reservaActualizada
    });
  } catch (error) {
    next(error);
  }
};

// Obtener disponibilidad de una cancha
export const getDisponibilidad = async (req, res, next) => {
  try {
    const { canchaId } = req.params;
    const { fecha } = req.query;

    if (!fecha) {
      throw new AppError('La fecha es obligatoria', 400);
    }

    // Parsear fecha correctamente (evitar problemas de timezone)
    const [year, month, day] = fecha.split('-').map(Number);
    const fechaConsulta = new Date(year, month - 1, day);

    // Obtener reservas existentes para esa fecha
    const reservasExistentes = await prisma.reserva.findMany({
      where: {
        canchaId,
        fecha: fechaConsulta,
        estado: {
          in: ['PENDIENTE', 'CONFIRMADA']
        }
      },
      select: {
        horaInicio: true,
        horaFin: true
      }
    });

    // Obtener horarios disponibles de la cancha
    const diaSemana = fechaConsulta.getDay();
    const horariosCancha = await prisma.horarioDisponible.findMany({
      where: {
        canchaId,
        diaSemana,
        activo: true
      }
    });

    // Crear set de horarios reservados para búsqueda rápida
    const horariosReservados = new Set(
      reservasExistentes.map(r => r.horaInicio)
    );

    // Verificar si es hoy para filtrar horarios pasados
    const ahora = new Date();
    const esHoy = fechaConsulta.toDateString() === ahora.toDateString();
    const horaActual = ahora.getHours();
    const minutosActuales = ahora.getMinutes();

    // Filtrar horarios: quitar reservados y los que ya pasaron (si es hoy)
    const horariosDisponibles = horariosCancha.filter(horario => {
      // Si ya está reservado, no mostrar
      if (horariosReservados.has(horario.horaInicio)) {
        return false;
      }

      // Si es hoy, verificar que el horario no haya pasado
      if (esHoy) {
        const [horaInicio, minInicio] = horario.horaInicio.split(':').map(Number);
        // Si la hora ya pasó, no mostrar
        if (horaInicio < horaActual || (horaInicio === horaActual && minInicio <= minutosActuales)) {
          return false;
        }
      }

      return true;
    });

    res.json({
      success: true,
      data: {
        fecha: fechaConsulta,
        horariosCancha: horariosDisponibles,
        reservasExistentes,
        esHoy
      }
    });
  } catch (error) {
    next(error);
  }
};

// Obtener reservas de una cancha (para propietarios)
export const getReservasByCancha = async (req, res, next) => {
  try {
    const { canchaId } = req.params;
    const { fecha, estado } = req.query;

    // Verificar que el usuario sea propietario de la cancha
    const cancha = await prisma.cancha.findUnique({
      where: { id: canchaId }
    });

    if (!cancha) {
      throw new AppError('Espacio no encontrado', 404);
    }

    if (cancha.propietarioId !== req.usuario.id && req.usuario.rol !== 'ADMIN') {
      throw new AppError('No tienes permiso para ver estas reservas', 403);
    }

    const where = {
      canchaId,
      ...(fecha && { fecha: new Date(fecha) }),
      ...(estado && { estado })
    };

    const reservas = await prisma.reserva.findMany({
      where,
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            telefono: true,
            email: true
          }
        }
      },
      orderBy: [{ fecha: 'desc' }, { horaInicio: 'asc' }]
    });

    res.json({
      success: true,
      data: reservas
    });
  } catch (error) {
    next(error);
  }
};

// Crear pago (preference MP) para uno o varios cupos de una reserva
export const createPagoReservaMP = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { cantidadCupos } = req.body;

    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        cancha: {
          select: {
            id: true,
            nombre: true,
            capacidadJugadores: true,
            propietarioId: true
          }
        }
      }
    });

    if (!reserva) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (['CANCELADA', 'COMPLETADA'].includes(reserva.estado)) {
      throw new AppError('No se pueden generar pagos para esta reserva', 400);
    }

    // Calcular deadline de pagos
    const [hora, minuto] = (reserva.horaInicio || '00:00').split(':').map(Number);
    const fechaHoraInicio = new Date(reserva.fecha);
    fechaHoraInicio.setHours(hora || 0, minuto || 0, 0, 0);
    const horasLimite = reserva.horasLimitePago || 0;
    const deadline = new Date(fechaHoraInicio.getTime() - horasLimite * 60 * 60 * 1000);

    if (Date.now() > deadline.getTime()) {
      throw new AppError('El tiempo para realizar pagos de esta reserva ha expirado', 400);
    }

    // Obtener propietario de la cancha
    const propietario = await prisma.usuario.findUnique({
      where: { id: reserva.cancha.propietarioId },
      select: {
        mpConnected: true,
        mpAccessToken: true,
        mpUserId: true,
        nombre: true
      }
    });

    if (!propietario || !propietario.mpConnected || !propietario.mpAccessToken) {
      throw new AppError('El propietario aún no configuró su cuenta de Mercado Pago', 400);
    }

    // Determinar cantidad de jugadores
    const cantidadJugadores = reserva.cantidadJugadores || reserva.cancha.capacidadJugadores;
    if (!cantidadJugadores || cantidadJugadores <= 0) {
      throw new AppError('La reserva no tiene configurada la cantidad de participantes', 400);
    }

    cantidadCupos = parseInt(cantidadCupos, 10);
    if (!cantidadCupos || cantidadCupos < 1) {
      cantidadCupos = 1;
    }

    const montoPorCupo = parseFloat((reserva.precioTotal / cantidadJugadores).toFixed(2));
    const monto = parseFloat((montoPorCupo * cantidadCupos).toFixed(2));

    if (monto <= 0) {
      throw new AppError('El monto del pago debe ser mayor a 0', 400);
    }

    if (reserva.montoPagadoTotal + monto > reserva.precioTotal + 0.01) {
      throw new AppError('El monto supera el total de la reserva', 400);
    }
    
    // Dentro de createPagoReservaMP, después de crear el pago
if (metadata.tipoPago === 'CUPO_JUGADOR') {
  // Obtener lista de jugadores a invitar (ej: desde request.body.jugadoresInvitados)
  const jugadores = req.body.jugadoresInvitados || [];

  // Crear notificaciones en la base
  await prisma.notificacion.createMany({
    data: jugadores.map(jugadorId => ({
      usuarioId: jugadorId,
      tipo: 'INVITACION_PAGO',
      titulo: `Te invitaron a una actividad en ${reserva.cancha.nombre}`,
      mensaje: 'Pagá tu parte para confirmar tu lugar.',
      data: {
        reservaId: reserva.id,
        pagoId: pago.id,
        linkPago: preference.sandbox_init_point || preference.init_point
      }
    }))
  });

  // Si tenés push, enviar FCM/APNs aquí
}

    const preferenceBody = {
      items: [
        {
          title: `Reserva cancha ${reserva.cancha.nombre}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: monto
        }
      ],
      payer: {
        email: req.usuario.email || undefined
      },
      metadata: {
        reservaId: reserva.id,
        usuarioId: req.usuario.id,
        cantidadCupos,
        tipoPago: 'CUPO_JUGADOR'
      },
      auto_return: 'approved'
    };

    const preference = await postJsonWithBearer(
      MP_PREFERENCE_URL,
      preferenceBody,
      propietario.mpAccessToken
    );

    const pago = await prisma.pagoReserva.create({
      data: {
        reservaId: reserva.id,
        usuarioId: req.usuario.id,
        monto,
        estado: 'PENDIENTE',
        mpPreferenceId: preference.id ? String(preference.id) : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pago de reserva creado correctamente',
      data: {
        pago,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point
      }
    });
  } catch (error) {
    next(error);
  }
};

// Crear pago del saldo restante por el organizador
export const pagarSaldoOrganizadorMP = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        cancha: {
          select: {
            id: true,
            nombre: true,
            propietarioId: true
          }
        }
      }
    });

    if (!reserva) {
      throw new AppError('Reserva no encontrada', 404);
    }

    if (reserva.usuarioId !== req.usuario.id) {
      throw new AppError('Solo el organizador puede pagar el saldo restante', 403);
    }

    if (['CANCELADA', 'COMPLETADA'].includes(reserva.estado)) {
      throw new AppError('No se puede pagar saldo para esta reserva', 400);
    }

    const saldo = parseFloat((reserva.precioTotal - reserva.montoPagadoTotal).toFixed(2));

    if (saldo <= 0) {
      throw new AppError('No hay saldo pendiente para esta reserva', 400);
    }

    // Obtener propietario de la cancha
    const propietario = await prisma.usuario.findUnique({
      where: { id: reserva.cancha.propietarioId },
      select: {
        mpConnected: true,
        mpAccessToken: true,
        mpUserId: true,
        nombre: true
      }
    });

    if (!propietario || !propietario.mpConnected || !propietario.mpAccessToken) {
      throw new AppError('El propietario aún no configuró su cuenta de Mercado Pago', 400);
    }

    const preferenceBody = {
      items: [
        {
          title: `Saldo reserva cancha ${reserva.cancha.nombre}`,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: saldo
        }
      ],
      payer: {
        email: req.usuario.email || undefined
      },
      metadata: {
        reservaId: reserva.id,
        usuarioId: req.usuario.id,
        tipoPago: 'SALDO_ORGANIZADOR'
      },
      auto_return: 'approved'
    };

    const preference = await postJsonWithBearer(
      MP_PREFERENCE_URL,
      preferenceBody,
      propietario.mpAccessToken
    );

    const pago = await prisma.pagoReserva.create({
      data: {
        reservaId: reserva.id,
        usuarioId: req.usuario.id,
        monto: saldo,
        estado: 'PENDIENTE',
        mpPreferenceId: preference.id ? String(preference.id) : null
      }
    });

    res.status(201).json({
      success: true,
      message: 'Pago de saldo de reserva creado correctamente',
      data: {
        pago,
        init_point: preference.init_point,
        sandbox_init_point: preference.sandbox_init_point
      }
    });
  } catch (error) {
    next(error);
  }
};

export const mercadopagoWebhook = async (req, res, next) => {
  try {
    const topic = req.query.topic || req.query.type || req.body.type;
    let paymentId = req.query.id;

    if (!paymentId && req.body && req.body.data && req.body.data.id) {
      paymentId = req.body.data.id;
    }

    if (topic !== 'payment') {
      return res.status(200).send('IGNORED');
    }

    if (!paymentId) {
      return res.status(400).send('Missing payment id');
    }

    if (!MP_PLATFORM_ACCESS_TOKEN) {
      return res.status(500).send('Mercado Pago no está configurado');
    }

    const payment = await getJsonWithBearer(
      `${MP_PAYMENT_URL}/${paymentId}`,
      MP_PLATFORM_ACCESS_TOKEN
    );

    const status = payment.status;
    const preferenceId = payment.preference_id;

    if (!preferenceId) {
      return res.status(200).send('No preference id');
    }

    const pago = await prisma.pagoReserva.findFirst({
      where: {
        mpPreferenceId: String(preferenceId)
      }
    });

    if (!pago) {
      return res.status(200).send('PagoReserva no encontrado');
    }

    if (status === 'approved') {
      await prisma.$transaction(async (tx) => {
        const pagoActualizado = await tx.pagoReserva.update({
          where: { id: pago.id },
          data: {
            estado: 'PAGADO',
            mpPaymentId: String(paymentId)
          }
        });

        const reserva = await tx.reserva.findUnique({
          where: { id: pagoActualizado.reservaId }
        });

        if (!reserva) {
          return;
        }

        const pagosPagados = await tx.pagoReserva.aggregate({
          where: {
            reservaId: reserva.id,
            estado: 'PAGADO'
          },
          _sum: {
            monto: true
          }
        });

        const montoPagadoTotal = pagosPagados._sum.monto || 0;

        const dataUpdate = {
          montoPagadoTotal,
          pagado: false
        };

        if (montoPagadoTotal >= reserva.precioTotal) {
          dataUpdate.estado = 'CONFIRMADA';
          dataUpdate.pagado = true;
        }

        await tx.reserva.update({
          where: { id: reserva.id },
          data: dataUpdate
        });
      });
    } else if (status === 'refunded' || status === 'charged_back') {
      await prisma.$transaction(async (tx) => {
        const pagoActualizado = await tx.pagoReserva.update({
          where: { id: pago.id },
          data: {
            estado: 'REEMBOLSADO',
            mpPaymentId: String(paymentId)
          }
        });

        const reserva = await tx.reserva.findUnique({
          where: { id: pagoActualizado.reservaId }
        });

        if (!reserva) {
          return;
        }

        const pagosPagados = await tx.pagoReserva.aggregate({
          where: {
            reservaId: reserva.id,
            estado: 'PAGADO'
          },
          _sum: {
            monto: true
          }
        });

        const montoPagadoTotal = pagosPagados._sum.monto || 0;

        const dataUpdate = {
          montoPagadoTotal,
          pagado: montoPagadoTotal >= reserva.precioTotal
        };

        const [hora, minuto] = (reserva.horaInicio || '00:00').split(':').map(Number);
        const fechaHoraInicio = new Date(reserva.fecha);
        fechaHoraInicio.setHours(hora || 0, minuto || 0, 0, 0);
        const ahora = new Date();

        if (
          ahora < fechaHoraInicio &&
          montoPagadoTotal < reserva.precioTotal &&
          reserva.estado === 'CONFIRMADA'
        ) {
          dataUpdate.estado = 'PENDIENTE';
        }

        await tx.reserva.update({
          where: { id: reserva.id },
          data: dataUpdate
        });
      });
    }

    return res.status(200).send('OK');
  } catch (error) {
    next(error);
  }
};

// Obtener reservas del propietario (jugadores que reservaron sus canchas)
export const getMyReservasAsOwner = async (req, res, next) => {
  try {
    const { estado, page = 1, limit = 50 } = req.query;

    // Obtener todas las canchas del propietario
    const canchasDelPropietario = await prisma.cancha.findMany({
      where: { propietarioId: req.usuario.id },
      select: { id: true }
    });

    if (canchasDelPropietario.length === 0) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0
        }
      });
    }

    const canchIdsDelPropietario = canchasDelPropietario.map(c => c.id);

    const where = {
      canchaId: {
        in: canchIdsDelPropietario
      },
      ...(estado && { estado })
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reservas, total] = await Promise.all([
      prisma.reserva.findMany({
        where,
        include: {
          cancha: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
              ciudad: true,
              deporte: true,
              imagenPrincipal: true
            }
          },
          usuario: {
            select: {
              id: true,
              nombre: true,
              email: true,
              telefono: true
            }
          }
        },
        orderBy: { fecha: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.reserva.count({ where })
    ]);

    res.json({
      success: true,
      data: reservas,
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

// Actualizar estado de una reserva (propietario)
export const updateReservaEstado = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar que el estado sea válido
    const estadosValidos = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'COMPLETADA'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    // Obtener la reserva
    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: { cancha: { select: { propietarioId: true } } }
    });

    if (!reserva) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }

    // Verificar que el propietario es dueño de la cancha
    if (reserva.cancha.propietarioId !== req.usuario.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar esta reserva'
      });
    }

    // Actualizar estado
    const reservaActualizada = await prisma.reserva.update({
      where: { id },
      data: { estado },
      include: {
        cancha: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            ciudad: true
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            email: true,
            telefono: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: reservaActualizada,
      message: `Reserva actualizada a ${estado}`
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar una reserva (solo pasadas o canceladas)
export const deleteReserva = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reserva = await prisma.reserva.findUnique({
      where: { id }
    });

    if (!reserva) {
      throw new AppError('Reserva no encontrada', 404);
    }

    // Verificar que el usuario sea el dueño de la reserva
    if (reserva.usuarioId !== req.usuario.id && req.usuario.rol !== 'ADMIN') {
      throw new AppError('No tienes permiso para eliminar esta reserva', 403);
    }

    // Solo permitir eliminar reservas pasadas o canceladas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaReserva = new Date(reserva.fecha);
    fechaReserva.setHours(0, 0, 0, 0);
    
    const esPasada = fechaReserva < hoy;
    const esCancelada = reserva.estado === 'CANCELADA';

    if (!esPasada && !esCancelada) {
      throw new AppError('Solo se pueden eliminar reservas pasadas o canceladas', 400);
    }

    // Eliminar registros relacionados primero
    await prisma.pagoReserva.deleteMany({ where: { reservaId: id } });
    await prisma.participanteInvitacion.deleteMany({
      where: { invitacion: { reservaId: id } }
    });
    await prisma.solicitudInvitacion.deleteMany({
      where: { invitacion: { reservaId: id } }
    });
    await prisma.invitacionReserva.deleteMany({ where: { reservaId: id } });

    // Eliminar la reserva
    await prisma.reserva.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Reserva eliminada correctamente'
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar todas las reservas pasadas y canceladas del usuario
export const deletePastReservas = async (req, res, next) => {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Buscar reservas pasadas o canceladas del usuario
    const reservasAEliminar = await prisma.reserva.findMany({
      where: {
        usuarioId: req.usuario.id,
        OR: [
          { fecha: { lt: hoy } },
          { estado: 'CANCELADA' }
        ]
      },
      select: { id: true }
    });

    const ids = reservasAEliminar.map(r => r.id);

    if (ids.length === 0) {
      return res.json({
        success: true,
        message: '¡Todo limpio! No hay reservas pasadas o canceladas 👍',
        count: 0
      });
    }

    // Eliminar registros relacionados
    await prisma.pagoReserva.deleteMany({ where: { reservaId: { in: ids } } });
    await prisma.participanteInvitacion.deleteMany({
      where: { invitacion: { reservaId: { in: ids } } }
    });
    await prisma.solicitudInvitacion.deleteMany({
      where: { invitacion: { reservaId: { in: ids } } }
    });
    await prisma.invitacionReserva.deleteMany({ where: { reservaId: { in: ids } } });

    // Eliminar las reservas
    const result = await prisma.reserva.deleteMany({
      where: { id: { in: ids } }
    });

    res.json({
      success: true,
      message: result.count === 1 
        ? '¡Listo! Se eliminó 1 reserva 🗑️' 
        : `¡Listo! Se eliminaron ${result.count} reservas 🗑️`,
      count: result.count
    });
  } catch (error) {
    next(error);
  }
};

