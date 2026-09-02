import pg from 'pg';
const { Client } = pg;

async function testConnection(user, password, port) {
  const client = new Client({
    user,
    password,
    host: 'localhost',
    port,
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log(`✅ Conexión exitosa con usuario: ${user}, puerto: ${port}`);
    
    const result = await client.query('SELECT version()');
    console.log(`   PostgreSQL versión: ${result.rows[0].version.split(',')[0]}\n`);
    
    await client.end();
    return true;
  } catch (error) {
    console.log(`❌ Error con usuario: ${user}, puerto: ${port}`);
    console.log(`   Código: ${error.code}, Mensaje: ${error.message}\n`);
    return false;
  }
}

console.log('🔍 Probando diferentes configuraciones...\n');

// Probar diferentes combinaciones
const configs = [
  { user: 'fede', password: 'fede', port: 5433 },
  { user: 'postgres', password: 'fede', port: 5433 },
  { user: 'fede', password: '', port: 5433 },
  { user: 'postgres', password: 'postgres', port: 5433 },
  { user: 'postgres', password: '', port: 5433 },
  { user: 'fede', password: 'fede', port: 5432 },
  { user: 'postgres', password: 'fede', port: 5432 },
];

async function runTests() {
  let success = false;
  
  for (const config of configs) {
    const result = await testConnection(config.user, config.password, config.port);
    if (result && !success) {
      success = true;
      console.log('════════════════════════════════════════════════');
      console.log('✅ CONFIGURACIÓN CORRECTA ENCONTRADA:');
      console.log(`   Usuario: ${config.user}`);
      console.log(`   Contraseña: ${config.password || '(vacía)'}`);
      console.log(`   Puerto: ${config.port}`);
      console.log('════════════════════════════════════════════════\n');
      
      console.log('📝 Actualiza tu .env con:');
      console.log(`DATABASE_URL="postgresql://${config.user}:${config.password}@localhost:${config.port}/appcancha?schema=public"\n`);
    }
  }
  
  if (!success) {
    console.log('❌ No se pudo conectar con ninguna configuración');
    console.log('\n💡 Sugerencias:');
    console.log('   1. Verifica que PostgreSQL esté corriendo');
    console.log('   2. Abre pgAdmin y revisa el usuario y contraseña');
    console.log('   3. Verifica el puerto en las propiedades del servidor');
  }
}

runTests();
