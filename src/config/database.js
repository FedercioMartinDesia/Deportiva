import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Manejo de errores de conexión
prisma.$connect()
  .then(() => {
    console.log('✅ Conectado a la base de datos PostgreSQL');
  })
  .catch((error) => {
    console.error('❌ Error al conectar a la base de datos:', error);
    process.exit(1);
  });

// Cerrar conexión cuando la app se cierre
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
