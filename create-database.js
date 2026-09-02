import pg from 'pg';
const { Client } = pg;

async function createDatabase() {
  // Primero conectamos a la base de datos 'postgres' por defecto
  const client = new Client({
    user: 'postgres',
    password: 'fede',
    host: 'localhost',
    port: 5433,
    database: 'postgres' // Base de datos por defecto
  });

  try {
    console.log('🔌 Conectando a PostgreSQL...');
    await client.connect();
    console.log('✅ Conectado a PostgreSQL exitosamente\n');

    // Verificar si la base de datos 'appcancha' ya existe
    const result = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = 'appcancha'"
    );

    if (result.rows.length > 0) {
      console.log('✅ La base de datos "appcancha" ya existe');
    } else {
      console.log('📦 Creando base de datos "appcancha"...');
      await client.query('CREATE DATABASE appcancha');
      console.log('✅ Base de datos "appcancha" creada exitosamente');
    }

    console.log('\n🎉 PostgreSQL está listo para usar!');
    console.log('📋 Próximo paso: Ejecutar migraciones de Prisma\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n⚠️  No se pudo conectar a PostgreSQL');
      console.log('   Verifica que el servidor esté corriendo en el puerto 5433');
    } else if (error.code === '28P01') {
      console.log('\n⚠️  Error de autenticación');
      console.log('   Verifica el usuario y contraseña');
    }
  } finally {
    await client.end();
  }
}

createDatabase();
