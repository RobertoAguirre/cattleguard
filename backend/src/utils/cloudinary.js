import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configurar Cloudinary
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;

if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
  });
} else {
  console.warn('⚠️  Variables de Cloudinary no configuradas completamente');
}

/**
 * Sube una imagen a Cloudinary
 * @param {Buffer} fileBuffer - Buffer de la imagen
 * @param {string} folder - Carpeta donde guardar (ej: 'scans/thermal')
 * @returns {Promise<string>} URL segura de la imagen
 */
export async function uploadImage(fileBuffer, folder = 'scans') {
  try {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary no está configurado correctamente');
    }

    if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
      throw new Error('fileBuffer debe ser un Buffer válido');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          format: 'jpg',
          quality: 'auto'
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Error al subir imagen: ${error.message}`));
          } else if (!result || !result.secure_url) {
            reject(new Error('No se recibió URL de la imagen'));
          } else {
            resolve(result.secure_url);
          }
        }
      );

      // Convertir buffer a stream
      const readableStream = new Readable();
      readableStream.push(fileBuffer);
      readableStream.push(null);
      readableStream.pipe(uploadStream);
    });
  } catch (error) {
    throw new Error(`Error en uploadImage: ${error.message}`);
  }
}

