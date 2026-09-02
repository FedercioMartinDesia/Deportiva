import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Token de prueba - necesitaremos uno real del usuario jugador
const TOKEN = 'your_jwt_token_here';

async function testBuscar() {
  try {
    console.log('🔍 Buscando usuarios con alias "maria"...\n');
    
    const response = await axios.get(`${API_URL}/usuarios/buscar?alias=maria`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Resultado de búsqueda:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testBuscar();
