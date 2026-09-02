import prisma from './src/config/database.js';
import { geocodificarDireccion } from './src/utils/geocoding.js';

async function geocodificarCanchasExistentes() {
  try {
    console.log('🔍 Buscando canchas sin coordenadas...');
    
    const canchasSinCoordenadas = await prisma.cancha.findMany({
      where: {
        OR: [
          { latitud: null },
          { longitud: null }
        ]
      }
    });

    console.log(`📍 ${canchasSinCoordenadas.length} canchas sin coordenadas encontradas`);

    for (const cancha of canchasSinCoordenadas) {
      console.log(`\n🔄 Procesando: ${cancha.nombre}`);
      const geo = await geocodificarDireccion(cancha.direccion, cancha.ciudad, cancha.provincia);
      
      if (geo) {
        await prisma.cancha.update({
          where: { id: cancha.id },
          data: {
            latitud: geo.latitud,
            longitud: geo.longitud
          }
        });
        console.log(`✅ Actualizada con coordenadas: ${geo.latitud}, ${geo.longitud}`);
      } else {
        console.log(`⚠️ No se pudieron obtener coordenadas para ${cancha.nombre}`);
      }
      
      // Pequeña pausa para no sobrecargar el API de Nominatim
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ Geocodificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

geocodificarCanchasExistentes();
