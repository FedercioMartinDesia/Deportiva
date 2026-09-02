// seed-amigos.mjs - Script para crear amigos de prueba
import prisma from './src/config/database.js';
import bcrypt from 'bcrypt';

const amigosData = [
  {
    email: 'martin@test.com',
    nombre: 'Martín',
    apellido: 'González',
    alias: 'martincho',
    telefono: '1155551001',
  },
  {
    email: 'lucas@test.com',
    nombre: 'Lucas',
    apellido: 'Rodríguez',
    alias: 'luquitas',
    telefono: '1155551002',
  },
  {
    email: 'nicolas@test.com',
    nombre: 'Nicolás',
    apellido: 'Fernández',
    alias: 'nico_f',
    telefono: '1155551003',
  },
  {
    email: 'santiago@test.com',
    nombre: 'Santiago',
    apellido: 'López',
    alias: 'santi',
    telefono: '1155551004',
  },
  {
    email: 'facundo@test.com',
    nombre: 'Facundo',
    apellido: 'Martínez',
    alias: 'facu_m',
    telefono: '1155551005',
  },
  {
    email: 'tomas@test.com',
    nombre: 'Tomás',
    apellido: 'García',
    alias: 'tomi',
    telefono: '1155551006',
  },
  {
    email: 'agustin@test.com',
    nombre: 'Agustín',
    apellido: 'Pérez',
    alias: 'agus_p',
    telefono: '1155551007',
  },
  {
    email: 'matias@test.com',
    nombre: 'Matías',
    apellido: 'Sánchez',
    alias: 'mati',
    telefono: '1155551008',
  },
];

async function seedAmigos() {
  try {
    console.log('🔍 Buscando usuario jugador@test.com...');
    
    // Buscar el usuario jugador principal
    const jugadorPrincipal = await prisma.usuario.findUnique({
      where: { email: 'jugador@test.com' }
    });

    if (!jugadorPrincipal) {
      console.error('❌ No se encontró el usuario jugador@test.com');
      return;
    }

    console.log(`✅ Usuario encontrado: ${jugadorPrincipal.nombre} ${jugadorPrincipal.apellido}`);
    
    // Password hasheado (password: "123456" para todos)
    const hashedPassword = await bcrypt.hash('123456', 10);

    console.log('\n👥 Creando amigos...\n');

    const amigosCreados = [];

    for (const amigoData of amigosData) {
      // Verificar si ya existe
      const existente = await prisma.usuario.findUnique({
        where: { email: amigoData.email }
      });

      let amigo;
      if (existente) {
        console.log(`⚠️  ${amigoData.email} ya existe, actualizando...`);
        amigo = await prisma.usuario.update({
          where: { email: amigoData.email },
          data: {
            nombre: amigoData.nombre,
            apellido: amigoData.apellido,
            alias: amigoData.alias,
            telefono: amigoData.telefono,
            rol: 'JUGADOR',
            activo: true,
          }
        });
      } else {
        amigo = await prisma.usuario.create({
          data: {
            email: amigoData.email,
            password: hashedPassword,
            nombre: amigoData.nombre,
            apellido: amigoData.apellido,
            alias: amigoData.alias,
            telefono: amigoData.telefono,
            rol: 'JUGADOR',
            activo: true,
            ciudad: 'Buenos Aires',
            provincia: 'Buenos Aires',
            pais: 'Argentina',
          }
        });
        console.log(`✅ Creado: ${amigo.nombre} ${amigo.apellido} (@${amigo.alias})`);
      }

      amigosCreados.push(amigo);
    }

    console.log('\n🤝 Creando relaciones de amistad (seguimientos)...\n');

    // Crear seguimientos bidireccionales (jugador sigue a amigos y amigos siguen a jugador)
    for (const amigo of amigosCreados) {
      // Verificar si ya existe el seguimiento
      const seguimientoExistente1 = await prisma.seguimiento.findUnique({
        where: {
          seguidorId_seguidoId: {
            seguidorId: jugadorPrincipal.id,
            seguidoId: amigo.id
          }
        }
      });

      if (!seguimientoExistente1) {
        await prisma.seguimiento.create({
          data: {
            seguidorId: jugadorPrincipal.id,
            seguidoId: amigo.id
          }
        });
        console.log(`✅ jugador@test.com ahora sigue a @${amigo.alias}`);
      }

      // Seguimiento inverso (el amigo sigue al jugador)
      const seguimientoExistente2 = await prisma.seguimiento.findUnique({
        where: {
          seguidorId_seguidoId: {
            seguidorId: amigo.id,
            seguidoId: jugadorPrincipal.id
          }
        }
      });

      if (!seguimientoExistente2) {
        await prisma.seguimiento.create({
          data: {
            seguidorId: amigo.id,
            seguidoId: jugadorPrincipal.id
          }
        });
        console.log(`✅ @${amigo.alias} ahora sigue a jugador@test.com`);
      }
    }

    console.log('\n✨ ¡Seed completado!\n');
    console.log('📋 Resumen de usuarios creados:');
    console.log('================================');
    console.log('Email                  | Password | Alias');
    console.log('-----------------------------------|--------|----------');
    for (const amigo of amigosCreados) {
      console.log(`${amigo.email.padEnd(22)} | 123456   | @${amigo.alias}`);
    }
    console.log('\n🎮 Todos pueden iniciar sesión con password: 123456');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAmigos();
