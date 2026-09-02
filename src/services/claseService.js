import prisma from '../config/database.js';

// Comisión de la plataforma (porcentaje sobre el precio total)
const COMISION_APP_PORCENTAJE = 10; // 10%
const MINUTOS_EXPIRACION_LISTA_ESPERA = 30;

/**
 * Calcula el precio final de una clase aplicando precio dinámico si corresponde.
 * 
 * Lógica de precio dinámico (solo si precioDinamicoActivo = true):
 * - Si quedan ≤ umbralSubida% de cupos → precio sube porcentajeSubida%
 * - Si quedan ≥ (1 - umbralDescuento)% de cupos libres cerca de la fecha → baja porcentajeDescuento%
 * 
 * @param {Object} clase - Objeto de la clase con precioTotal, cupoMaximo, precioDinamicoActivo, precioDinamicoConfig
 * @param {number} cuposRestantes - Cupos disponibles en la sesión
 * @param {Date|null} fechaSesion - Fecha de la sesión (para evaluar descuentos por proximidad)
 * @returns {number} Precio final calculado
 */
export const calcularPrecioFinal = (clase, cuposRestantes, fechaSesion = null) => {
  const precioBase = clase.precioTotal;

  if (!clase.precioDinamicoActivo || !clase.precioDinamicoConfig || !clase.cupoMaximo) {
    return precioBase;
  }

  const config = typeof clase.precioDinamicoConfig === 'string'
    ? JSON.parse(clase.precioDinamicoConfig)
    : clase.precioDinamicoConfig;

  const {
    umbralSubida = 0.8,       // cuando se ocupó el 80% → sube
    porcentajeSubida = 20,    // sube 20%
    umbralDescuento = 0.3,    // cuando quedan ≥70% libres cerca de fecha → baja
    porcentajeDescuento = 15  // baja 15%
  } = config;

  const porcentajeOcupado = 1 - (cuposRestantes / clase.cupoMaximo);

  // Alta demanda: quedan pocos cupos (≤20% libres → ≥80% ocupado)
  if (porcentajeOcupado >= umbralSubida) {
    return Math.round(precioBase * (1 + porcentajeSubida / 100));
  }

  // Baja demanda: muchos cupos libres cerca de la fecha de la sesión
  if (fechaSesion) {
    const horasHastaClase = (new Date(fechaSesion).getTime() - Date.now()) / (1000 * 60 * 60);
    // Solo aplicar descuento si faltan menos de 48 horas y hay mucho cupo libre
    if (horasHastaClase <= 48 && horasHastaClase > 0 && porcentajeOcupado <= umbralDescuento) {
      return Math.round(precioBase * (1 - porcentajeDescuento / 100));
    }
  }

  return precioBase;
};

/**
 * Procesa el split de pago de una reserva de clase.
 * Distribuye el monto pagado entre profesor, club (si aplica) y app.
 * 
 * Cuando metodoPagoEspacio = APP en el vínculo:
 *   - splitApp = comisión de la plataforma sobre precioTotal
 *   - splitClub = comisión del club (comisionClub%) sobre precioTotal
 *   - splitProfesor = precioTotal - splitApp - splitClub
 * 
 * Cuando metodoPagoEspacio = EXTERNO:
 *   - splitApp = comisión de la plataforma sobre precioProfesor
 *   - splitClub = null (arreglo fuera de la app)
 *   - splitProfesor = precioProfesor - splitApp
 * 
 * @param {Object} params
 * @param {number} params.precioFinal - Precio final pagado por el participante
 * @param {number} params.precioProfesor - Lo que cobra el profesor
 * @param {number|null} params.precioEspacio - Costo del espacio (null si EXTERNO)
 * @param {string} params.metodoPagoEspacio - 'APP' o 'EXTERNO'
 * @param {number|null} params.comisionClub - Porcentaje de comisión del club
 * @returns {{ splitProfesor: number, splitClub: number|null, splitApp: number }}
 */
export const procesarSplitPago = ({ precioFinal, precioProfesor, precioEspacio, metodoPagoEspacio, comisionClub }) => {
  const splitApp = Math.round((precioFinal * COMISION_APP_PORCENTAJE / 100) * 100) / 100;

  if (metodoPagoEspacio === 'APP' && comisionClub != null) {
    const splitClub = Math.round((precioFinal * comisionClub / 100) * 100) / 100;
    const splitProfesor = Math.round((precioFinal - splitApp - splitClub) * 100) / 100;
    return { splitProfesor, splitClub, splitApp };
  }

  // EXTERNO: el club no participa del pago vía app
  const splitProfesor = Math.round((precioFinal - splitApp) * 100) / 100;
  return { splitProfesor, splitClub: null, splitApp };
};

/**
 * Libera el siguiente en la lista de espera cuando se cancela una reserva.
 * 
 * Flujo:
 * 1. Busca el primer registro con estado ESPERANDO (menor posición)
 * 2. Lo cambia a OFERTADO y setea expiraEn (ahora + 30 min)
 * 3. Crea una notificación para el usuario
 * 
 * @param {string} sesionId - ID de la sesión
 * @returns {Object|null} El registro de lista de espera actualizado, o null si no hay nadie esperando
 */
