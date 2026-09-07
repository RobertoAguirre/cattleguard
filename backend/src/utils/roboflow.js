import axios from 'axios';
import {
  getDiagnosisInfo,
  buildDiagnosticoGeneral,
  buildSummaryCopy,
  pickLang
} from './diagnosis_i18n.js';

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;

if (!ROBOFLOW_API_KEY) {
  console.warn('⚠️  ROBOFLOW_API_KEY no está configurada');
}

// Modelo 1: cattle-diseases
// V1 API solo usa 2 segmentos: https://detect.roboflow.com/{project_id}/{version}
const MODEL1_PROJECT = process.env.ROBOFLOW_PROJECT || 'cattle-diseases';
const MODEL1_VERSION = process.env.ROBOFLOW_VERSION || '1';
const MODEL1_URL = `https://detect.roboflow.com/${MODEL1_PROJECT}/${MODEL1_VERSION}`;

// Modelo 2: cow-diseases
const MODEL2_PROJECT = process.env.ROBOFLOW_MODEL2_PROJECT || 'cow-diseases';
const MODEL2_VERSION = process.env.ROBOFLOW_MODEL2_VERSION || '1';
const MODEL2_URL = `https://detect.roboflow.com/${MODEL2_PROJECT}/${MODEL2_VERSION}`;

// Modelo 3: Wound Object Detection (heridas - Roboflow Universe)
const WOUND_PROJECT = process.env.ROBOFLOW_WOUND_PROJECT || 'wound-object-detection';
const WOUND_VERSION = process.env.ROBOFLOW_WOUND_VERSION || '1';
const WOUND_URL = `https://detect.roboflow.com/${WOUND_PROJECT}/${WOUND_VERSION}`;

/**
 * Analiza una imagen con un modelo específico de Roboflow
 * @param {string} imageUrl - URL de la imagen a analizar
 * @param {string} modelUrl - URL del endpoint del modelo
 * @param {string} modelName - Nombre del modelo (para logging)
 * @returns {Promise<{detections: Array, confidence: number, classes: Array}>}
 */
