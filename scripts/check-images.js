// Script para verificar las imágenes de las canchas
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkImages() {
  try {
    const canchas = await prisma.cancha.findMany({
      select: {
        id: true,
        nombre: true,
        imagenes: true,
        imagenPrincipal: true
      }
    });

    console.log('\n📷 Estado de imágenes de canchas:\n');
    
    for (const cancha of canchas) {
      console.log(`🏟️  ${cancha.nombre}`);
      console.log(`   ID: ${cancha.id}`);
      
      if (cancha.imagenes && cancha.imagenes.length > 0) {
        console.log(`   Imágenes (${cancha.imagenes.length}):`);
        cancha.imagenes.forEach((img, i) => {
          const tipo = img.startsWith('http') ? '✅ URL válida' : '❌ Ruta local';
          console.log(`     ${i + 1}. ${tipo}: ${img.substring(0, 80)}...`);
        });
      } else {
        console.log('   Imágenes: ninguna');
      }
      
      if (cancha.imagenPrincipal) {
        const tipo = cancha.imagenPrincipal.startsWith('http') ? '✅ URL válida' : '❌ Ruta local';
        console.log(`   Imagen Principal: ${tipo}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImages();
