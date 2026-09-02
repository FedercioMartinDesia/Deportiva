import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// POST /profesores/registro — Crear perfil de profesor
// Puede ser usuario existente (JUGADOR que se convierte en profesor) o cuenta nueva.
// Setea esProfesor=true en Usuario y crea PerfilProfesor.
// Estado post-registro: perfil queda sin verificar. Puede crear clases en BORRADOR.
export const registroProfesor = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { deportes, descripcion, anosExperiencia, certificaciones, niveles } = req.body;

    if (!deportes || deportes.length === 0) {
      throw new AppError('Debes seleccionar al menos un deporte', 400);
    }

    if (!niveles || niveles.length === 0) {
      throw new AppError('Debes seleccionar al menos un nivel', 400);
    }

    // Verificar si ya tiene perfil de profesor
    const perfilExistente = await prisma.perfilProfesor.findUnique({
      where: { usuarioId: userId }
    });

    if (perfilExistente) {
      throw new AppError('Ya tienes un perfil de profesor registrado', 400);
    }

    // Transacción: activar esProfesor + crear perfil
    const resultado = await prisma.$transaction(async (tx) => {
      await tx.usuario.update({
        where: { id: userId },
        data: { esProfesor: true }
      });

      const perfil = await tx.perfilProfesor.create({
        data: {
          usuarioId: userId,
          deportes,
          descripcion: descripcion || null,
          anosExperiencia: parseInt(anosExperiencia) || 0,
          certificaciones: certificaciones || [],
          niveles
        },
        include: {
          usuario: {
            select: { id: true, nombre: true, apellido: true, foto: true, email: true }
          }
        }
      });

      return perfil;
    });

    res.status(201).json({
      success: true,
      message: 'Perfil de profesor creado. Queda pendiente de verificación por un administrador.',
      data: resultado
    });
  } catch (error) {
    next(error);
  }
};

// GET /profesores/:id — Perfil público del profesor
// Devuelve toda la info que necesita la pantalla de perfil público:
// foto, nombre, verificado, deportes, calificación, bio, certificaciones,
// años experiencia, clubes, clases activas próximas (máx 5), últimas reseñas (máx 3)
export const getPerfilProfesor = async (req, res, next) => {
  try {
    const { id } = req.params;

    const perfil = await prisma.perfilProfesor.findFirst({
      where: {
        OR: [
          { id },
          { usuarioId: id }
        ]
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            foto: true,
            alias: true,
            ciudad: true,
            provincia: true,
            esProfesor: true,
            vinculosComoProfesor: {
              where: { estado: 'ACTIVO' },
              include: {
                establecimiento: {
                  select: {
                    id: true,
                    nombre: true,
                    apellido: true,
                    canchasPropiedad: {
                      where: { activa: true },
                      select: { id: true, nombre: true }
                    }
                  }
                }
              }
            },
            clasesComoProfesor: {
              where: { estado: 'ACTIVA' },
              take: 5,
              orderBy: { createdAt: 'desc' },
              include: {
                cancha: {
                  select: { id: true, nombre: true, direccion: true }
                },
                sesiones: {
                  where: {
                    fecha: { gte: new Date() },
                    estado: 'PROGRAMADA'
                  },
                  take: 1,
                  orderBy: { fecha: 'asc' },
                  select: { id: true, fecha: true, horaInicio: true, horaFin: true, cuposDisponibles: true }
                }
              }
            },
            resenasClaseRecibidas: {
              take: 3,
              orderBy: { createdAt: 'desc' },
              include: {
                participante: {
                  select: { id: true, nombre: true, alias: true, foto: true }
                }
              }
            }
          }
        }
      }
    });

    if (!perfil) {
      throw new AppError('Profesor no encontrado', 404);
    }

    // Formatear respuesta para la UX
    const usuario = perfil.usuario;
    const response = {
      id: perfil.id,
      usuarioId: usuario.id,
      nombre: `${usuario.nombre} ${usuario.apellido}`,
      foto: usuario.foto,
      alias: usuario.alias,
      verificado: perfil.verificado,
      deportes: perfil.deportes,
      niveles: perfil.niveles,
      descripcion: perfil.descripcion,
      anosExperiencia: perfil.anosExperiencia,
      certificaciones: perfil.certificaciones,
      calificacionPromedio: perfil.calificacionPromedio,
      cantidadResenas: perfil.cantidadResenas,
      ubicacion: [usuario.ciudad, usuario.provincia].filter(Boolean).join(', '),
      clubes: usuario.vinculosComoProfesor.map(v => ({
        establecimientoId: v.establecimiento.id,
        nombre: `${v.establecimiento.nombre} ${v.establecimiento.apellido}`.trim(),
        tipoVinculo: v.tipoVinculo,
        canchas: v.establecimiento.canchasPropiedad
      })),
      clasesActivas: usuario.clasesComoProfesor.map(c => ({
        id: c.id,
        nombre: c.nombre,
        deporte: c.deporte,
        tipoClase: c.tipoClase,
        nivel: c.nivel,
        precioTotal: c.precioTotal,
        cupoMaximo: c.cupoMaximo,
        cancha: c.cancha,
        proximaSesion: c.sesiones[0] || null
      })),
      ultimasResenas: usuario.resenasClaseRecibidas.map(r => ({
        id: r.id,
        calificacion: r.calificacion,
        comentario: r.comentario,
        fecha: r.createdAt,
        participante: {
          nombre: r.participante.alias || r.participante.nombre,
          foto: r.participante.foto
        }
      }))
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
};

