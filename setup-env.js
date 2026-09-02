import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔧 Configurando archivo .env...\n');

// Leer el archivo .env.example
const envExample = fs.readFileSync(path.join(__dirname, '.env.example'), 'utf-8');

// Preguntar por configuración
console.log('Por favor, proporciona la siguiente información:\n');

// Generar JWT secret aleatorio
const jwtSecret = Array.from({ length: 32 }, () => 
  Math.random().toString(36).charAt(2)
).join('');

console.log('✅ JWT_SECRET generado automáticamente');

// Crear contenido del .env
const envContent = `# Database
DATABASE_URL="postgresql://postgres:TU_PASSWORD_AQUI@localhost:5432/appcancha?schema=public"

# JWT
JWT_SECRET="${jwtSecret}"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (para CORS)
FRONTEND_URL="http://localhost:3000"

# Mercado Pago (opcional - agregar después)
MERCADOPAGO_ACCESS_TOKEN=""
`;

// Escribir archivo .env
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('⚠️  El archivo .env ya existe');
  console.log('   Para evitar sobrescribir, guarda este contenido manualmente:\n');
  console.log('═══════════════════════════════════════════════');
  console.log(envContent);
  console.log('═══════════════════════════════════════════════\n');
} else {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env creado exitosamente\n');
  console.log('📝 IMPORTANTE: Edita el archivo .env y cambia:');
  console.log('   - TU_PASSWORD_AQUI por tu contraseña de PostgreSQL\n');
  console.log('📁 Ubicación: c:\\Users\\PC\\Documents\\Deportiva\\.env\n');
}

console.log('Contenido del .env:');
console.log('═══════════════════════════════════════════════');
console.log(envContent);
console.log('═══════════════════════════════════════════════\n');
