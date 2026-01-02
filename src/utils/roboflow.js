import axios from 'axios';

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;

if (!ROBOFLOW_API_KEY) {
  console.warn('⚠️  ROBOFLOW_API_KEY no está configurada');
}

// Modelo 1: cattle-diseases (sliit-kuemd)
const MODEL1_WORKSPACE = process.env.ROBOFLOW_WORKSPACE || 'sliit-kuemd';
const MODEL1_PROJECT = process.env.ROBOFLOW_PROJECT || 'cattle-diseases';
const MODEL1_VERSION = process.env.ROBOFLOW_VERSION || '1';
// Formato HOSTED API: https://detect.roboflow.com/{workspace}/{project}/{version}
const MODEL1_URL = `https://detect.roboflow.com/${MODEL1_WORKSPACE}/${MODEL1_PROJECT}/${MODEL1_VERSION}`;

// Modelo 2: cow-diseases (thanuja-marasingha-gmbpr)
const MODEL2_WORKSPACE = process.env.ROBOFLOW_MODEL2_WORKSPACE || 'thanuja-marasingha-gmbpr';
const MODEL2_PROJECT = process.env.ROBOFLOW_MODEL2_PROJECT || 'cow-diseases';
const MODEL2_VERSION = process.env.ROBOFLOW_MODEL2_VERSION || '1';
// Formato HOSTED API: https://detect.roboflow.com/{workspace}/{project}/{version}
const MODEL2_URL = `https://detect.roboflow.com/${MODEL2_WORKSPACE}/${MODEL2_PROJECT}/${MODEL2_VERSION}`;

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

    const response = await axios.post(
      modelUrl,
      {
        image: imageUrl
      },
      {
        params: {
          api_key: ROBOFLOW_API_KEY
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    const { predictions } = response.data || {};
    
    // Calcular confianza promedio de las detecciones
    const confidences = predictions?.map(p => p.confidence) || [];
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

    // Extraer clases únicas detectadas
    const classes = [...new Set(predictions?.map(p => p.class) || [])];

    return {
      detections: predictions || [],
      confidence: avgConfidence,
      classes
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
 * Analiza una imagen con ambos modelos y combina resultados
 * @param {string} imageUrl - URL de la imagen a analizar
 * @returns {Promise<{model1: Object, model2: Object, combined: Object}>}
 */
export async function analyzeWithBothModels(imageUrl) {
  try {
    // Analizar con ambos modelos en paralelo
    const [result1, result2] = await Promise.allSettled([
      analyzeWithModel1(imageUrl),
      analyzeWithModel2(imageUrl)
    ]);

    // Extraer resultados (o valores por defecto si falló)
    const model1Result = result1.status === 'fulfilled' 
      ? result1.value 
      : { detections: [], confidence: 0, classes: [] };
    
    const model2Result = result2.status === 'fulfilled'
      ? result2.value
      : { detections: [], confidence: 0, classes: [] };

    // Combinar resultados
    const combinedConfidence = Math.max(model1Result.confidence, model2Result.confidence);
    const allDetections = [...model1Result.detections, ...model2Result.detections];
    
    // Extraer enfermedades detectadas con sus confianzas
    const diseases = [];
    
    // Agregar enfermedades del modelo 1
    model1Result.detections.forEach(det => {
      if (det.class) {
        diseases.push({
          name: det.class,
          confidence: det.confidence,
          model: 'model1'
        });
      }
    });
    
    // Agregar enfermedades del modelo 2
    model2Result.detections.forEach(det => {
      if (det.class) {
        diseases.push({
          name: det.class,
          confidence: det.confidence,
          model: 'model2'
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

    // Clasificación basada en confianza combinada
    let classification = 'healthy';
    if (combinedConfidence > 0.9) {
      classification = 'critical';
    } else if (combinedConfidence > 0.7) {
      classification = 'suspicious';
    }

    return {
      model1: model1Result,
      model2: model2Result,
      combined: {
        detections: allDetections,
        classification,
        confidence: combinedConfidence,
        diseases: Object.values(uniqueDiseases)
      }
    };
  } catch (error) {
    console.error('Error al analizar con ambos modelos:', error);
    throw error;
  }
}

