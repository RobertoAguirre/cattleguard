import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import Scan from '../models/Scan.js';
import { protect } from '../middleware/auth.js';
import { uploadImage } from '../utils/cloudinary.js';
import { analyzeWithBothModels } from '../utils/roboflow.js';
import { sendAlert } from '../utils/whatsapp.js';

/**
 * Función helper para actualizar diagnóstico consolidado del animal
 */
async function updateAnimalDiagnosis(animal, scans) {
  if (scans.length === 0) {
    animal.consolidatedDiagnosis = {
      classification: 'healthy',
      confidence: 0,
      diseases: [],
      lastUpdated: new Date()
    };
    return;
  }

  const diseaseMap = {};
  let maxConfidence = 0;
  let criticalCount = 0;
  let suspiciousCount = 0;

  scans.forEach(scan => {
    const combined = scan.aiResults?.combined || {};
    const classification = combined.classification || 'healthy';
    const confidence = combined.confidence || 0;

    if (classification === 'critical') criticalCount++;
    else if (classification === 'suspicious') suspiciousCount++;

    if (confidence > maxConfidence) {
      maxConfidence = confidence;
    }

    const diseases = combined.diseases || [];
    diseases.forEach(disease => {
      const key = disease.name;
      if (!diseaseMap[key]) {
        diseaseMap[key] = {
          name: disease.name,
          confidences: [],
          detectedIn: 0
        };
      }
      diseaseMap[key].confidences.push(disease.confidence);
      diseaseMap[key].detectedIn++;
    });
  });

  const consolidatedDiseases = Object.values(diseaseMap).map(disease => ({
    name: disease.name,
    confidence: disease.confidences.reduce((a, b) => Math.max(a, b), 0),
    detectedIn: disease.detectedIn,
    totalScans: scans.length
  }));

  let consolidatedClassification = 'healthy';
  if (criticalCount > 0 || maxConfidence > 0.9) {
    consolidatedClassification = 'critical';
  } else if (suspiciousCount > 0 || maxConfidence > 0.7) {
    consolidatedClassification = 'suspicious';
  }

  const totalScans = scans.length;
  const problematicScans = criticalCount + suspiciousCount;
  if (problematicScans > totalScans / 2) {
    if (criticalCount > suspiciousCount) {
      consolidatedClassification = 'critical';
    } else {
      consolidatedClassification = 'suspicious';
    }
  }

  animal.consolidatedDiagnosis = {
    classification: consolidatedClassification,
    confidence: maxConfidence,
    diseases: consolidatedDiseases.sort((a, b) => b.confidence - a.confidence),
    lastUpdated: new Date()
  };
}

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
    // Validar archivos - RGB es requerida, thermal es opcional para pruebas
    if (!req.files || !req.files.rgb) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos la imagen RGB'
      });
    }

    const rgbFile = req.files.rgb[0];
    const thermalFile = req.files.thermal ? req.files.thermal[0] : null;

    // Subir imágenes a Cloudinary
    const uploadPromises = [
      uploadImage(rgbFile.buffer, 'scans/rgb')
    ];
    
    if (thermalFile) {
      uploadPromises.push(uploadImage(thermalFile.buffer, 'scans/thermal'));
    } else {
      // Si no hay térmica, usar la misma RGB como placeholder
      uploadPromises.push(uploadImage(rgbFile.buffer, 'scans/thermal'));
    }

    const [rgbUrl, thermalUrl] = await Promise.all(uploadPromises);

    // Analizar imagen RGB con los tres modelos de Roboflow (enfermedades + heridas)
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
      wound: {
        detections: [],
        confidence: 0,
        classes: []
      },
      combined: {
        detections: [],
        classification: 'healthy',
        confidence: 0,
        diseases: [],
        wounds: [],
        woundsCount: 0,
        summary: {
          status: 'healthy',
          statusLabel: 'Sano',
          message: 'No se detectaron enfermedades ni heridas.',
          hasWounds: false,
          woundsCount: 0,
          hasDiseases: false,
          diseasesCount: 0,
          topWound: null,
          topDiseases: [],
          indicators: [],
          confidencePercent: '0%'
        }
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
    const { lat, lng, source, animalId, scanType } = req.body;

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
      animal: animalId || undefined,
      scanType: scanType || 'other',
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

    // Si hay animalId, actualizar el animal y su diagnóstico
    if (animalId && mongoose.Types.ObjectId.isValid(animalId)) {
      try {
        const Animal = (await import('../models/Animal.js')).default;
        const animal = await Animal.findById(animalId);
        
        if (animal && animal.user.toString() === req.user._id.toString()) {
          if (!animal.scans.includes(scan._id)) {
            animal.scans.push(scan._id);
            await animal.save();
            
            // Recalcular diagnóstico consolidado
            const scans = await Scan.find({ _id: { $in: animal.scans } });
            await updateAnimalDiagnosis(animal, scans);
            await animal.save();
          }
        }
      } catch (error) {
        console.error('Error al actualizar animal:', error.message);
        // No fallar el request si falla la actualización del animal
      }
    }

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

/** Número máximo de imágenes en un batch */
const BATCH_MAX_IMAGES = 20;

/** Objeto por defecto para aiResults cuando falla el análisis */
const defaultAiResults = () => ({
  model1: { detections: [], confidence: 0, classes: [] },
  model2: { detections: [], confidence: 0, classes: [] },
  wound: { detections: [], confidence: 0, classes: [] },
  combined: {
    detections: [],
    classification: 'healthy',
    confidence: 0,
    diseases: [],
    wounds: [],
    woundsCount: 0,
    summary: {
      status: 'healthy',
      statusLabel: 'Sano',
      message: 'No se detectaron enfermedades ni heridas.',
      hasWounds: false,
      woundsCount: 0,
      hasDiseases: false,
      diseasesCount: 0,
      topWound: null,
      topDiseases: [],
      indicators: [],
      confidencePercent: '0%'
    }
  }
});

/**
 * POST /api/scans/batch
 * Procesa varias imágenes en paralelo (múltiples RGB, opcionalmente múltiples thermal).
 * Body: multipart con campos rgb[] (o múltiples "rgb") y opcional thermal[].
 * Se emparejan por índice: rgb[0] + thermal[0], rgb[1] + thermal[1], etc. Si no hay thermal, se usa la misma RGB como placeholder.
 */
router.post('/batch', protect, upload.fields([
  { name: 'rgb', maxCount: BATCH_MAX_IMAGES },
  { name: 'thermal', maxCount: BATCH_MAX_IMAGES }
]), async (req, res) => {
  try {
    const rgbFiles = req.files?.rgb;
    if (!rgbFiles || !Array.isArray(rgbFiles) || rgbFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos una imagen RGB. Envía varias con el campo "rgb".'
      });
    }
    if (rgbFiles.length > BATCH_MAX_IMAGES) {
      return res.status(400).json({
        success: false,
        message: `Máximo ${BATCH_MAX_IMAGES} imágenes por lote.`
      });
    }

    const thermalFiles = Array.isArray(req.files?.thermal) ? req.files.thermal : [];
    const { lat, lng, source, animalId, scanType } = req.body;
    let location = undefined;
    if (lat != null && lng != null) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        location = { lat: parsedLat, lng: parsedLng };
      }
    }

    const processOne = async (rgbFile, thermalFileOrNull, index) => {
      const thermalBuffer = thermalFileOrNull ? thermalFileOrNull.buffer : rgbFile.buffer;
      const [rgbUrl, thermalUrl] = await Promise.all([
        uploadImage(rgbFile.buffer, 'scans/rgb'),
        uploadImage(thermalBuffer, 'scans/thermal')
      ]);
      let aiResults = defaultAiResults();
      try {
        const analysis = await analyzeWithBothModels(rgbUrl);
        aiResults = analysis;
      } catch (err) {
        console.error(`Error análisis batch imagen ${index + 1}:`, err.message);
      }
      const scan = await Scan.create({
        user: req.user._id,
        animal: animalId && mongoose.Types.ObjectId.isValid(animalId) ? animalId : undefined,
        scanType: scanType || 'other',
        images: { thermal: thermalUrl, rgb: rgbUrl },
        metadata: {
          source: source || 'flir_one_pro',
          location,
          timestamp: new Date(),
          batchIndex: index
        },
        aiResults,
        status: 'completed'
      });
      return { scan, aiResults };
    };

    const pairs = rgbFiles.map((rgbFile, i) => ({
      rgbFile,
      thermalFile: thermalFiles[i] || null
    }));

    const results = await Promise.allSettled(
      pairs.map(({ rgbFile, thermalFile }, i) => processOne(rgbFile, thermalFile, i))
    );

    const scans = [];
    const errors = [];
    results.forEach((outcome, i) => {
      if (outcome.status === 'fulfilled') {
        scans.push(outcome.value.scan);
        if (outcome.value.aiResults?.combined?.classification === 'suspicious' || outcome.value.aiResults?.combined?.classification === 'critical') {
          sendAlert(req.user.phone, `Escaneo batch: imagen ${i + 1} - ${outcome.value.aiResults.combined.summary?.message || outcome.value.aiResults.combined.classification}`).catch(() => {});
        }
      } else {
        errors.push({ index: i, error: outcome.reason?.message || String(outcome.reason) });
      }
    });

    if (animalId && mongoose.Types.ObjectId.isValid(animalId) && scans.length > 0) {
      try {
        const Animal = (await import('../models/Animal.js')).default;
        const animal = await Animal.findById(animalId);
        if (animal && animal.user.toString() === req.user._id.toString()) {
          scans.forEach(s => {
            if (!animal.scans.includes(s._id)) animal.scans.push(s._id);
          });
          await animal.save();
          const allScans = await Scan.find({ _id: { $in: animal.scans } });
          await updateAnimalDiagnosis(animal, allScans);
          await animal.save();
        }
      } catch (e) {
        console.error('Error actualizando animal en batch:', e.message);
      }
    }

    res.status(201).json({
      success: true,
      count: scans.length,
      total: pairs.length,
      scans,
      errors: errors.length ? errors : undefined
    });
  } catch (error) {
    console.error('Error en batch de escaneos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar lote de imágenes',
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
    const { animalId } = req.query;
    const query = { user: req.user._id };
    
    if (animalId && mongoose.Types.ObjectId.isValid(animalId)) {
      query.animal = animalId;
    }

    const scans = await Scan.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('animal', 'name tag');

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

