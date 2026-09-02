# Deportiva Mobile

Aplicación móvil React Native para el sistema de reservas de canchas deportivas Deportiva.

## 📱 Características

- ✅ **Multiplataforma** - Android e iOS
- 🎨 **UI Moderna** - Diseño atractivo con gradientes y animaciones
- 🔐 **Autenticación** - Login y registro con JWT
- 🏟️ **Búsqueda de Canchas** - Filtros por deporte, ubicación y precio
- 📅 **Sistema de Reservas** - Reserva canchas por hora
- 👤 **Perfiles de Usuario** - Gestión de cuenta y preferencias
- ⭐ **Reseñas** - Calificaciones y comentarios de canchas

## 🚀 Tecnologías

- **React Native** con Expo
- **React Navigation** - Navegación nativa
- **Axios** - Consumo de API REST
- **AsyncStorage** - Almacenamiento local
- **Expo Linear Gradient** - Gradientes nativos
- **React Context API** - Gestión de estado global

## 📋 Requisitos

- Node.js >= 18.x
- npm o yarn
- Expo CLI
- Backend de Deportiva corriendo en `http://localhost:5000`

## 🛠️ Instalación

1. **Instalar dependencias**
```bash
cd appCancha-mobile
npm install
```

2. **Configurar la URL del backend**
Editar `src/constants/index.js`:
```javascript
export const API_URL = 'http://TU_IP:5000/api'; // Cambiar localhost por tu IP local
```

## 🏃 Ejecutar el Proyecto

### En Android
```bash
npm run android
```

### En iOS (requiere macOS)
```bash
npm run ios
```

### En la Web (para desarrollo)
```bash
npm run web
```

### Usando Expo Go
```bash
npm start
```
Luego escanea el código QR con la app Expo Go en tu teléfono.

## 📁 Estructura del Proyecto

```
appCancha-mobile/
├── src/
│   ├── components/         # Componentes reutilizables
│   ├── constants/          # Constantes y configuración
│   │   ├── colors.js      # Paleta de colores
│   │   └── index.js       # Exportaciones generales
│   ├── contexts/          # Context API
│   │   └── AuthContext.js # Contexto de autenticación
│   ├── navigation/        # Navegación
│   │   └── AppNavigator.js
│   ├── screens/           # Pantallas
│   │   ├── HomeScreen.js
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── CanchasListScreen.js
│   │   └── ProfileScreen.js
│   ├── services/          # Servicios API
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── canchaService.js
│   │   └── reservaService.js
│   └── utils/             # Utilidades
├── assets/                # Imágenes y recursos
├── App.js                 # Punto de entrada
└── package.json
```

## 🎨 Pantallas Principales

### 1. **Login/Registro**
- Autenticación con email y contraseña
- Opción para crear cuenta nueva
- Selección de rol (Jugador/Propietario)

### 2. **Home**
- Búsqueda de canchas
- Filtros por deporte
- Canchas destacadas
- Acceso rápido a funciones

### 3. **Explorar Canchas**
- Listado completo de canchas
- Búsqueda por nombre o ciudad
- Vista de tarjetas con información clave

### 4. **Detalle de Cancha**
- Galería de imágenes
- Información completa
- Horarios disponibles
- Reseñas y calificaciones
- Botón de reserva

### 5. **Perfil**
- Información del usuario
- Mis reservas
- Configuración
- Cerrar sesión

## 🔧 Configuración Adicional

### Conectar con Backend Local

Si estás usando un dispositivo físico, asegúrate de:

1. Tu computadora y dispositivo estén en la misma red WiFi
2. Cambiar `localhost` por la IP local de tu computadora en `src/constants/index.js`
3. El backend esté corriendo y accesible

**Encontrar tu IP:**
- Windows: `ipconfig`
- Mac/Linux: `ifconfig`

Ejemplo:
```javascript
export const API_URL = 'http://192.168.1.100:5000/api';
```

## 📦 Scripts Disponibles

```bash
npm start           # Inicia Expo Dev Server
npm run android     # Corre en Android
npm run ios         # Corre en iOS
npm run web         # Corre en navegador
```

## 🎯 Próximas Funcionalidades

- [ ] Pantalla de detalle de cancha con galería
- [ ] Sistema de reservas con calendario interactivo
- [ ] Notificaciones push
- [ ] Mapa de canchas cercanas
- [ ] Chat con propietarios
- [ ] Sistema de pagos integrado
- [ ] Modo oscuro
- [ ] Compartir canchas

## 🐛 Troubleshooting

### Error de conexión con el backend
- Verifica que el backend esté corriendo
- Verifica la URL del API en `src/constants/index.js`
- Si usas dispositivo físico, usa la IP local en lugar de localhost

### Problemas con dependencias
```bash
rm -rf node_modules
npm install
```

### Cache de Expo
```bash
npx expo start -c
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## 📄 Licencia

MIT

## 📞 Soporte

Para consultas: info@appcancha.com