// POST /profesores/:id/vincular-establecimiento — Solicitar vínculo con un club
// El profesor envía solicitud al propietario. Queda en estado PENDIENTE.
export const solicitarVinculo = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id: profesorId } = req.params;
    const { establecimientoId, tipoVinculo, metodoPagoEspacio, comisionClub } = req.body;

    // Solo el propio profesor puede solicitar su vínculo
    if (userId !== profesorId) {
      throw new AppError('Solo puedes gestionar tus propios vínculos', 403);
    }

    // Verificar que el usuario es profesor
    const usuario = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { esProfesor: true }
    });

    if (!usuario?.esProfesor) {
      throw new AppError('Debes ser profesor para vincular con un establecimiento', 403);
    }

    if (!establecimientoId) {
      throw new AppError('Debes especificar el establecimiento', 400);
    }

    // Verificar que el establecimiento existe y es PROPIETARIO
    const establecimiento = await prisma.usuario.findUnique({
      where: { id: establecimientoId },
      select: { id: true, rol: true, nombre: true, apellido: true }
    });

    if (!establecimiento || establecimiento.rol !== 'PROPIETARIO') {
      throw new AppError('Establecimiento no encontrado o no es propietario', 404);
    }

    // Verificar que no exista vínculo previo
    const vinculoExistente = await prisma.vinculoProfesorEstablecimiento.findUnique({
      where: {
        profesorId_establecimientoId: {
          profesorId: userId,
          establecimientoId
        }
      }
    });

    if (vinculoExistente) {
      if (vinculoExistente.estado === 'ACTIVO') {
        throw new AppError('Ya tienes un vínculo activo con este establecimiento', 400);
      }
      if (vinculoExistente.estado === 'PENDIENTE') {
        throw new AppError('Ya tienes una solicitud pendiente con este establecimiento', 400);
      }
    }

    const vinculo = await prisma.vinculoProfesorEstablecimiento.create({
      data: {
        profesorId: userId,
        establecimientoId,
        tipoVinculo: tipoVinculo || 'EXTERNO',
        metodoPagoEspacio: metodoPagoEspacio || 'EXTERNO',
        comisionClub: comisionClub != null ? parseFloat(comisionClub) : null,
        estado: 'PENDIENTE'
      }
    });

    // Notificar al propietario
    await prisma.notificacionUsuario.create({
      data: {
        usuarioReceptorId: establecimientoId,
        usuarioEmisorId: userId,
        titulo: 'Solicitud de profesor',
        mensaje: `${req.usuario.nombre} quiere vincularse a tu establecimiento como profesor ${tipoVinculo === 'STAFF' ? 'de staff' : 'externo'}.`,
        tipo: 'VINCULO_PROFESOR',
        datos: JSON.stringify({ vinculoId: vinculo.id })
      }
    });

    res.status(201).json({
      success: true,
      message: 'Solicitud de vínculo enviada al propietario',
      data: vinculo
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /establecimientos/:id/vinculos/:vinculoId — Aprobar/rechazar vínculo
// Solo el propietario del establecimiento puede aprobar o rechazar.
export const gestionarVinculo = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id: establecimientoId, vinculoId } = req.params;
    const { accion, motivoRechazo, aprobacionAutomatica, metodoPagoEspacio, comisionClub } = req.body;

    // Solo el propietario puede gestionar sus vínculos
    if (userId !== establecimientoId) {
      throw new AppError('Solo puedes gestionar los vínculos de tu establecimiento', 403);
    }

    if (!['aprobar', 'rechazar', 'desactivar'].includes(accion)) {
      throw new AppError('Acción debe ser: aprobar, rechazar o desactivar', 400);
    }

    const vinculo = await prisma.vinculoProfesorEstablecimiento.findUnique({
      where: { id: vinculoId },
      include: {
        profesor: { select: { id: true, nombre: true } }
      }
    });

    if (!vinculo || vinculo.establecimientoId !== establecimientoId) {
      throw new AppError('Vínculo no encontrado', 404);
    }

    let nuevoEstado;
    let mensaje;

    if (accion === 'aprobar') {
      if (vinculo.estado !== 'PENDIENTE') {
        throw new AppError('Solo se pueden aprobar vínculos pendientes', 400);
      }
      nuevoEstado = 'ACTIVO';
      mensaje = '¡Tu solicitud fue aprobada! Ya puedes crear clases en este establecimiento.';
    } else if (accion === 'rechazar') {
      if (vinculo.estado !== 'PENDIENTE') {
        throw new AppError('Solo se pueden rechazar vínculos pendientes', 400);
      }
      nuevoEstado = 'RECHAZADO';
      mensaje = motivoRechazo
        ? `Tu solicitud fue rechazada. Motivo: ${motivoRechazo}`
        : 'Tu solicitud de vínculo fue rechazada.';
    } else {
      // desactivar
      if (vinculo.estado !== 'ACTIVO') {
        throw new AppError('Solo se pueden desactivar vínculos activos', 400);
      }
      nuevoEstado = 'INACTIVO';
      mensaje = 'Tu vínculo con este establecimiento fue desactivado.';
    }

    const updateData = {
      estado: nuevoEstado,
      motivoRechazo: accion === 'rechazar' ? (motivoRechazo || null) : vinculo.motivoRechazo
    };

    // Al aprobar, el propietario puede configurar parámetros del vínculo
    if (accion === 'aprobar') {
      if (aprobacionAutomatica !== undefined) updateData.aprobacionAutomatica = aprobacionAutomatica;
      if (metodoPagoEspacio) updateData.metodoPagoEspacio = metodoPagoEspacio;
      if (comisionClub != null) updateData.comisionClub = parseFloat(comisionClub);
    }

    const vinculoActualizado = await prisma.vinculoProfesorEstablecimiento.update({
      where: { id: vinculoId },
      data: updateData
    });

    // Notificar al profesor
    await prisma.notificacionUsuario.create({
      data: {
        usuarioReceptorId: vinculo.profesorId,
        usuarioEmisorId: userId,
        titulo: accion === 'aprobar' ? 'Vínculo aprobado' : accion === 'rechazar' ? 'Vínculo rechazado' : 'Vínculo desactivado',
        mensaje,
        tipo: 'VINCULO_PROFESOR_RESPUESTA',
        datos: JSON.stringify({ vinculoId })
      }
    });

    res.json({
      success: true,
      message: `Vínculo ${nuevoEstado.toLowerCase()} correctamente`,
      data: vinculoActualizado
    });
  } catch (error) {
    next(error);
  }
};

