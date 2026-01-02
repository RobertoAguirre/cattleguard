import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import Scan from '../models/Scan.js';
import { protect } from '../middleware/auth.js';
import { uploadImage } from '../utils/cloudinary.js';
import { analyzeWithBothModels } from '../utils/roboflow.js';
import { sendAlert } from '../utils/whatsapp.js';

const router = express.Router();

// Configurar Multer para subir archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Solo aceptar imágenes
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

/**
 * POST /api/scans
 * Crea un nuevo escaneo (protegido, multipart)
 */
router.post('/', protect, upload.fields([
  { name: 'thermal', maxCount: 1 },
  { name: 'rgb', maxCount: 1 }
]), async (req, res) => {
  try {
    // Validar archivos
    if (!req.files || !req.files.thermal || !req.files.rgb) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren ambas imágenes: thermal y rgb'
      });
    }

    const thermalFile = req.files.thermal[0];
    const rgbFile = req.files.rgb[0];

    // Subir imágenes a Cloudinary
    const [thermalUrl, rgbUrl] = await Promise.all([
      uploadImage(thermalFile.buffer, 'scans/thermal'),
      uploadImage(rgbFile.buffer, 'scans/rgb')
    ]);

    // Analizar imagen RGB con ambos modelos de Roboflow
    let aiResults = {
      model1: {
        detections: [],
        confidence: 0,
        classes: []
      },
      model2: {
        detections: [],
        confidence: 0,
        classes: []
      },
      combined: {
        detections: [],
        classification: 'healthy',
        confidence: 0,
        diseases: []
      }
    };

    try {
      // Analizar con ambos modelos (cattle-diseases y cow-diseases)
      const analysis = await analyzeWithBothModels(rgbUrl);
      aiResults = analysis;
    } catch (error) {
      console.error('Error en análisis de IA:', error.message);
      // Continuar aunque falle el análisis
    }

    // Obtener metadata opcional
    const { lat, lng, source } = req.body;

    // Validar y parsear coordenadas
    let location = undefined;
    if (lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        location = { lat: parsedLat, lng: parsedLng };
      }
    }

    // Crear scan
    const scan = await Scan.create({
      user: req.user._id,
      images: {
        thermal: thermalUrl,
        rgb: rgbUrl
      },
      metadata: {
        source: source || 'flir_one_pro',
        location: location,
        timestamp: new Date()
      },
      aiResults,
      status: 'completed'
    });

    // Enviar alerta si es suspicious o critical
    if (aiResults.combined.classification === 'suspicious' || aiResults.combined.classification === 'critical') {
      try {
        const severity = aiResults.combined.classification === 'critical' ? 'high' : 'medium';
        
        // Construir mensaje con enfermedades detectadas
        const diseasesText = aiResults.combined.diseases.length > 0
          ? aiResults.combined.diseases
              .map(d => `  • ${d.name} (${(d.confidence * 100).toFixed(1)}%)`)
              .join('\n')
          : 'No se detectaron enfermedades específicas';
        
        const message = `🚨 Alerta de Ganado\n\n` +
          `Clasificación: ${aiResults.combined.classification}\n` +
          `Confianza: ${(aiResults.combined.confidence * 100).toFixed(1)}%\n` +
          `Detecciones: ${aiResults.combined.detections.length}\n\n` +
          `Enfermedades detectadas:\n${diseasesText}\n\n` +
          `Fecha: ${new Date().toLocaleString('es-ES')}`;

        await sendAlert(req.user.phone, message);

        // Actualizar scan con info de alerta
        scan.alert = {
          sent: true,
          severity
        };
        await scan.save();
      } catch (error) {
        console.error('Error al enviar alerta WhatsApp:', error.message);
        // No fallar el request si falla el WhatsApp
      }
    }

    res.status(201).json({
      success: true,
      scan
    });
  } catch (error) {
    console.error('Error al crear scan:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear escaneo',
      error: error.message
    });
  }
});

/**
 * GET /api/scans
 * Obtiene todos los escaneos del usuario (protegido)
 */
router.get('/', protect, async (req, res) => {
  try {
    const scans = await Scan.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');

    res.status(200).json({
      success: true,
      count: scans.length,
      scans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener escaneos',
      error: error.message
    });
  }
});

/**
 * GET /api/scans/:id
 * Obtiene un escaneo específico (protegido)
 */
router.get('/:id', protect, async (req, res) => {
  try {
    // Validar formato de ObjectId
    if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de escaneo inválido'
      });
    }

    const scan = await Scan.findById(req.params.id)
      .populate('user', 'name email');

    if (!scan) {
      return res.status(404).json({
        success: false,
        message: 'Escaneo no encontrado'
      });
    }

    // Verificar que el scan pertenece al usuario
    if (scan.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para acceder a este escaneo'
      });
    }

    res.status(200).json({
      success: true,
      scan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener escaneo',
      error: error.message
    });
  }
});

export default router;

