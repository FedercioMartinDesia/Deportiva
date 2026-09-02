import { Router } from 'express';
import { uploadImage, uploadMultipleImages } from '../services/uploadService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Subir una imagen (requiere autenticación)
router.post('/image', authenticate, async (req, res, next) => {
  try {
    const { image, folder } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }

    const result = await uploadImage(image, folder || 'general');
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Subir imagen de perfil durante el registro (público, solo para usuarios)
router.post('/profile-image', async (req, res, next) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ninguna imagen'
      });
    }

    // Solo permitir subir a la carpeta de usuarios
    const result = await uploadImage(image, 'usuarios');
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Subir múltiples imágenes
router.post('/images', authenticate, async (req, res, next) => {
  try {
    const { images, folder } = req.body;
    
    console.log('📷 Recibiendo imágenes:', images?.length || 0);
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron imágenes'
      });
    }

    console.log('📤 Subiendo a Cloudinary...');
    const urls = await uploadMultipleImages(images, folder || 'general');
    console.log('✅ URLs generadas:', urls);
    
    res.json({
      success: true,
      data: { urls }
    });
  } catch (error) {
    console.error('❌ Error en upload:', error);
    next(error);
  }
});

export default router;
