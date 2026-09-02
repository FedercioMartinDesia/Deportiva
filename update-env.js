import fs from 'fs';

const envContent = `# Database
DATABASE_URL="postgresql://postgres:fede@localhost:5433/appcancha?schema=public"

# JWT
JWT_SECRET="38juhahxav3rngvgiox5o09mrunxig26"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (para CORS)
FRONTEND_URL="http://localhost:3000"

# Mercado Pago (opcional - agregar después)
MERCADOPAGO_ACCESS_TOKEN=""
`;

fs.writeFileSync('.env', envContent);
console.log('✅ Archivo .env actualizado con tus credenciales de PostgreSQL\n');
console.log('📝 Configuración:');
console.log('   - Usuario: fede');
console.log('   - Puerto: 5433');
console.log('   - Base de datos: appcancha\n');
