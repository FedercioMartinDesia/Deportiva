import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '✅ Deportiva Backend API está funcionando correctamente',
    version: '1.0.0',
    status: 'Servidor listo para recibir peticiones',
    note: 'Para usar todas las funcionalidades, configura PostgreSQL y ejecuta las migraciones',
    endpoints: {
      auth: '/api/auth',
      canchas: '/api/canchas',
      reservas: '/api/reservas',
      usuarios: '/api/usuarios'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.listen(PORT, () => {
  console.log('\n🚀 ========================================');
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log('📱 Listo para aplicación móvil Android/iOS');
  console.log('========================================\n');
  console.log('📋 Próximos pasos:');
  console.log('   1. Instalar y configurar PostgreSQL');
  console.log('   2. Crear archivo .env con credenciales');
  console.log('   3. Ejecutar: npm run prisma:migrate');
  console.log('   4. Iniciar con: npm run dev\n');
});

export default app;
