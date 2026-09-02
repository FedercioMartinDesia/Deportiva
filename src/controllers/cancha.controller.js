import prisma from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { geocodificarDireccion } from '../utils/geocoding.js';

// Función para calcular distancia entre dos puntos (fórmula de Haversine)
const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en km
};

// Obtener todas las canchas (con filtros)
export const getCanchas = async (req, res, next) => {
  try {
    const {
      deporte,
      ciudad,
      minPrecio,
      maxPrecio,
      techada,
      capacidad,
      page = 1,
      limit = 10
    } = req.query;

    const where = {
      activa: true,
      // Solo mostrar canchas de propietarios con suscripción activa
      propietario: {
        suscripcionActiva: true,
        activo: true
      },
      ...(deporte && { deporte }),
      ...(ciudad && { ciudad: { contains: ciudad, mode: 'insensitive' } }),
      ...(minPrecio && { precioPorHora: { gte: parseFloat(minPrecio) } }),
      ...(maxPrecio && { precioPorHora: { lte: parseFloat(maxPrecio) } }),
      ...(techada !== undefined && { techada: techada === 'true' }),
      ...(capacidad && { capacidadJugadores: { gte: parseInt(capacidad) } })
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [canchas, total] = await Promise.all([
      prisma.cancha.findMany({
        where,
        include: {
          propietario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              telefono: true
            }
          },
          resenas: {
            select: {
              calificacion: true
            }
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.cancha.count({ where })
    ]);

    // Calcular promedio de calificaciones
    const canchasConCalificacion = canchas.map(cancha => {
      const calificaciones = cancha.resenas.map(r => r.calificacion);
      const promedio = calificaciones.length > 0
        ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length
        : 0;

      return {
        ...cancha,
        calificacionPromedio: Math.round(promedio * 10) / 10,
        totalResenas: calificaciones.length
      };
    });

    res.json({
      success: true,
      data: canchasConCalificacion,
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

// Obtener canchas cercanas a una ubicación
export const getCanchasCercanas = async (req, res, next) => {
  try {
    const { latitud, longitud, radio = 50, deporte, limit = 20, ciudad } = req.query;

    if (!latitud || !longitud) {
      throw new AppError('Se requieren latitud y longitud', 400);
    }

    const lat = parseFloat(latitud);
    const lon = parseFloat(longitud);
    const radioKm = parseFloat(radio);

    // Paso 1: Obtener canchas activas con coordenadas exactas (para calcular distancia)
    const where = {
      activa: true,
      // Solo mostrar canchas de propietarios con suscripción activa
      propietario: {
        suscripcionActiva: true,
        activo: true
      },
      latitud: { not: null },
      longitud: { not: null },
      ...(deporte && { deporte })
    };

    const canchasConCoordenadas = await prisma.cancha.findMany({
      where,
      include: {
        propietario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true
          }
        },
        resenas: {
          select: {
            calificacion: true
          }
        }
      }
    });

    // Calcular distancia para cada cancha y filtrar por radio
    const canchasCercanas = canchasConCoordenadas
      .map(cancha => {
        const distancia = calcularDistancia(lat, lon, cancha.latitud, cancha.longitud);
        
        const calificaciones = cancha.resenas.map(r => r.calificacion);
        const promedio = calificaciones.length > 0
          ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length
          : 0;

        return {
          ...cancha,
          distancia: Math.round(distancia * 10) / 10,
          calificacionPromedio: Math.round(promedio * 10) / 10,
          totalResenas: calificaciones.length
        };
      })
      .filter(cancha => cancha.distancia <= radioKm)
      .sort((a, b) => a.distancia - b.distancia)
      .slice(0, parseInt(limit));

    // Paso 2: Si no hay resultados en el radio, obtener todas las canchas activas (sin coordenadas requeridas)
    let resultados = canchasCercanas;
    if (canchasCercanas.length === 0) {
      console.log('Sin canchas en radio de ' + radioKm + ' km, buscando todas las canchas activas...');
      
      const whereTodas = {
        activa: true,
        propietario: {
          suscripcionActiva: true,
          activo: true
        },
        ...(deporte && { deporte })
      };

      const todasLasCanchas = await prisma.cancha.findMany({
        where: whereTodas,
        include: {
          propietario: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              telefono: true
            }
          },
          resenas: {
            select: {
              calificacion: true
            }
          }
        },
        take: parseInt(limit)
      });

      resultados = todasLasCanchas.map(cancha => {
        const calificaciones = cancha.resenas.map(r => r.calificacion);
        const promedio = calificaciones.length > 0
          ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length
          : 0;

        return {
          ...cancha,
          distancia: null, // Sin distancia exacta
          calificacionPromedio: Math.round(promedio * 10) / 10,
          totalResenas: calificaciones.length
        };
      });
    }

    res.json({
      success: true,
      data: resultados,
      ubicacion: {
        latitud: lat,
        longitud: lon,
        radio: radioKm,
        conRadio: resultados.length > 0 && resultados[0].distancia !== null
      },
      total: resultados.length,
      mensaje: resultados.length === 0 
        ? 'No se encontraron canchas' 
        : canchasCercanas.length === 0 && resultados.length > 0
        ? 'Mostrando todas las canchas activas (sin resultados en el radio de búsqueda)'
        : 'Canchas encontradas en el radio de búsqueda'
    });
  } catch (error) {
    next(error);
  }
};

// Obtener una cancha por ID
export const getCanchaById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cancha = await prisma.cancha.findUnique({
      where: { id },
      include: {
        propietario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            telefono: true,
            email: true,
            mpAccessToken: true
          }
        },
        horarios: {
          where: { activo: true },
          orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }]
        },
        diasEspeciales: {
          where: {
            fecha: { gte: new Date() }
          },
          orderBy: { fecha: 'asc' }
        },
        resenas: {
          include: {
            usuario: {
              select: {
                nombre: true,
                apellido: true,
                foto: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!cancha) {
      throw new AppError('Espacio no encontrado', 404);
    }

    // Calcular promedio de calificaciones
    const calificaciones = cancha.resenas.map(r => r.calificacion);
    const promedio = calificaciones.length > 0
      ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length
      : 0;

    // Verificar si el propietario tiene MP configurado (sin exponer el token)
    const tieneMercadoPago = !!cancha.propietario?.mpAccessToken;

    // Remover el token de la respuesta
    const { mpAccessToken, ...propietarioSinToken } = cancha.propietario || {};

    // Parsear telefonos de JSON string a array
    let telefonosParsed = [];
    if (cancha.telefonos) {
      try {
        telefonosParsed = JSON.parse(cancha.telefonos);
      } catch (e) {
        console.error('Error parsing telefonos:', e);
      }
    }

    res.json({
      success: true,
      data: {
        ...cancha,
        telefonos: telefonosParsed,
        propietario: propietarioSinToken,
        tieneMercadoPago,
        calificacionPromedio: Math.round(promedio * 10) / 10,
        totalResenas: calificaciones.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// Crear nueva cancha (solo propietarios)
export const createCancha = async (req, res, next) => {
  try {
    const {
      nombre,
      descripcion,
      deporte,
      direccion,
      ciudad,
      provincia,
      capacidadJugadores,
      precioPorHora,
      superficieTipo,
      imagenes,
      imagenPrincipal,
      latitud,
      longitud,
      amenities,
      // Nuevos campos
      horasLimiteCancelacion,
      horarios,
      diasEspeciales,
      serviciosPersonalizados,
      telefonos,
      // Campos booleanos directos
      techada,
      vestuarios,
      estacionamiento,
      iluminacion,
      parrilla,
      buffet,
      duchas,
      wifi,
      gimnasio,
      camaras,
      tribuna,
      gradas,
      torneos,
      escuelita,
      ayudaMedica,
      cumpleanos,
      colegios
    } = req.body;

    // Procesar amenities: usar campos booleanos directos o convertir array
    let amenitiesFields = {
      techada: techada ?? false,
      vestuarios: vestuarios ?? false,
      estacionamiento: estacionamiento ?? false,
      iluminacion: iluminacion ?? false,
      parrilla: parrilla ?? false,
      buffet: buffet ?? false,
      duchas: duchas ?? false,
      wifi: wifi ?? false,
      gimnasio: gimnasio ?? false,
      camaras: camaras ?? false,
      tribuna: tribuna ?? false,
      gradas: gradas ?? false,
      torneos: torneos ?? false,
      escuelita: escuelita ?? false,
      ayudaMedica: ayudaMedica ?? false,
      cumpleanos: cumpleanos ?? false,
      colegios: colegios ?? false,
    };

    // Si se envían como array (compatibilidad hacia atrás)
    if (amenities && Array.isArray(amenities)) {
      const amenitiesMap = {
        'techada': 'techada',
        'vestuarios': 'vestuarios',
        'estacionamiento': 'estacionamiento',
        'iluminacion': 'iluminacion',
        'parrilla': 'parrilla',
        'buffet': 'buffet',
        'duchas': 'duchas',
        'wifi': 'wifi',
        'gimnasio': 'gimnasio',
        'camaras': 'camaras',
        'tribuna': 'tribuna',
        'gradas': 'gradas',
        'torneos': 'torneos',
        'escuelita': 'escuelita',
        'ayudaMedica': 'ayudaMedica',
        'cumpleanos': 'cumpleanos',
        'colegios': 'colegios',
      };

      amenities.forEach(amenity => {
        if (amenitiesMap[amenity]) {
          amenitiesFields[amenitiesMap[amenity]] = true;
        }
      });
    }

    // Intentar geocodificar la dirección si no se proporcionan coordenadas
    let coordenadas = { latitud: null, longitud: null };
    if (latitud && longitud) {
      coordenadas = { latitud: parseFloat(latitud), longitud: parseFloat(longitud) };
    } else {
      console.log('🔍 Geocodificando:', direccion, ciudad, provincia);
      const geo = await geocodificarDireccion(direccion, ciudad, provincia);
      if (geo) {
        coordenadas = geo;
        console.log('✅ Coordenadas obtenidas:', coordenadas);
      } else {
        console.log('⚠️ No se pudieron obtener coordenadas automáticas');
      }
    }

    // Establecer imagen principal automáticamente si no se proporciona
    const imagenPrincipalFinal = imagenPrincipal || (imagenes && imagenes.length > 0 ? imagenes[0] : null);
    
    const cancha = await prisma.cancha.create({
      data: {
        nombre,
        descripcion,
        deporte,
        direccion,
        ciudad,
        provincia,
        capacidadJugadores: parseInt(capacidadJugadores),
        precioPorHora: parseFloat(precioPorHora),
        superficieTipo: superficieTipo || 'Cemento',
        imagenes: imagenes || [],
        imagenPrincipal: imagenPrincipalFinal,
        latitud: coordenadas.latitud,
        longitud: coordenadas.longitud,
        propietarioId: req.usuario.id,
        horasLimiteCancelacion: horasLimiteCancelacion ? parseInt(horasLimiteCancelacion) : 24,
        serviciosPersonalizados: serviciosPersonalizados || [],
        telefonos: telefonos ? JSON.stringify(telefonos) : null,
        ...amenitiesFields
      }
    });

    // Crear horarios si se proporcionan
    if (horarios && Array.isArray(horarios) && horarios.length > 0) {
      await prisma.horarioDisponible.createMany({
        data: horarios.map((h) => ({
          canchaId: cancha.id,
          diaSemana: h.diaSemana,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin,
        })),
      });
    }

    // Crear días especiales si se proporcionan
    if (diasEspeciales && Array.isArray(diasEspeciales) && diasEspeciales.length > 0) {
      const diasData = diasEspeciales.map(dia => ({
        canchaId: cancha.id,
        fecha: new Date(dia.fecha || dia.fechaInicio),
        tipo: dia.tipo,
        motivo: dia.motivo || null,
        horaApertura: dia.horaApertura || null,
        horaCierre: dia.horaCierre || null,
      }));

      await prisma.diaEspecial.createMany({
        data: diasData
      });
    }

    // Obtener la cancha con sus horarios y días especiales
    const canchaConHorarios = await prisma.cancha.findUnique({
      where: { id: cancha.id },
      include: { horarios: true, diasEspeciales: true }
    });

    res.status(201).json({
      success: true,
      message: 'Espacio creado exitosamente',
      data: canchaConHorarios
    });
  } catch (error) {
    next(error);
  }
};

// Actualizar cancha
export const updateCancha = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verificar que la cancha existe y pertenece al usuario
    const cancha = await prisma.cancha.findUnique({
      where: { id }
    });

    if (!cancha) {
      throw new AppError('Espacio no encontrado', 404);
    }

    if (cancha.propietarioId !== req.usuario.id && req.usuario.rol !== 'ADMIN') {
      throw new AppError('No tienes permiso para actualizar este espacio', 403);
    }

    // Mapear amenities array a campos booleanos
    const updateData = { ...req.body };
    const { amenities, telefonos, serviciosPersonalizados } = req.body;

    // Manejar telefonos (convertir array a JSON string)
    if (telefonos !== undefined) {
      updateData.telefonos = telefonos ? JSON.stringify(telefonos) : null;
    }

    // Manejar serviciosPersonalizados
    if (serviciosPersonalizados !== undefined) {
      updateData.serviciosPersonalizados = serviciosPersonalizados || [];
    }

    if (amenities && Array.isArray(amenities)) {
      // Resetear todos los amenities a false
      updateData.techada = false;
      updateData.vestuarios = false;
      updateData.estacionamiento = false;
      updateData.iluminacion = false;
      updateData.parrilla = false;
      updateData.buffet = false;
      updateData.duchas = false;
      updateData.wifi = false;
      updateData.gimnasio = false;
      updateData.camaras = false;
      updateData.tribuna = false;
      updateData.gradas = false;
      updateData.torneos = false;
      updateData.escuelita = false;
      updateData.ayudaMedica = false;
      updateData.cumpleanos = false;
      updateData.colegios = false;

      // Establecer los amenities que vienen en el array
      const amenitiesMap = {
        'techada': 'techada',
        'vestuarios': 'vestuarios',
        'estacionamiento': 'estacionamiento',
        'iluminacion': 'iluminacion',
        'parrilla': 'parrilla',
        'buffet': 'buffet',
        'duchas': 'duchas',
        'wifi': 'wifi',
        'gimnasio': 'gimnasio',
        'camaras': 'camaras',
        'tribuna': 'tribuna',
        'gradas': 'gradas',
        'torneos': 'torneos',
        'escuelita': 'escuelita',
        'ayudaMedica': 'ayudaMedica',
        'cumpleanos': 'cumpleanos',
        'colegios': 'colegios',
      };

      amenities.forEach(amenity => {
        if (amenitiesMap[amenity]) {
          updateData[amenitiesMap[amenity]] = true;
        }
      });

      // Eliminar el array de amenities del updateData
      delete updateData.amenities;
    }

    // Establecer imagen principal si se actualizan las imágenes
    if (updateData.imagenes && updateData.imagenes.length > 0 && !updateData.imagenPrincipal) {
      updateData.imagenPrincipal = updateData.imagenes[0];
    }

    // Si se actualiza la dirección/ciudad/provincia, geocodificar
    const { direccion, ciudad, provincia, latitud, longitud } = req.body;

    if ((direccion || ciudad || provincia) && !latitud && !longitud) {
      // Usar los nuevos valores o los existentes
      const dir = direccion || cancha.direccion;
      const ciud = ciudad || cancha.ciudad;
      const prov = provincia || cancha.provincia;
      
      console.log('🔍 Geocodificando actualización:', dir, ciud, prov);
      const geo = await geocodificarDireccion(dir, ciud, prov);
      if (geo) {
        updateData.latitud = geo.latitud;
        updateData.longitud = geo.longitud;
        console.log('✅ Nuevas coordenadas:', geo);
      }
    }

    // Extraer diasEspeciales del updateData
    const { diasEspeciales } = updateData;
    delete updateData.diasEspeciales;

    const canchaActualizada = await prisma.cancha.update({
      where: { id },
      data: updateData
    });

    // Manejar días especiales si se enviaron
    if (diasEspeciales && Array.isArray(diasEspeciales)) {
      // Eliminar días especiales antiguos
      await prisma.diaEspecial.deleteMany({
        where: { canchaId: id }
      });

      // Crear nuevos días especiales
      if (diasEspeciales.length > 0) {
        const diasData = diasEspeciales.map(dia => ({
          canchaId: id,
          fecha: new Date(dia.fecha),
          tipo: dia.tipo,
          motivo: dia.motivo || null,
          horaApertura: dia.horaApertura || null,
          horaCierre: dia.horaCierre || null,
        }));

        await prisma.diaEspecial.createMany({
          data: diasData
        });
      }
    }

    res.json({
      success: true,
      message: 'Espacio actualizado exitosamente',
      data: canchaActualizada
    });
  } catch (error) {
    next(error);
  }
};

// Eliminar cancha (eliminación física)
export const deleteCancha = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cancha = await prisma.cancha.findUnique({
      where: { id }
    });

    if (!cancha) {
      throw new AppError('Espacio no encontrado', 404);
    }

    if (cancha.propietarioId !== req.usuario.id && req.usuario.rol !== 'ADMIN') {
      throw new AppError('No tienes permiso para eliminar este espacio', 403);
    }

    await prisma.cancha.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Espacio eliminado exitosamente'
    });
  } catch (error) {
    next(error);
  }
};

// Agregar reseña a una cancha
export const addResena = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { calificacion, comentario } = req.body;

    if (!calificacion || calificacion < 1 || calificacion > 5) {
      throw new AppError('La calificación debe estar entre 1 y 5', 400);
    }

    // Verificar que el usuario haya reservado la cancha
    const reservaPrevia = await prisma.reserva.findFirst({
      where: {
        usuarioId: req.usuario.id,
        canchaId: id,
        estado: 'COMPLETADA'
      }
    });

    if (!reservaPrevia) {
      throw new AppError('Solo puedes reseñar espacios que hayas reservado', 400);
    }

    const resena = await prisma.resena.create({
      data: {
        usuarioId: req.usuario.id,
        canchaId: id,
        calificacion: parseInt(calificacion),
        comentario
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            foto: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Reseña agregada exitosamente',
      data: resena
    });
  } catch (error) {
    next(error);
  }
};

// Obtener canchas del propietario autenticado
export const getMisCanchas = async (req, res, next) => {
  try {
    const canchas = await prisma.cancha.findMany({
      where: {
        propietarioId: req.usuario.id,
        activa: true
      },
      include: {
        _count: {
          select: {
            reservas: true,
            resenas: true
          }
        },
        resenas: {
          select: {
            calificacion: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calcular calificación promedio para cada cancha
    const canchasConCalificacion = canchas.map(cancha => {
      const totalResenas = cancha.resenas.length;
      const sumaCalificaciones = cancha.resenas.reduce((sum, r) => sum + r.calificacion, 0);
      const calificacionPromedio = totalResenas > 0 ? (sumaCalificaciones / totalResenas).toFixed(1) : 0;

      const { resenas, ...canchaData } = cancha;
      
      return {
        ...canchaData,
        calificacionPromedio: parseFloat(calificacionPromedio),
        totalResenas
      };
    });

    res.json({
      success: true,
      data: canchasConCalificacion
    });
  } catch (error) {
    next(error);
  }
};
