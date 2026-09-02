# Configuración de Google OAuth para Deportiva

## Paso 1: Crear proyecto en Google Cloud Console

1. Ve a: https://console.cloud.google.com/
2. Crea un nuevo proyecto llamado "Deportiva"
3. Habilita la API de Google+: https://console.cloud.google.com/apis/library/plus.googleapis.com

## Paso 2: Crear credenciales OAuth 2.0

1. Ve a: https://console.cloud.google.com/apis/credentials
2. Click en "Crear credenciales" → "ID de cliente de OAuth 2.0"

### Para Android:
- Tipo de aplicación: **Android**
- Nombre: Deportiva Android
- Nombre del paquete: `com.appcancha.mobile`
- Huella digital del certificado SHA-1: 
  - Para desarrollo, ejecuta: `keytool -keystore ~/.android/debug.keystore -list -v -alias androiddebugkey`
  - Password por defecto: `android`
  - Copia el SHA-1 que aparece

### Para iOS (si lo necesitas):
- Tipo de aplicación: **iOS**
- Nombre: Deportiva iOS
- ID del paquete: `com.appcancha.mobile`

### Para Web (IMPORTANTE - necesario para Expo):
- Tipo de aplicación: **Aplicación web**
- Nombre: Deportiva Web
- URI de redirección autorizados:
  - `https://auth.expo.io/@tu-usuario-expo/appcancha-mobile`

## Paso 3: Obtener los Client IDs

Después de crear las credenciales, copia:
- **Android Client ID**: algo como `123456-abcdef.apps.googleusercontent.com`
- **iOS Client ID**: algo como `123456-ghijkl.apps.googleusercontent.com`
- **Web Client ID**: algo como `123456-mnopqr.apps.googleusercontent.com`

## Paso 4: Actualizar el código

Reemplaza en `src/screens/LoginScreen.js` (líneas 28-32):
```javascript
const [request, response, promptAsync] = Google.useAuthRequest({
  androidClientId: 'TU_ANDROID_CLIENT_ID_AQUI.apps.googleusercontent.com',
  iosClientId: 'TU_IOS_CLIENT_ID_AQUI.apps.googleusercontent.com',
  webClientId: 'TU_WEB_CLIENT_ID_AQUI.apps.googleusercontent.com',
});
```

## Paso 5: Rebuild de la app

Después de configurar las credenciales, ejecuta:
```bash
npx expo prebuild --clean
npx expo run:android
```

## Notas:
- La huella SHA-1 debe coincidir con tu certificado de firma
- Para producción, necesitarás el SHA-1 del keystore de release
- El Web Client ID es el más importante para que funcione con Expo Go
