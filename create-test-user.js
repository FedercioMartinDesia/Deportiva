import bcrypt from 'bcrypt';
import prisma from './src/config/database.js';

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('test123', 10);
    
    const user = await prisma.usuario.create({
      data: {
        nombre: 'Usuario',
        apellido: 'Test',
        email: 'test@test.com',
        telefono: '+5491112345678',
        password: hashedPassword,
        rol: 'JUGADOR'
      }
    });

    console.log('✅ Usuario de prueba creado exitosamente:');
    console.log('📧 Email: test@test.com');
    console.log('🔑 Password: test123');
    console.log('📱 Teléfono: +5491112345678');
    console.log('👤 Rol: JUGADOR');
    console.log(`🆔 ID: ${user.id}`);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error al crear usuario:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createTestUser();
