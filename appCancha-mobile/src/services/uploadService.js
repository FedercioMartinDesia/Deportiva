import api from './api';

/**
 * Convierte una URI local a base64 usando fetch
 */
const uriToBase64 = async (uri) => {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Extraer solo la parte base64 (sin el prefijo data:image/...)
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error convirtiendo a base64:', error);
    throw error;
  }
};

/**
 * Sube una imagen al servidor (Cloudinary)
 * @param {string} imageUri - URI local de la imagen
 * @param {string} folder - Carpeta donde guardar (canchas, usuarios, etc)
 * @returns {Promise<string>} - URL de la imagen subida
 */
export const uploadImage = async (imageUri, folder = 'general') => {
  try {
    // Si ya es una URL http, no hace falta subirla
    if (imageUri.startsWith('http')) {
      return imageUri;
    }

    const base64 = await uriToBase64(imageUri);
    const response = await api.post('/upload/image', {
      image: base64,
      folder
    });

    if (response.data.success) {
      return response.data.data.url;
    }
    throw new Error('Error al subir imagen');
  } catch (error) {
    console.error('Error en uploadImage:', error);
    throw error;
  }
};

/**
 * Sube múltiples imágenes al servidor
 * @param {string[]} imageUris - Array de URIs locales
 * @param {string} folder - Carpeta donde guardar
 * @returns {Promise<string[]>} - Array de URLs
 */
export const uploadMultipleImages = async (imageUris, folder = 'general') => {
  try {
    if (!imageUris || imageUris.length === 0) {
      return [];
    }
    
    // Filtrar las que ya son URLs
    const localUris = imageUris.filter(uri => uri && !uri.startsWith('http'));
    const httpUrls = imageUris.filter(uri => uri && uri.startsWith('http'));

    console.log('📷 Imágenes locales a subir:', localUris.length);
    console.log('🌐 URLs existentes:', httpUrls.length);

    if (localUris.length === 0) {
      return httpUrls;
    }

    // Convertir todas a base64
    console.log('🔄 Convirtiendo a base64...');
    const base64Images = await Promise.all(
      localUris.map(uri => uriToBase64(uri))
    );

    console.log('📤 Enviando al servidor...');
    const response = await api.post('/upload/images', {
      images: base64Images,
      folder
    }, {
      timeout: 30000 // 30 segundos para imágenes
    });

    if (response.data.success) {
      console.log('✅ Subida exitosa:', response.data.data.urls);
      return [...httpUrls, ...response.data.data.urls];
    }
    throw new Error('Error al subir imágenes');
  } catch (error) {
    console.error('❌ Error en uploadMultipleImages:', error.response?.data || error.message);
    if (error.code === 'ECONNABORTED') {
      throw new Error('Timeout: La imagen es muy grande o la conexión es lenta');
    }
    if (error.message === 'Network Error') {
      throw new Error('No se puede conectar al servidor. Verifica que el backend esté corriendo.');
    }
    throw error;
  }
};

export default {
  uploadImage,
  uploadMultipleImages
};
