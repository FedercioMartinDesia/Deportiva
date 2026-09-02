import cloudinary from '../config/cloudinary.js';

/**
 * Sube una imagen a Cloudinary desde base64
 * @param {string} base64Image - Imagen en formato base64 (con o sin prefijo data:image)
 * @param {string} folder - Carpeta en Cloudinary donde guardar
 * @returns {Promise<{url: string, publicId: string}>}
 */
export const uploadImage = async (base64Image, folder = 'espacios') => {
  try {
    // Asegurar que tenga el prefijo correcto
    let imageData = base64Image;
    if (!base64Image.startsWith('data:')) {
      imageData = `data:image/jpeg;base64,${base64Image}`;
    }

    const result = await cloudinary.uploader.upload(imageData, {
      folder: `deportiva/${folder}`,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' }, // Limitar tamaño máximo
        { quality: 'auto' }, // Optimizar calidad automáticamente
        { fetch_format: 'auto' } // Formato óptimo (webp si el navegador lo soporta)
      ]
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  } catch (error) {
    console.error('Error subiendo imagen a Cloudinary:', error);
    throw new Error('Error al subir la imagen');
  }
};

/**
 * Sube múltiples imágenes a Cloudinary
 * @param {string[]} base64Images - Array de imágenes en base64
 * @param {string} folder - Carpeta en Cloudinary
 * @returns {Promise<string[]>} - Array de URLs
 */
export const uploadMultipleImages = async (base64Images, folder = 'espacios') => {
  const uploadPromises = base64Images.map(img => uploadImage(img, folder));
  const results = await Promise.all(uploadPromises);
  return results.map(r => r.url);
};

/**
 * Elimina una imagen de Cloudinary
 * @param {string} publicId - ID público de la imagen
 */
export const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error);
  }
};

export default {
  uploadImage,
  uploadMultipleImages,
  deleteImage
};
