import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import canchaRoutes from './routes/cancha.routes.js';
import reservaRoutes from './routes/reserva.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import comentarioRoutes from './routes/comentario.routes.js';
import notificacionRoutes from './routes/notificacion.routes.js';
import invitacionRoutes from './routes/invitacion.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import adminRoutes from './routes/admin.routes.js';
import sancionRoutes from './routes/sancion.routes.js';
import propietarioRoutes from './routes/propietario.routes.js';
import profesorRoutes from './routes/profesor.routes.js';
import claseRoutes from './routes/clase.routes.js';
import sesionRoutes from './routes/sesion.routes.js';
import reservaClaseRoutes from './routes/reservaClase.routes.js';
import { mercadopagoWebhook } from './controllers/reserva.controller.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Carpeta de archivos estáticos (imágenes)
app.use('/uploads', express.static('uploads'));

// Rutas
app.get('/', (req, res) => {
  res.json({
    message: 'Deportiva API - Sistema de Reservas de Actividades Deportivas',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      espacios: '/api/espacios',
      reservas: '/api/reservas',
      usuarios: '/api/usuarios',
      comentarios: '/api/comentarios',
      admin: '/api/admin',
      profesores: '/api/profesores',
      clases: '/api/clases',
      sesiones: '/api/sesiones',
      reservasClase: '/api/reservas-clase'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/espacios', canchaRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/comentarios', comentarioRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/invitaciones', invitacionRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sanciones', sancionRoutes);
app.use('/api/propietario', propietarioRoutes);
app.use('/api/profesores', profesorRoutes);
app.use('/api/clases', claseRoutes);
app.use('/api/sesiones', sesionRoutes);
app.use('/api/reservas-clase', reservaClaseRoutes);

// Webhook de Mercado Pago (no requiere autenticación)
app.post('/api/mercadopago/webhook', mercadopagoWebhook);

// Middleware de manejo de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📱 Listo para recibir peticiones de la app móvil`);
});

export default app;
