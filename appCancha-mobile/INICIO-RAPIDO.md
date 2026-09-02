# 🚀 Inicio Rápido - Deportiva Mobile

## ✅ Checklist Pre-inicio

Antes de correr la app, verifica:

1. ✅ Backend corriendo en `http://localhost:5000`
2. ✅ Base de datos PostgreSQL activa
3. ✅ Dependencias instaladas (`npm install`)

## 🏃 Ejecutar la App

### Opción 1: En tu teléfono con Expo Go (Recomendado para desarrollo)

1. **Instala Expo Go en tu teléfono:**
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)

2. **Inicia el servidor de desarrollo:**
   ```bash
   cd appCancha-mobile
   npm start
   ```

3. **Escanea el código QR:**
   - Android: Usa la app Expo Go
   - iOS: Usa la cámara del iPhone

4. **⚠️ IMPORTANTE - Configurar URL del Backend:**
   
   Si vas a usar tu teléfono, debes cambiar la URL del API:
   
   a. Encuentra tu IP local:
   ```bash
   # Windows
   ipconfig
   # Busca "IPv4 Address" en tu conexión WiFi
   
   # Mac/Linux
   ifconfig
   # Busca "inet" en tu conexión WiFi
   ```
   
   b. Edita `src/constants/index.js`:
   ```javascript
   // Cambiar esto:
   export const API_URL = 'http://localhost:5000/api';
   
   // Por esto (usa tu IP):
   export const API_URL = 'http://192.168.1.100:5000/api';
   ```
   
   c. Asegúrate de que tu teléfono y computadora estén en la misma red WiFi

### Opción 2: En Android Studio Emulator

```bash
npm run android
```

### Opción 3: En iOS Simulator (solo macOS)

```bash
npm run ios
```

### Opción 4: En el navegador (para pruebas rápidas)

```bash
npm run web
```

## 🎯 Usuarios de Prueba

Para probar la app, puedes crear un usuario nuevo o usar estos datos si ya tienes usuarios en el backend:

### Crear un usuario nuevo:
1. Abre la app
2. Click en "Regístrate"
3. Completa el formulario
4. Elige tipo de cuenta (Jugador o Propietario)

### Usuario de ejemplo (si existe en tu DB):
```
Email: jugador@test.com
Password: 123456
Rol: JUGADOR
```

```
Email: propietario@test.com
Password: 123456
Rol: PROPIETARIO
```

## 📱 Navegación de la App

### Pantallas Principales:

1. **Login/Registro** - Primera pantalla si no estás autenticado
2. **Home** - Pantalla principal con búsqueda y canchas destacadas
3. **Explorar** - Listado completo de canchas con búsqueda
4. **Reservas** - Tus reservas (próximamente)
5. **Perfil** - Tu cuenta y configuración

## 🐛 Problemas Comunes

### "Network request failed"
- ✅ Verifica que el backend esté corriendo
- ✅ Verifica la URL en `src/constants/index.js`
- ✅ Si usas teléfono físico, usa tu IP local (no localhost)
- ✅ Desactiva VPN si tienes una activa

### "Unable to resolve module"
```bash
npm install
npx expo start -c
```

### La app se cierra al abrir
- Revisa los logs en la terminal
- Verifica que todas las dependencias estén instaladas

### Cambios no se reflejan
```bash
# Limpia el cache
npx expo start -c
```

## 🎨 Paleta de Colores

La app usa estos colores principales:
- **Primary (Verde)**: #00A86B
- **Secondary (Naranja)**: #FF6B35
- **Background**: #F5F5F5
- **Dark**: #1A1A1A

## 🔧 Comandos Útiles

```bash
# Iniciar servidor de desarrollo
npm start

# Limpiar cache
npx expo start -c

# Ver logs detallados
npx expo start --dev-client

# Instalar una nueva dependencia
npx expo install nombre-del-paquete
```

## 📞 Soporte

Si tienes problemas:
1. Revisa la terminal donde corre `npm start`
2. Revisa los logs en Expo Go
3. Verifica que el backend esté funcionando correctamente

---

## ✨ Próximos Pasos

Una vez que la app esté corriendo:

1. 📝 Crea una cuenta de prueba
2. 🏟️ Explora las canchas disponibles
3. 👤 Revisa tu perfil
4. 🎯 Prueba los filtros de búsqueda

---

**¡Listo para jugar! ⚽**
