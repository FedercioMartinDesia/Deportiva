# 🚀 Cómo Iniciar Deportiva

## ⚡ Método Automático (RECOMENDADO)

### Para Iniciar Todo:
1. Ve a la carpeta `c:\Users\PC\Documents\backCancha`
2. **Doble click** en `iniciar-todo.bat`
3. Espera 10 segundos
4. Escanea el QR que aparecerá en la terminal "Frontend"

### Para Detener Todo:
1. **Doble click** en `detener-todo.bat`
2. Listo!

---

## 📝 Método Manual

### Terminal 1 - Backend:
```bash
cd c:\Users\PC\Documents\backCancha
npm run dev
```
**Espera a ver:** ✅ Conectado a la base de datos PostgreSQL

### Terminal 2 - App Móvil:
```bash
cd c:\Users\PC\Documents\backCancha\appCancha-mobile
npm start
```
**Espera a ver:** QR Code

### En tu teléfono:
1. Abre Expo Go
2. Escanea el QR
3. ¡Listo!

---

## 🔥 Hot Reload

Una vez que escanees el QR **UNA SOLA VEZ**:
- Editas código en Windsurf
- Guardas (Ctrl+S)
- ¡La app se actualiza automáticamente! ⚡

**No necesitas volver a escanear el QR**

---

## 🐛 Solución de Problemas

### Si dice "Puerto en uso":
```bash
detener-todo.bat
iniciar-todo.bat
```

### Si la app no carga:
1. Verifica que ambas terminales estén abiertas
2. Verifica que estés en la misma red WiFi
3. En el teléfono: Sacude → Reload

### Si hay error de conexión (pantalla azul / no inicia sesión):
- **Causa común:** Cambiaste de red WiFi y la IP cambió
- **Solución:** El script `iniciar-todo.bat` ahora detecta tu IP automáticamente
- Verifica que el backend muestre: ✅ Conectado a PostgreSQL
- Verifica que tu teléfono esté en la **misma red WiFi** que tu PC

### Si cambiaste de WiFi:
1. Simplemente ejecuta `iniciar-todo.bat` de nuevo
2. La IP se actualiza automáticamente
3. Escanea el nuevo QR

---

## 📱 Workflow Diario

**Al Empezar:**
1. Doble click en `iniciar-todo.bat`
2. Escanea QR una vez
3. ¡A programar!

**Durante el día:**
- Solo edita y guarda
- Hot reload automático

**Al Terminar:**
- Doble click en `detener-todo.bat`

¡Eso es todo! 🎉
