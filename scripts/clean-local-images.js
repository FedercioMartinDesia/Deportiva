// Script para limpiar las rutas locales de imágenes (file:///)
// y dejar solo URLs válidas (http/https)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanLocalImages() {
  try {
    const canchas = await prisma.cancha.findMany({
      select: {
        id: true,
        nombre: true,
        imagenes: true,
        imagenPrincipal: true
      }
    });

    console.log('\n🧹 Limpiando rutas locales de imágenes...\n');
    
    let actualizadas = 0;
    
    for (const cancha of canchas) {
      let needsUpdate = false;
      let newImagenes = [];
      let newImagenPrincipal = cancha.imagenPrincipal;
      
      // Filtrar imágenes - solo mantener URLs http
      if (cancha.imagenes && cancha.imagenes.length > 0) {
        newImagenes = cancha.imagenes.filter(img => img.startsWith('http'));
        if (newImagenes.length !== cancha.imagenes.length) {
          needsUpdate = true;
          console.log(`🏟️  ${cancha.nombre}`);
          console.log(`   Imágenes: ${cancha.imagenes.length} → ${newImagenes.length}`);
        }
      }
      
      // Limpiar imagenPrincipal si es ruta local
      if (cancha.imagenPrincipal && !cancha.imagenPrincipal.startsWith('http')) {
        newImagenPrincipal = null;
        needsUpdate = true;
        console.log(`   Imagen Principal: limpiada (era ruta local)`);
      }
      
      if (needsUpdate) {
        await prisma.cancha.update({
          where: { id: cancha.id },
          data: {
            imagenes: newImagenes,
            imagenPrincipal: newImagenPrincipal
          }
        });
        actualizadas++;
      }
    }

    console.log(`\n✅ Listo! ${actualizadas} canchas actualizadas.`);
    console.log('\n📱 Ahora debes volver a subir las fotos desde la app.');
    console.log('   Las nuevas fotos se guardarán en Cloudinary automáticamente.\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanLocalImages();