export const liberarSiguienteEnEspera = async (sesionId) => {
  // Buscar el siguiente en espera con la posición más baja
  const siguiente = await prisma.listaEspera.findFirst({
    where: {
      sesionId,
      estado: 'ESPERANDO'
    },
    orderBy: { posicion: 'asc' },
    include: {
      sesion: {
        include: {
          clase: {
            select: { nombre: true, profesorId: true }
          }
        }
      },
      usuario: { select: { id: true, nombre: true } }
    }
  });

  if (!siguiente) return null;

  const expiraEn = new Date(Date.now() + MINUTOS_EXPIRACION_LISTA_ESPERA * 60 * 1000);

  // Actualizar estado a OFERTADO y setear expiración
  const actualizado = await prisma.listaEspera.update({
    where: { id: siguiente.id },
    data: {
      estado: 'OFERTADO',
      notificado: true,
      expiraEn
    }
  });

  // Crear notificación al usuario
  await prisma.notificacionUsuario.create({
    data: {
      usuarioReceptorId: siguiente.usuarioId,
      titulo: '¡Se liberó un lugar!',
      mensaje: `Se liberó un cupo en "${siguiente.sesion.clase.nombre}". Tenés ${MINUTOS_EXPIRACION_LISTA_ESPERA} minutos para confirmar.`,
      tipo: 'LISTA_ESPERA_CUPO',
      datos: JSON.stringify({
        sesionId,
        listaEsperaId: siguiente.id,
        expiraEn: expiraEn.toISOString()
      })
    }
  });

  return actualizado;
};

/**
 * Libera los pagos retenidos al completarse una sesión de clase.
 * 
 * Flujo:
 * 1. Busca todas las ReservaClase CONFIRMADAS de la sesión
 * 2. Marca pagoLiberado = true y pagoLiberadoAt = now() en cada una
 * 3. Actualiza la sesión a COMPLETADA
 * 4. En producción, aquí se dispararían las transferencias vía Mercado Pago Marketplace
 * 
 * @param {string} sesionId - ID de la sesión completada
 * @returns {{ sesion: Object, reservasLiberadas: number }}
 */
export const liberarPagoPostClase = async (sesionId) => {
  const ahora = new Date();

  // Transacción: actualizar sesión + liberar pagos de todas las reservas confirmadas
  const resultado = await prisma.$transaction(async (tx) => {
    // Marcar sesión como completada
    const sesion = await tx.sesionClase.update({
      where: { id: sesionId },
      data: { estado: 'COMPLETADA' },
      include: {
        clase: {
          select: { nombre: true, profesorId: true }
        }
      }
    });

    // Liberar pagos de reservas confirmadas
    const reservasActualizadas = await tx.reservaClase.updateMany({
      where: {
        sesionId,
        estado: 'CONFIRMADA',
        pagoLiberado: false
      },
      data: {
        estado: 'COMPLETADA',
        pagoLiberado: true,
        pagoLiberadoAt: ahora
      }
    });

    // Cancelar entradas de lista de espera pendientes (ESPERANDO u OFERTADO)
    await tx.listaEspera.updateMany({
      where: {
        sesionId,
        estado: { in: ['ESPERANDO', 'OFERTADO'] }
      },
      data: { estado: 'EXPIRADO' }
    });

    return { sesion, reservasLiberadas: reservasActualizadas.count };
  });

  // Notificar al profesor que sus pagos fueron liberados
  if (resultado.reservasLiberadas > 0) {
    await prisma.notificacionUsuario.create({
      data: {
        usuarioReceptorId: resultado.sesion.clase.profesorId,
        titulo: 'Pagos liberados',
        mensaje: `Se liberaron los pagos de ${resultado.reservasLiberadas} reservas de "${resultado.sesion.clase.nombre}".`,
        tipo: 'PAGO_LIBERADO',
        datos: JSON.stringify({ sesionId })
      }
    });
  }

  return resultado;
};

/**
 * Expira entradas de lista de espera que pasaron su tiempo límite.
 * Se ejecuta periódicamente (cron o al consultar la sesión).
 * 
 * @param {string} sesionId - ID de la sesión (opcional, si no se pasa expira todas)
 * @returns {number} Cantidad de entradas expiradas
 */
export const expirarListaEspera = async (sesionId = null) => {
  const where = {
    estado: 'OFERTADO',
    expiraEn: { lt: new Date() }
  };
  if (sesionId) where.sesionId = sesionId;

  // Obtener las entradas a expirar para luego liberar al siguiente
  const entradasAExpirar = await prisma.listaEspera.findMany({
    where,
    select: { id: true, sesionId: true, usuarioId: true }
  });

  if (entradasAExpirar.length === 0) return 0;

  // Marcar como expiradas
  await prisma.listaEspera.updateMany({
    where: { id: { in: entradasAExpirar.map(e => e.id) } },
    data: { estado: 'EXPIRADO' }
  });

  // Notificar a cada usuario expirado
  for (const entrada of entradasAExpirar) {
    await prisma.notificacionUsuario.create({
      data: {
        usuarioReceptorId: entrada.usuarioId,
        titulo: 'Tiempo expirado',
        mensaje: 'El lugar pasó al siguiente en la lista de espera.',
        tipo: 'LISTA_ESPERA_EXPIRADO',
        datos: JSON.stringify({ sesionId: entrada.sesionId })
      }
    });

    // Liberar al siguiente en esa sesión
    await liberarSiguienteEnEspera(entrada.sesionId);
  }

  return entradasAExpirar.length;
};
