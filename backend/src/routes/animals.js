import express from 'express';
import mongoose from 'mongoose';
import Animal from '../models/Animal.js';
import Scan from '../models/Scan.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/animals
 * Crear un nuevo animal
 */
router.post('/', protect, async (req, res) => {
  try {
    const { name, tag, breed, age, gender, location, notes } = req.body;

    const animal = await Animal.create({
      user: req.user._id,
      name,
      tag,
      breed,
      age,
      gender: gender || 'unknown',
      location,
      notes,
      scans: [],
      consolidatedDiagnosis: {
        classification: 'healthy',
        confidence: 0,
        diseases: [],
        lastUpdated: new Date()
      }
    });

    res.status(201).json({
      success: true,
      animal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear animal',
      error: error.message
    });
  }
});

/**
 * GET /api/animals
 * Listar animales del usuario
 */
router.get('/', protect, async (req, res) => {
  try {
    const animals = await Animal.find({ user: req.user._id })
      .populate('scans', 'status aiResults.combined.classification createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: animals.length,
      animals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener animales',
      error: error.message
    });
  }
});

/**
 * GET /api/animals/:id
 * Obtener animal específico con diagnóstico consolidado
 */
router.get('/:id', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de animal inválido'
      });
    }

    const animal = await Animal.findById(req.params.id)
      .populate('scans')
      .populate('user', 'name email');

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Animal no encontrado'
      });
    }

    // Verificar que el animal pertenece al usuario
    if (animal.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado para acceder a este animal'
      });
    }

    res.status(200).json({
      success: true,
      animal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener animal',
      error: error.message
    });
  }
});

/**
 * POST /api/animals/:id/scans/:scanId
 * Asociar un escaneo a un animal
 */
router.post('/:id/scans/:scanId', protect, async (req, res) => {
  try {
    const { id, scanId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(scanId)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    const animal = await Animal.findById(id);
    const scan = await Scan.findById(scanId);

    if (!animal || !scan) {
      return res.status(404).json({
        success: false,
        message: 'Animal o escaneo no encontrado'
      });
    }

    // Verificar pertenencia
    if (animal.user.toString() !== req.user._id.toString() || 
        scan.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    // Asociar escaneo al animal
    if (!animal.scans.includes(scanId)) {
      animal.scans.push(scanId);
      scan.animal = id;
      await scan.save();
    }

    // Recalcular diagnóstico consolidado
    await updateConsolidatedDiagnosis(animal);

    await animal.save();

    res.status(200).json({
      success: true,
      animal,
      message: 'Escaneo asociado y diagnóstico actualizado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al asociar escaneo',
      error: error.message
    });
  }
});

/**
 * POST /api/animals/:id/consolidate
 * Recalcular diagnóstico consolidado manualmente
 */
router.post('/:id/consolidate', protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'ID de animal inválido'
      });
    }

    const animal = await Animal.findById(req.params.id)
      .populate('scans');

    if (!animal) {
      return res.status(404).json({
        success: false,
        message: 'Animal no encontrado'
      });
    }

    if (animal.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    await updateConsolidatedDiagnosis(animal);
    await animal.save();

    res.status(200).json({
      success: true,
      animal,
      message: 'Diagnóstico consolidado actualizado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al consolidar diagnóstico',
      error: error.message
    });
  }
});

/**
 * Función helper para actualizar diagnóstico consolidado
 */
async function updateConsolidatedDiagnosis(animal) {
  const scans = await Scan.find({ _id: { $in: animal.scans } });
  
  if (scans.length === 0) {
    animal.consolidatedDiagnosis = {
      classification: 'healthy',
      confidence: 0,
      diseases: [],
      lastUpdated: new Date()
    };
    return;
  }

  // Recopilar todas las enfermedades detectadas
  const diseaseMap = {};
  let maxConfidence = 0;
  let criticalCount = 0;
  let suspiciousCount = 0;
  let healthyCount = 0;

  scans.forEach(scan => {
    const combined = scan.aiResults?.combined || {};
    const classification = combined.classification || 'healthy';
    const confidence = combined.confidence || 0;

    // Contar clasificaciones
    if (classification === 'critical') criticalCount++;
    else if (classification === 'suspicious') suspiciousCount++;
    else healthyCount++;

    // Actualizar confianza máxima
    if (confidence > maxConfidence) {
      maxConfidence = confidence;
    }

    // Recopilar enfermedades
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

  // Calcular enfermedades consolidadas
  const consolidatedDiseases = Object.values(diseaseMap).map(disease => ({
    name: disease.name,
    confidence: disease.confidences.reduce((a, b) => Math.max(a, b), 0), // Máxima confianza
    detectedIn: disease.detectedIn,
    totalScans: scans.length
  }));

  // Determinar clasificación consolidada
  let consolidatedClassification = 'healthy';
  if (criticalCount > 0 || maxConfidence > 0.9) {
    consolidatedClassification = 'critical';
  } else if (suspiciousCount > 0 || maxConfidence > 0.7) {
    consolidatedClassification = 'suspicious';
  }

  // Si mayoría de escaneos son críticos/sospechosos, subir clasificación
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
    diseases: consolidatedDiseases.sort((a, b) => b.confidence - a.confidence), // Ordenar por confianza
    lastUpdated: new Date()
  };
}

export default router;

