import bcrypt from 'bcrypt';
import prisma from './src/config/database.js';

async function createPropietarioWithCanchas() {
  try {
    const hashedPassword = await bcrypt.hash('propietario123', 10);
    
    // Crear usuario propietario
    const propietario = await prisma.usuario.create({
      data: {
        nombre: 'Juan',
        apellido: 'Propietario',
        email: 'propietario@test.com',
        telefono: '+5491187654321',
        password: hashedPassword,
        rol: 'PROPIETARIO'
      }
    });

    console.log('✅ Usuario propietario creado:');
    console.log('📧 Email: propietario@test.com');
    console.log('🔑 Password: propietario123');
    console.log('📱 Teléfono: +5491187654321');
    console.log('👤 Rol: PROPIETARIO');
    console.log(`🆔 ID: ${propietario.id}\n`);

    // Crear canchas
    const canchas = [
      {
        nombre: 'Cancha Fútbol 5 - La Bombonera',
        descripcion: 'Cancha de fútbol 5 con césped sintético de última generación',
        deporte: 'FUTBOL_5',
        direccion: 'Av. Libertador 1234',
        ciudad: 'Buenos Aires',
        provincia: 'Buenos Aires',
        codigoPostal: '1425',
        capacidadJugadores: 10,
        techada: true,
        superficieTipo: 'Césped sintético',
        precioPorHora: 15000,
        vestuarios: true,
        estacionamiento: true,
        iluminacion: true,
        duchas: true,
        wifi: true,
        camaras: true,
        imagenes: ['https://example.com/cancha1.jpg'],
        activa: true,
        verificada: true,
        propietarioId: propietario.id
      },
      {
        nombre: 'Cancha Fútbol 7 - El Monumental',
        descripcion: 'Amplia cancha de fútbol 7 ideal para partidos competitivos',
        deporte: 'FUTBOL_7',
        direccion: 'Av. Figueroa Alcorta 7597',
        ciudad: 'Buenos Aires',
        provincia: 'Buenos Aires',
        codigoPostal: '1428',
        capacidadJugadores: 14,
        techada: false,
        superficieTipo: 'Césped natural',
        precioPorHora: 25000,
        vestuarios: true,
        estacionamiento: true,
        iluminacion: true,
        parrilla: true,
        buffet: true,
        duchas: true,
        tribuna: true,
        gradas: true,
        imagenes: ['https://example.com/cancha2.jpg'],
        activa: true,
        verificada: true,
        propietarioId: propietario.id
      },
      {
        nombre: 'Cancha Pádel Premium',
        descripcion: 'Cancha de pádel profesional con vidrio panorámico',
        deporte: 'PADEL',
        direccion: 'Calle Falsa 123',
        ciudad: 'Buenos Aires',
        provincia: 'Buenos Aires',
        codigoPostal: '1414',
        capacidadJugadores: 4,
        techada: true,
        superficieTipo: 'Cemento poroso',
        precioPorHora: 12000,
        vestuarios: true,
        estacionamiento: true,
        iluminacion: true,
        duchas: true,
        wifi: true,
        buffet: true,
        imagenes: ['https://example.com/cancha3.jpg'],
        activa: true,
        verificada: true,
        propietarioId: propietario.id
      }
    ];

    console.log('🏟️  Creando canchas...\n');

    for (const canchaData of canchas) {
      const cancha = await prisma.cancha.create({
        data: canchaData
      });

      console.log(`✅ ${cancha.nombre}`);
      console.log(`   🏃 Deporte: ${cancha.deporte}`);
      console.log(`   📍 ${cancha.direccion}, ${cancha.ciudad}`);
      console.log(`   💰 Precio: $${cancha.precioPorHora}/hora`);
      console.log(`   🆔 ID: ${cancha.id}\n`);

      // Crear horarios disponibles para cada cancha (Lunes a Domingo, 8:00 a 23:00)
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

      console.log(`   ⏰ Horarios configurados: Todos los días 08:00 - 23:00\n`);
    }

    console.log('✅ Proceso completado exitosamente!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - 1 usuario propietario creado`);
    console.log(`   - ${canchas.length} canchas creadas`);
    console.log(`   - ${canchas.length * 7} horarios configurados`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createPropietarioWithCanchas();
