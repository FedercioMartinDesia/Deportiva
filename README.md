# Deportiva Backend

Backend API para el sistema de reservas de canchas deportivas Deportiva.

## 🚀 Tecnologías

- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **PostgreSQL** - Base de datos relacional
- **Prisma** - ORM moderno para Node.js
- **JWT** - Autenticación con tokens
- **Bcrypt** - Hash de contraseñas

## VIDEO DEL PROYECTO

https://drive.google.com/drive/folders/1zAl9LKaveI0qNmPxGHok1nNebdno3tHe?usp=sharing


## 📋 Requisitos Previos

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <url-repositorio>
cd Deportiva
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/appcancha?schema=public"
JWT_SECRET="tu_clave_secreta_muy_segura"
PORT=5000
```

4. **Crear la base de datos en PostgreSQL**
```sql
CREATE DATABASE appcancha;
```

5. **Ejecutar migraciones de Prisma**
```bash
npm run prisma:migrate
```

6. **Generar el cliente de Prisma**
```bash
npm run prisma:generate
```

## 🏃 Ejecutar el Proyecto

### Modo desarrollo (con nodemon)
```bash
npm run dev
```

### Modo producción
```bash
npm start
```

El servidor estará corriendo en `http://localhost:5000`

## 📁 Estructura del Proyecto

```
Deportiva/
├── prisma/
│   └── schema.prisma          # Esquema de base de datos
├── src/
│   ├── config/
│   │   └── database.js        # Configuración de Prisma
│   ├── controllers/           # Lógica de negocio
│   │   ├── auth.controller.js
│   │   ├── cancha.controller.js
│   │   ├── reserva.controller.js
│   │   └── usuario.controller.js
│   ├── middleware/            # Middleware personalizado
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/                # Definición de rutas
│   │   ├── auth.routes.js
│   │   ├── cancha.routes.js
│   │   ├── reserva.routes.js
│   │   └── usuario.routes.js
│   └── server.js              # Punto de entrada
├── .env                       # Variables de entorno
├── .env.example               # Ejemplo de variables
├── .gitignore
├── package.json
└── README.md
```

## 🔐 Autenticación

El API usa JWT (JSON Web Tokens) para autenticación.

### Registro
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "1234567890",
  "rol": "JUGADOR"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "password123"
}
```

Respuesta:
```json
{
  "success": true,
  "data": {
    "usuario": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Usar el token
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

## 📚 Endpoints Principales

### Autenticación (`/api/auth`)
- `POST /register` - Registrar usuario
- `POST /login` - Iniciar sesión
- `GET /profile` - Obtener perfil (requiere auth)
- `PUT /profile` - Actualizar perfil (requiere auth)
- `PUT /change-password` - Cambiar contraseña (requiere auth)

### Canchas (`/api/canchas`)
- `GET /` - Listar canchas (con filtros)
- `GET /:id` - Obtener cancha por ID
- `POST /` - Crear cancha (requiere rol PROPIETARIO)
- `PUT /:id` - Actualizar cancha (requiere rol PROPIETARIO)
- `DELETE /:id` - Eliminar cancha (requiere rol PROPIETARIO)
- `POST /:id/resenas` - Agregar reseña (requiere auth)

### Reservas (`/api/reservas`)
- `POST /` - Crear reserva (requiere auth)
- `GET /mis-reservas` - Mis reservas (requiere auth)
- `GET /:id` - Obtener reserva por ID (requiere auth)
- `PUT /:id/cancelar` - Cancelar reserva (requiere auth)
- `PUT /:id/confirmar-pago` - Confirmar pago (requiere auth)
- `GET /cancha/:canchaId/disponibilidad` - Ver disponibilidad
- `GET /cancha/:canchaId/reservas` - Reservas de cancha (requiere rol PROPIETARIO)

### Usuarios (`/api/usuarios`)
- `GET /` - Listar usuarios (requiere rol ADMIN)
- `GET /:id` - Obtener usuario por ID
- `PUT /:id` - Actualizar usuario
- `DELETE /:id` - Desactivar usuario
- `GET /:id/estadisticas` - Estadísticas del usuario

## 🎭 Roles de Usuario

- **JUGADOR**: Puede reservar canchas, agregar reseñas
- **PROPIETARIO**: Puede gestionar canchas, ver reservas de sus canchas
- **ADMIN**: Acceso total al sistema

## 🗄️ Modelos de Base de Datos

### Usuario
- Email, password, nombre, apellido
- Rol (JUGADOR, PROPIETARIO, ADMIN)
- Teléfono, foto, verificación de email

### Cancha
- Información básica (nombre, descripción, deporte)
- Ubicación (dirección, ciudad, coordenadas)
- Características (capacidad, techada, vestuarios, etc.)
- Precio por hora
- Imágenes

### Reserva
- Usuario, cancha, fecha, horario
- Estado (PENDIENTE, CONFIRMADA, CANCELADA, COMPLETADA)
- Precio total, método de pago
- Notas adicionales

### Reseña
- Usuario, cancha, calificación (1-5)
- Comentario opcional

## 🔍 Filtros y Búsqueda

### Buscar canchas
```http
GET /api/canchas?deporte=FUTBOL_5&ciudad=Buenos+Aires&minPrecio=1000&maxPrecio=3000&techada=true&page=1&limit=10
```

Parámetros disponibles:
- `deporte`: Tipo de deporte
- `ciudad`: Ciudad
- `minPrecio`, `maxPrecio`: Rango de precio
- `techada`: true/false
- `capacidad`: Capacidad mínima
- `page`, `limit`: Paginación

## 🛡️ Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación JWT
- Validación de datos en todas las rutas
- Protección contra inyección SQL (Prisma ORM)
- CORS configurado
- Middleware de manejo de errores

## 🧪 Probar el API

### Usando curl
```bash
# Registro
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","nombre":"Test","apellido":"User"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'
```

### Usando Postman o Thunder Client
Importa la colección de endpoints desde `/docs/api-collection.json` (si existe)

## 📦 Scripts Disponibles

```bash
npm run dev          # Modo desarrollo con nodemon
npm start            # Modo producción
npm run prisma:generate   # Generar cliente Prisma
npm run prisma:migrate    # Ejecutar migraciones
npm run prisma:studio     # Abrir Prisma Studio (GUI)
```

## 🚀 Despliegue

### Variables de entorno en producción
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="clave_super_segura_random"
NODE_ENV=production
PORT=5000
```

### Plataformas recomendadas
- **Backend**: Railway, Render, Heroku, AWS
- **Base de datos**: Railway, Supabase, AWS RDS

## 📱 Integración con App Móvil

Este backend está diseñado para ser consumido por una aplicación móvil React Native.

Base URL: `http://localhost:5000/api` (desarrollo)

Todas las respuestas siguen el formato:
```json
{
  "success": true/false,
  "message": "Mensaje descriptivo",
  "data": { ... }
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT

## 📞 Contacto

Para consultas: info@appcancha.com
