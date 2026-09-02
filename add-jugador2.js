import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔧 Agregando nuevo usuario jugador...');

    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const jugador2 = await prisma.usuario.upsert({
      where: { email: 'jugador2@test.com' },
      update: {},
      create: {
        email: 'jugador2@test.com',
        password: hashedPassword,
        nombre: 'María',
        apellido: 'García',
        alias: 'mariagarcia',
        telefono: '5555555555',
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

    console.log('✅ Usuario Jugador 2 creado exitosamente:');
    console.log('   Email: jugador2@test.com');
    console.log('   Contraseña: 123456');
    console.log('   Nombre: María García');
    console.log('   Alias: mariagarcia');

  } catch (error) {
    console.error('❌ Error al crear el usuario:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