// GET /profesores/mis-vinculos — Ver mis vínculos como profesor
export const getMisVinculos = async (req, res, next) => {
  try {
    const userId = req.usuario.id;

    const vinculos = await prisma.vinculoProfesorEstablecimiento.findMany({
      where: { profesorId: userId },
      include: {
        establecimiento: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            foto: true,
            canchasPropiedad: {
              where: { activa: true },
              select: { id: true, nombre: true, deporte: true, direccion: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: vinculos });
  } catch (error) {
    next(error);
  }
};

// GET /establecimientos/:id/vinculos — Ver profesores vinculados (para el propietario)
export const getVinculosEstablecimiento = async (req, res, next) => {
  try {
    const userId = req.usuario.id;
    const { id: establecimientoId } = req.params;

    if (userId !== establecimientoId && req.usuario.rol !== 'ADMIN') {
      throw new AppError('Solo puedes ver los vínculos de tu establecimiento', 403);
    }

    const vinculos = await prisma.vinculoProfesorEstablecimiento.findMany({
      where: { establecimientoId },
      include: {
        profesor: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            foto: true,
            perfilProfesor: {
              select: {
                deportes: true,
                calificacionPromedio: true,
                cantidadResenas: true,
                verificado: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: vinculos });
  } catch (error) {
    next(error);
  }
};
