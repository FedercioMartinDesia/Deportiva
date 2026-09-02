import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear usuario de prueba (Jugador)
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const jugador = await prisma.usuario.upsert({
    where: { email: 'jugador@test.com' },
    update: {},
    create: {
      email: 'jugador@test.com',
      password: hashedPassword,
      nombre: 'Juan',
      apellido: 'Pérez',
      alias: 'juanpe',
      telefono: '1234567890',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      pais: 'Argentina',
      rol: 'JUGADOR',
      emailVerificado: true,
      activo: true,
      notificacionSettings: {
        create: {
          notificacionesActivas: true,
          usuariosBloqueados: []
        }
      }
    },
  });

  console.log('✅ Usuario Jugador creado:', jugador.email);

  // Crear usuario propietario de prueba
  const propietario = await prisma.usuario.upsert({
    where: { email: 'propietario@test.com' },
    update: {},
    create: {
      email: 'propietario@test.com',
      password: hashedPassword,
      nombre: 'Carlos',
      apellido: 'González',
      alias: 'carlosg',
      telefono: '0987654321',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      pais: 'Argentina',
      rol: 'PROPIETARIO',
      emailVerificado: true,
      activo: true,
      notificacionSettings: {
        create: {
          notificacionesActivas: true,
          usuariosBloqueados: []
        }
      }
    },
  });

  console.log('✅ Usuario Propietario creado:', propietario.email);

  // Crear usuario administrador
  const adminPassword = await bcrypt.hash('admin123456', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@deportiva.app' },
    update: {},
    create: {
      email: 'admin@deportiva.app',
      password: adminPassword,
      nombre: 'Administrador',
      apellido: 'Sistema',
      alias: 'admin',
      telefono: '+5491100000000',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      pais: 'Argentina',
      rol: 'ADMIN',
      emailVerificado: true,
      activo: true,
      notificacionSettings: {
        create: {
          notificacionesActivas: true,
          usuariosBloqueados: []
        }
      }
    },
  });

  console.log('✅ Usuario Admin creado:', admin.email);

  // Crear jugadores de prueba adicionales
  const jugadoresData = [
    { email: 'martin@test.com', nombre: 'Martín', apellido: 'González', alias: 'martincho', telefono: '+5491111111111' },
    { email: 'lucas@test.com', nombre: 'Lucas', apellido: 'Rodríguez', alias: 'luquitas', telefono: '+5491122222222' },
    { email: 'nicolas@test.com', nombre: 'Nicolás', apellido: 'Fernández', alias: 'nico_f', telefono: '+5491133333333' },
    { email: 'santiago@test.com', nombre: 'Santiago', apellido: 'López', alias: 'santi', telefono: '+5491144444444' },
  ];

  for (const jugadorData of jugadoresData) {
    const jugadorExtra = await prisma.usuario.upsert({
      where: { email: jugadorData.email },
      update: {},
      create: {
        email: jugadorData.email,
        password: hashedPassword,
        nombre: jugadorData.nombre,
        apellido: jugadorData.apellido,
        alias: jugadorData.alias,
        telefono: jugadorData.telefono,
        ciudad: 'Buenos Aires',
        provincia: 'Buenos Aires',
        pais: 'Argentina',
        rol: 'JUGADOR',
        emailVerificado: true,
        activo: true,
        notificacionSettings: {
          create: {
            notificacionesActivas: true,
            usuariosBloqueados: []
          }
        }
      },
    });
    console.log('✅ Jugador creado:', jugadorExtra.email, `(@${jugadorExtra.alias})`);
  }

  // Crear algunas canchas de ejemplo
  const cancha1 = await prisma.cancha.upsert({
    where: { id: 'cancha-1' },
    update: {},
    create: {
      id: 'cancha-1',
      nombre: 'Cancha Fútbol 5 Norte',
      descripcion: 'Cancha de fútbol 5 con césped sintético de última generación',
      deporte: 'FUTBOL_5',
      direccion: 'Av. Principal 123',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      codigoPostal: '1000',
      capacidadJugadores: 10,
      techada: true,
      superficieTipo: 'Césped sintético',
      precioPorHora: 5000,
      vestuarios: true,
      estacionamiento: true,
      iluminacion: true,
      duchas: true,
      imagenes: [],
      propietarioId: propietario.id,
    },
  });

  const cancha2 = await prisma.cancha.upsert({
    where: { id: 'cancha-2' },
    update: {},
    create: {
      id: 'cancha-2',
      nombre: 'Paddle Club Premium',
      descripcion: 'Cancha de paddle profesional con excelente iluminación',
      deporte: 'PADEL',
      direccion: 'Calle Deportes 456',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      codigoPostal: '1001',
      capacidadJugadores: 4,
      techada: false,
      superficieTipo: 'Cemento',
      precioPorHora: 3000,
      vestuarios: true,
      estacionamiento: true,
      iluminacion: true,
      buffet: true,
      imagenes: [],
      propietarioId: propietario.id,
    },
  });

  const cancha3 = await prisma.cancha.upsert({
    where: { id: 'cancha-3' },
    update: {},
    create: {
      id: 'cancha-3',
      nombre: 'Básquet Center',
      descripcion: 'Cancha de básquet cubierta con piso de parquet',
      deporte: 'BASQUET',
      direccion: 'Av. Deportiva 789',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      codigoPostal: '1002',
      capacidadJugadores: 10,
      techada: true,
      superficieTipo: 'Parquet',
      precioPorHora: 4000,
      vestuarios: true,
      estacionamiento: true,
      iluminacion: true,
      duchas: true,
      imagenes: [],
      propietarioId: propietario.id,
    },
  });

  const cancha4 = await prisma.cancha.upsert({
    where: { id: 'cancha-4' },
    update: {},
    create: {
      id: 'cancha-4',
      nombre: 'Cancha Chivilcoy Fútbol 5',
      descripcion: 'Cancha de fútbol 5 en pleno centro de Chivilcoy con excelente iluminación',
      deporte: 'FUTBOL_5',
      direccion: 'Pueyrredón 443',
      ciudad: 'Chivilcoy',
      provincia: 'Buenos Aires',
      codigoPostal: '6620',
      latitud: -34.8969,
      longitud: -60.0197,
      capacidadJugadores: 10,
      techada: false,
      superficieTipo: 'Césped sintético',
      precioPorHora: 4500,
      vestuarios: true,
      estacionamiento: true,
      iluminacion: true,
      duchas: true,
      buffet: true,
      imagenes: [],
      propietarioId: propietario.id,
    },
  });

  console.log('✅ Canchas creadas:', cancha1.nombre, cancha2.nombre, cancha3.nombre, cancha4.nombre);

  // Crear reservas de ejemplo
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const reserva1 = await prisma.reserva.upsert({
    where: { id: 'reserva-1' },
    update: {},
    create: {
      id: 'reserva-1',
      fecha: yesterday.toISOString(),
      horaInicio: '18:00',
      horaFin: '19:00',
      duracionHoras: 1,
      estado: 'COMPLETADA',
      precioTotal: 5000,
      metodoPago: 'Efectivo',
      usuarioId: jugador.id,
      canchaId: cancha1.id,
    },
  });

  const reserva2 = await prisma.reserva.upsert({
    where: { id: 'reserva-2' },
    update: {},
    create: {
      id: 'reserva-2',
      fecha: today.toISOString(),
      horaInicio: '20:00',
      horaFin: '21:00',
      duracionHoras: 1,
      estado: 'CONFIRMADA',
      precioTotal: 3000,
      metodoPago: 'Tarjeta',
      usuarioId: jugador.id,
      canchaId: cancha2.id,
    },
  });

  const reserva3 = await prisma.reserva.upsert({
    where: { id: 'reserva-3' },
    update: {},
    create: {
      id: 'reserva-3',
      fecha: tomorrow.toISOString(),
      horaInicio: '19:00',
      horaFin: '20:00',
      duracionHoras: 1,
      estado: 'CONFIRMADA',
      precioTotal: 5000,
      metodoPago: 'Tarjeta',
      usuarioId: jugador.id,
      canchaId: cancha1.id,
    },
  });

  const reserva4 = await prisma.reserva.upsert({
    where: { id: 'reserva-4' },
    update: {},
    create: {
      id: 'reserva-4',
      fecha: nextWeek.toISOString(),
      horaInicio: '17:00',
      horaFin: '18:00',
      duracionHoras: 1,
      estado: 'PENDIENTE',
      precioTotal: 4000,
      metodoPago: 'Pendiente',
      usuarioId: jugador.id,
      canchaId: cancha3.id,
    },
  });

  console.log('✅ Reservas creadas:', reserva1.id, reserva2.id, reserva3.id, reserva4.id);

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('\n📧 Credenciales de prueba:');
  console.log('\n👤 JUGADOR:');
  console.log('   Email: jugador@test.com');
  console.log('   Password: 123456');
  console.log('\n🏢 PROPIETARIO:');
  console.log('   Email: propietario@test.com');
  console.log('   Password: 123456');
  console.log('\n📅 Reservas de prueba creadas:');
  console.log('   - 1 reserva pasada (ayer)');
  console.log('   - 1 reserva hoy');
  console.log('   - 2 reservas futuras');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