async function analyzeWithModel(imageUrl, modelUrl, modelName) {
  try {
    if (!ROBOFLOW_API_KEY) {
      throw new Error('ROBOFLOW_API_KEY no está configurada');
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('imageUrl debe ser una URL válida');
    }

    // Roboflow Hosted API espera la URL de la imagen como query param, no en el body
    const response = await axios.post(
      modelUrl,
      null,
      {
        params: {
          api_key: ROBOFLOW_API_KEY,
          image: imageUrl
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    // Debug: ver respuesta completa de Roboflow
    console.log(`Roboflow response (${modelName}):`, JSON.stringify(response.data, null, 2));

    // La respuesta puede tener diferentes formatos según el modelo
    const data = response.data || {};
    
    // Intentar obtener predictions de diferentes formatos posibles
    let predictions = [];
    let topPrediction = null;
    
    if (Array.isArray(data.predictions)) {
      // Formato de detección de objetos: array de detecciones
      predictions = data.predictions;
    } else if (data.predictions && typeof data.predictions === 'object') {
      // Formato de clasificación: objeto { className: { confidence, class_id } }
      predictions = Object.entries(data.predictions).map(([className, pred]) => ({
        class: className,
        confidence: pred.confidence,
        class_id: pred.class_id
      }));
      
      // Obtener la clase con mayor confianza
      if (predictions.length > 0) {
        topPrediction = predictions.reduce((max, p) => 
          p.confidence > max.confidence ? p : max, predictions[0]);
      }
    }
    
    // Si hay predicted_classes, usarlo como referencia
    const predictedClasses = data.predicted_classes || [];

    // Calcular confianza: usar la del top prediction si es clasificación, o promedio si es detección
    let avgConfidence = 0;
    if (topPrediction) {
      avgConfidence = topPrediction.confidence;
    } else {
      const confidences = predictions.map(p => p.confidence).filter(c => typeof c === 'number');
      avgConfidence = confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0;
    }

    // Extraer clases: usar predicted_classes si existe, sino extraer de predictions
    let classes = predictedClasses.length > 0 
      ? predictedClasses 
      : [...new Set(predictions.map(p => p.class).filter(Boolean))];

    const imageWidth = data.image?.width ?? null;
    const imageHeight = data.image?.height ?? null;

    return {
      detections: predictions || [],
      confidence: avgConfidence,
      classes,
      imageWidth,
      imageHeight
    };
  } catch (error) {
    console.error(`Error en Roboflow API (${modelName}):`, error.response?.data || error.message);
    throw new Error(`Error al analizar imagen con ${modelName}: ${error.message}`);
  }
}

/**
 * Analiza una imagen con el modelo 1 (cattle-diseases)
 * @param {string} imageUrl - URL de la imagen a analizar
 * @returns {Promise<{detections: Array, confidence: number, classes: Array}>}
 */
export async function analyzeWithModel1(imageUrl) {
  return analyzeWithModel(imageUrl, MODEL1_URL, 'cattle-diseases');
}

/**
 * Analiza una imagen con el modelo 2 (cow-diseases)
 * @param {string} imageUrl - URL de la imagen a analizar
 * @returns {Promise<{detections: Array, confidence: number, classes: Array}>}
 */
export async function analyzeWithModel2(imageUrl) {
  return analyzeWithModel(imageUrl, MODEL2_URL, 'cow-diseases');
}

/**
 * Analiza una imagen con el modelo de heridas (Wound Object Detection)
 * @param {string} imageUrl - URL de la imagen a analizar
 * @returns {Promise<{detections: Array, confidence: number, classes: Array}>}
 */
export async function analyzeWithWoundModel(imageUrl) {
  return analyzeWithModel(imageUrl, WOUND_URL, 'wound-detection');
}

/**
 * Analiza una imagen con los tres modelos (enfermedades + heridas) y combina resultados
 * @param {string} imageUrl - URL de la imagen a analizar
 * @param {{ lang?: string }} [options]
 * @returns {Promise<{model1: Object, model2: Object, wound: Object, combined: Object}>}
 */
export async function analyzeWithBothModels(imageUrl, options = {}) {
  const lang = pickLang(options.lang);
  try {
    // Analizar con los tres modelos en paralelo
    const [result1, result2, resultWound] = await Promise.allSettled([
      analyzeWithModel1(imageUrl),
      analyzeWithModel2(imageUrl),
      analyzeWithWoundModel(imageUrl)
    ]);

    // Extraer resultados (o valores por defecto si falló)
    const model1Result = result1.status === 'fulfilled' 
      ? result1.value 
      : { detections: [], confidence: 0, classes: [] };
    
    const model2Result = result2.status === 'fulfilled'
      ? result2.value
      : { detections: [], confidence: 0, classes: [] };

    const woundResult = resultWound.status === 'fulfilled'
      ? resultWound.value
      : { detections: [], confidence: 0, classes: [] };

    const imageDimensions = (woundResult.imageWidth && woundResult.imageHeight)
      ? { width: woundResult.imageWidth, height: woundResult.imageHeight }
      : null;

    // Heridas detectadas (object detection: cada detección tiene class, confidence, x, y, width, height)
    const wounds = woundResult.detections
      .filter(d => d.confidence > 0.4)
      .map(d => ({
        class: d.class || 'wound',
        confidence: d.confidence,
        x: d.x,
        y: d.y,
        width: d.width,
        height: d.height
      }))
      .sort((a, b) => b.confidence - a.confidence);

    // Combinar resultados de enfermedades
    const allDetections = [...model1Result.detections, ...model2Result.detections];
    const allClasses = [...new Set([...model1Result.classes, ...model2Result.classes])];
    
    // Clases que indican animal sano (no son enfermedades)
    const healthyClasses = ['healthy', 'normal', 'sano', 'Unlabeled'];
    
    // Extraer enfermedades detectadas (excluyendo clases "sanas")
    const diseases = [];
    
    model1Result.detections.forEach(det => {
      if (det.class && !healthyClasses.includes(det.class) && det.confidence > 0.2) {
        diseases.push({
          name: det.class,
          confidence: det.confidence,
          model: 'cattle-diseases'
        });
      }
    });
    
    model2Result.detections.forEach(det => {
      if (det.class && !healthyClasses.includes(det.class) && det.confidence > 0.2) {
        diseases.push({
          name: det.class,
          confidence: det.confidence,
          model: 'cow-diseases'
        });
      }
    });

    // Eliminar duplicados y mantener la mayor confianza
    const uniqueDiseases = {};
    diseases.forEach(disease => {
      if (!uniqueDiseases[disease.name] || uniqueDiseases[disease.name].confidence < disease.confidence) {
        uniqueDiseases[disease.name] = disease;
      }
    });
    
    const sortedDiseases = Object.values(uniqueDiseases)
      .sort((a, b) => b.confidence - a.confidence);

    const predictedClasses = allClasses.filter(c => !healthyClasses.includes(c));
    const isHealthy = allClasses.some(c => healthyClasses.includes(c)) && predictedClasses.length === 0;
    
    const topDisease = sortedDiseases[0];
    const topConfidence = topDisease ? topDisease.confidence : 0;
    
    // Clasificación final (enfermedades)
    let classification = 'healthy';
    if (sortedDiseases.length > 0) {
      if (topConfidence > 0.7) {
        classification = 'critical';
      } else if (topConfidence > 0.4) {
        classification = 'suspicious';
      } else {
        classification = 'suspicious';
      }
    }

    // Si se detectaron heridas, subir al menos a suspicious
    const topWoundConfidence = wounds.length > 0 ? wounds[0].confidence : 0;
    if (wounds.length > 0) {
      if (topWoundConfidence > 0.6) {
        classification = 'critical';
      } else if (classification === 'healthy') {
        classification = 'suspicious';
      }
    }
    
    const combinedConfidence = isHealthy 
      ? model1Result.confidence 
      : Math.max(topConfidence, topWoundConfidence);

    // Resumen de indicadores para frontend (sin quitar detalle existente)
    const hasWounds = wounds.length > 0;
    const hasDiseases = sortedDiseases.length > 0;
    const { statusLabel, message, healthyDiagnosis } = buildSummaryCopy({
      classification,
      isHealthy,
      hasWounds,
      hasDiseases,
      wounds,
      sortedDiseases,
      lang
    });

    // Consenso entre modelos de enfermedades (mejora credibilidad / precisión percibida)
    const model1HasFindings = (model1Result.classes || []).some(c => !healthyClasses.includes(c));
    const model2HasFindings = (model2Result.classes || []).some(c => !healthyClasses.includes(c));
    const modelsAgree = model1HasFindings === model2HasFindings;

    const indicators = [];
    const diagnoses = [];

    wounds.forEach(w => {
      const info = getDiagnosisInfo(w.class, lang);
      const precisionPercent = Math.round(w.confidence * 100);
      indicators.push({
        type: 'wound',
        id: w.class,
        label: info.label,
        value: precisionPercent.toString() + '%',
        severity: w.confidence > 0.6 ? 'critical' : 'suspicious',
        rawConfidence: w.confidence
      });
      diagnoses.push({
        type: 'wound',
        id: w.class,
        diagnosisLabel: info.label,
        precisionPercent,
        symptoms: info.symptoms,
        recommendation: info.recommendation,
        severity: w.confidence > 0.6 ? 'critical' : 'suspicious'
      });
    });

    sortedDiseases.forEach(d => {
      const info = getDiagnosisInfo(d.name, lang);
      const precisionPercent = Math.round(d.confidence * 100);
      indicators.push({
        type: 'disease',
        id: d.name,
        label: info.label,
        value: precisionPercent.toString() + '%',
        severity: d.confidence > 0.7 ? 'critical' : d.confidence > 0.4 ? 'suspicious' : 'low',
        rawConfidence: d.confidence
      });
      diagnoses.push({
        type: 'disease',
        id: d.name,
        diagnosisLabel: info.label,
        precisionPercent,
        symptoms: info.symptoms,
        recommendation: info.recommendation,
        severity: d.confidence > 0.7 ? 'critical' : d.confidence > 0.4 ? 'suspicious' : 'low'
      });
    });

    if (indicators.length === 0 && isHealthy) {
      const precisionPercent = Math.round(combinedConfidence * 100);
      indicators.push({
        type: 'healthy',
        id: 'healthy',
        label: healthyDiagnosis.noFindingsLabel,
        value: precisionPercent.toString() + '%',
        severity: 'healthy',
        rawConfidence: combinedConfidence
      });
      diagnoses.push({
        type: 'healthy',
        id: 'healthy',
        diagnosisLabel: healthyDiagnosis.diagnosisLabel,
        precisionPercent,
        symptoms: healthyDiagnosis.symptoms,
        recommendation: healthyDiagnosis.recommendation,
        severity: 'healthy'
      });
    }

    const diagnosticoGeneral = buildDiagnosticoGeneral({
      classification,
      combinedConfidence,
      wounds,
      sortedDiseases,
      isHealthy,
      lang
    });

    const summary = {
      status: classification,
      statusLabel,
      message,
      diagnosticoGeneral,
      hasWounds,
      woundsCount: wounds.length,
      hasDiseases,
      diseasesCount: sortedDiseases.length,
      topWound: wounds[0] ? { class: wounds[0].class, confidence: wounds[0].confidence } : null,
      topDiseases: sortedDiseases.slice(0, 3).map(d => ({ name: d.name, confidence: d.confidence })),
      indicators,
      diagnoses,
      confidencePercent: (combinedConfidence * 100).toFixed(0) + '%',
      modelsAgree
    };

    return {
      model1: model1Result,
      model2: model2Result,
      wound: woundResult,
      combined: {
        detections: allDetections,
        classification,
        confidence: combinedConfidence,
        predictedClasses: allClasses,
        diseases: sortedDiseases,
        wounds,
        woundsCount: wounds.length,
        imageDimensions,
        isHealthy,
        summary
      }
    };
  } catch (error) {
    console.error('Error al analizar con todos los modelos:', error);
    throw error;
  }
}

