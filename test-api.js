async function testAPI() {
  try {
    console.log('🔍 Probando el API en http://localhost:5000...\n');
    
    const response = await fetch('http://localhost:5000');
    const data = await response.json();
    
    console.log('✅ API está funcionando correctamente!\n');
    console.log('📋 Respuesta:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error al conectar con el API:', error.message);
    console.log('\n⚠️  El servidor puede no estar iniciado aún');
    console.log('   Ejecuta: npm run dev');
  }
}

testAPI();
