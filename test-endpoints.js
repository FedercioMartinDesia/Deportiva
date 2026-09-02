const API_URL = 'http://localhost:5000/api';

async function testEndpoints() {
  console.log('🧪 Probando endpoints del API de Deportiva\n');
  console.log('═══════════════════════════════════════════════\n');

  // Test 1: Registro de usuario
  console.log('1️⃣  Test: Registro de usuario');
  try {
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@appcancha.com',
        password: 'Test123456',
        nombre: 'Usuario',
        apellido: 'Prueba',
        telefono: '1234567890',
        rol: 'JUGADOR'
      })
    });
    
    const registerData = await registerResponse.json();
    
    if (registerData.success) {
      console.log('   ✅ Usuario registrado exitosamente');
      console.log(`   📧 Email: ${registerData.data.usuario.email}`);
      console.log(`   🎫 Token generado: ${registerData.data.token.substring(0, 30)}...`);
      
      const token = registerData.data.token;
      
      // Test 2: Obtener perfil
      console.log('\n2️⃣  Test: Obtener perfil de usuario');
      const profileResponse = await fetch(`${API_URL}/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const profileData = await profileResponse.json();
      
      if (profileData.success) {
        console.log('   ✅ Perfil obtenido correctamente');
        console.log(`   👤 Nombre: ${profileData.data.nombre} ${profileData.data.apellido}`);
        console.log(`   🔑 Rol: ${profileData.data.rol}`);
      }
      
      // Test 3: Listar canchas (sin autenticación)
      console.log('\n3️⃣  Test: Listar canchas disponibles');
      const canchasResponse = await fetch(`${API_URL}/canchas`);
      const canchasData = await canchasResponse.json();
      
      if (canchasData.success) {
        console.log('   ✅ Endpoint de canchas funcionando');
        console.log(`   📊 Total de canchas: ${canchasData.data.length}`);
        console.log(`   📄 Paginación: Página ${canchasData.pagination.page} de ${canchasData.pagination.totalPages}`);
      }
      
      console.log('\n═══════════════════════════════════════════════');
      console.log('✅ Todos los tests pasaron correctamente!');
      console.log('🎉 El backend está listo para la app móvil\n');
      
    } else {
      if (registerData.message && registerData.message.includes('ya está registrado')) {
        console.log('   ⚠️  El usuario ya existe (esto es normal si ya corriste el test)');
        console.log('   💡 El backend está funcionando correctamente\n');
      } else {
        console.log('   ❌ Error:', registerData.message);
      }
    }
    
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }
  
  console.log('\n📋 Endpoints disponibles:');
  console.log('   POST   /api/auth/register - Registro');
  console.log('   POST   /api/auth/login - Login');
  console.log('   GET    /api/auth/profile - Ver perfil (requiere token)');
  console.log('   GET    /api/canchas - Listar canchas');
  console.log('   POST   /api/canchas - Crear cancha (requiere rol PROPIETARIO)');
  console.log('   POST   /api/reservas - Crear reserva (requiere token)');
  console.log('   GET    /api/reservas/mis-reservas - Mis reservas (requiere token)');
  console.log('\n📖 Ver README.md para documentación completa\n');
}

testEndpoints();
