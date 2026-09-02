import prisma from './src/config/database.js';

async function addCanchaChivilcoy() {
  try {
    // Buscar el propietario
    const propietario = await prisma.usuario.findUnique({
      where: { email: 'propietario@test.com' }
    });

    if (!propietario) {
      throw new Error('Propietario no encontrado');
    }

    // Crear cancha en Chivilcoy
    const cancha = await prisma.cancha.create({
      data: {
        nombre: 'Cancha Fútbol 5 - Chivilcoy',
        descripcion: 'Cancha de fútbol 5 en el centro de Chivilcoy',
        deporte: 'FUTBOL_5',
        direccion: 'Salta 550',
        ciudad: 'Chivilcoy',
        provincia: 'Buenos Aires',
        codigoPostal: '6620',
        capacidadJugadores: 10,
        techada: true,
        superficieTipo: 'Césped sintético',
        precioPorHora: 12000,
        vestuarios: true,
        estacionamiento: true,
        iluminacion: true,
        duchas: true,
        wifi: false,
        imagenes: ['https://example.com/cancha-chivilcoy.jpg'],
        activa: true,
        verificada: true,
        propietarioId: propietario.id
      }
    });

    console.log('✅ Cancha creada exitosamente:');
    console.log(`🏟️  ${cancha.nombre}`);
    console.log(`🏃 Deporte: ${cancha.deporte}`);
    console.log(`📍 ${cancha.direccion}, ${cancha.ciudad}, ${cancha.provincia}`);
    console.log(`💰 Precio: $${cancha.precioPorHora}/hora`);
    console.log(`🆔 ID: ${cancha.id}\n`);

    // Crear horarios disponibles (Lunes a Domingo, 8:00 a 23:00)
    const horarios = [];
    for (let dia = 0; dia <= 6; dia++) {
      horarios.push({
        canchaId: cancha.id,
        diaSemana: dia,
        horaInicio: '08:00',
        horaFin: '23:00',
        activo: true
      });
    }

    await prisma.horarioDisponible.createMany({
      data: horarios
    });

    console.log('⏰ Horarios configurados: Todos los días 08:00 - 23:00');
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

addCanchaChivilcoy();
