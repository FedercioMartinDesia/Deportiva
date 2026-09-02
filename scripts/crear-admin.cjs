/**
 * Script para crear un usuario administrador
 * Ejecutar con: node scripts/crear-admin.cjs
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function crearAdmin() {
  // ⚠️ CONFIGURA ESTOS DATOS PARA TU ADMIN
  const adminData = {
    email: 'admin@deportiva.app',     // Cambia esto por tu email
    password: 'admin123456',           // Cambia esto por una contraseña segura
    nombre: 'Admin',
    apellido: 'Sistema',
    telefono: '+5491234567890',        // Opcional
  };

  console.log('🔧 Creando usuario administrador...\n');

  try {
    // Verificar si ya existe un admin con ese email
    const existingAdmin = await prisma.usuario.findUnique({
      where: { email: adminData.email }
    });

    if (existingAdmin) {
      if (existingAdmin.rol === 'ADMIN') {
        console.log('⚠️  Ya existe un administrador con ese email.');
        console.log(`   Email: ${existingAdmin.email}`);
        console.log(`   Nombre: ${existingAdmin.nombre} ${existingAdmin.apellido}`);
        return;
      } else {
        // Actualizar usuario existente a ADMIN
        const updated = await prisma.usuario.update({
          where: { email: adminData.email },
          data: { rol: 'ADMIN' }
        });
        console.log('✅ Usuario existente promovido a administrador!');
        console.log(`   Email: ${updated.email}`);
        console.log(`   Nombre: ${updated.nombre} ${updated.apellido}`);
        return;
      }
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Crear el usuario admin
    const admin = await prisma.usuario.create({
      data: {
        email: adminData.email,
        password: hashedPassword,
        nombre: adminData.nombre,
        apellido: adminData.apellido,
        telefono: adminData.telefono,
        rol: 'ADMIN',
        activo: true,
        emailVerificado: true,
      }
    });

    console.log('✅ Usuario administrador creado exitosamente!\n');
    console.log('📧 Email:', admin.email);
    console.log('🔑 Contraseña:', adminData.password);
    console.log('👤 Nombre:', admin.nombre, admin.apellido);
    console.log('\n⚠️  IMPORTANTE: Guarda estas credenciales de forma segura!');
    console.log('   Puedes cambiar la contraseña desde la app si lo deseas.');

  } catch (error) {
    console.error('❌ Error al crear el administrador:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

crearAdmin();
