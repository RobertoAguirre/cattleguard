import axios from 'axios';

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

/** Diagnósticos y síntomas para mostrar al usuario (nombre técnico → etiqueta + síntomas) */
const DIAGNOSIS_INFO = {
  // Enfermedades (cattle-diseases / cow-diseases)
  lumpy: {
    label: 'Dermatosis nodular contagiosa (Lumpy)',
    symptoms: 'Nódulos en piel, fiebre, descarga nasal y ocular, pérdida de apetito, cojera. Afecta piel, nódulos linfáticos y puede causar mastitis.',
    recommendation: 'Aislamiento y revisión veterinaria. Enfermedad de declaración obligatoria en muchas regiones.'
  },
  skin: {
    label: 'Alteración cutánea',
    symptoms: 'Lesiones en piel, enrojecimiento, descamación o engrosamiento. Puede asociarse a parásitos, hongos, dermatitis o reacción alérgica.',
    recommendation: 'Revisar zona afectada y estado general. Valorar tratamiento antiparasitario o antifúngico.'
  },
  dermatitis: {
    label: 'Dermatitis',
    symptoms: 'Inflamación de la piel, enrojecimiento, picor, costras o pérdida de pelo en la zona afectada.',
    recommendation: 'Identificar causa (contacto, parásitos, humedad). Tratamiento según origen.'
  },
  disease: {
    label: 'Signos de enfermedad',
    symptoms: 'Indicios inespecíficos de malestar: aspecto general alterado, posible decaimiento o alteración del pelaje.',
    recommendation: 'Observación y revisión veterinaria para concretar diagnóstico.'
  },
  contagious: {
    label: 'Indicio de proceso contagioso',
    symptoms: 'Patrón compatible con enfermedad transmisible entre animales (lesiones, estado general).',
    recommendation: 'Aislamiento preventivo y diagnóstico veterinario.'
  },
  ecthym: {
    label: 'Ectima contagioso',
    symptoms: 'Lesiones costrosas en boca, morro y patas. Enfermedad viral que afecta ovejas y puede afectar al ganado.',
    recommendation: 'Revisión veterinaria. Evitar contacto con otros animales hasta diagnóstico.'
  },
  respiratory: {
    label: 'Afección respiratoria',
    symptoms: 'Tos, descarga nasal, dificultad respiratoria o respiración acelerada. Puede asociarse a BRD u otras infecciones.',
    recommendation: 'Revisión veterinaria. Valorar antibiótico o antiinflamatorio según criterio profesional.'
  },
  brd: {
    label: 'Complejo respiratorio bovino (BRD)',
    symptoms: 'Fiebre, tos, descarga nasal, respiración rápida, orejas caídas, pérdida de apetito y de peso.',
    recommendation: 'Tratamiento temprano con antibiótico y antiinflamatorio. Aislamiento y buen manejo.'
  },
  '(brd)': {
    label: 'Complejo respiratorio bovino (BRD)',
    symptoms: 'Fiebre, tos, descarga nasal, respiración rápida, orejas caídas, pérdida de apetito y de peso.',
    recommendation: 'Tratamiento temprano con antibiótico y antiinflamatorio. Aislamiento y buen manejo.'
  },
  bovine: {
    label: 'Hallazgo en bovino',
    symptoms: 'Detección de alteración en el animal; se requieren más datos para precisar el tipo de problema.',
    recommendation: 'Completar evaluación con inspección directa o más imágenes.'
  },
  unlabeled: {
    label: 'Hallazgo sin clasificar',
    symptoms: 'El modelo detectó una anomalía que no pudo asignar a una categoría concreta.',
    recommendation: 'Revisión visual o veterinaria para identificar la causa.'
  },
  // Heridas
  'pressure-wound': {
    label: 'Herida por presión',
    symptoms: 'Lesión por apoyo prolongado o rozadura: piel dañada, posible ulceración, riesgo de infección. Común en animales postrados.',
    recommendation: 'Cambios de postura, camas blandas, limpieza y desinfección de la herida.'
  },
  'wound-ulser': {
    label: 'Úlcera',
    symptoms: 'Pérdida de tejido en piel o mucosas, zona enrojecida o con exudado. Puede infectarse si no se trata.',
    recommendation: 'Limpieza, desinfección y protección de la zona. Revisión veterinaria si es profunda.'
  },
  'orthopaedic-wounds': {
    label: 'Lesión ortopédica / zona afectada',
    symptoms: 'Zona de posible traumatismo, inflamación o herida asociada a patas o soporte. Puede haber cojera o dolor.',
    recommendation: 'Reposo, antiinflamatorio y revisión para descartar fractura o infección.'
  },
  wound: {
    label: 'Herida',
    symptoms: 'Corte, rasguño o abertura en la piel con riesgo de sangrado e infección.',
    recommendation: 'Limpieza, desinfección y vigilancia de signos de infección.'
  },
  cut: {
    label: 'Corte',
    symptoms: 'Herida por objeto cortante: bordes definidos, posible sangrado. Riesgo de infección.',
    recommendation: 'Limpieza, hemostasia si sangra y desinfección. Sutura si es necesario.'
  },
  burn: {
    label: 'Quemadura',
    symptoms: 'Daño por calor o sustancia: piel enrojecida, ampollas o necrosis. Dolor y riesgo de infección.',
    recommendation: 'Enfriar la zona, no reventar ampollas. Tratamiento veterinario según extensión.'
  },
  scratch: {
    label: 'Rasguño',
    symptoms: 'Lesión superficial en la piel, enrojecimiento o pequeña pérdida de continuidad.',
    recommendation: 'Limpieza suave y desinfección para evitar infección.'
  }
};

function getDiagnosisInfo(classKey) {
  const key = (classKey || '').toLowerCase().trim();
  return DIAGNOSIS_INFO[key] || {
    label: classKey || 'Hallazgo',
    symptoms: 'Signo detectado por el modelo. Se recomienda revisión visual o veterinaria para concretar.',
    recommendation: 'Valorar con un profesional.'
  };
}

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
 * @returns {Promise<{model1: Object, model2: Object, wound: Object, combined: Object}>}
 */
export async function analyzeWithBothModels(imageUrl) {
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
    const statusLabels = { healthy: 'Sano', suspicious: 'Sospechoso', critical: 'Crítico' };
    const statusLabel = statusLabels[classification] || classification;

    let message = '';
    if (isHealthy && !hasWounds) {
      message = 'No se detectaron enfermedades ni heridas.';
    } else if (hasWounds && !hasDiseases) {
      message = wounds.length === 1
        ? `Se detectó 1 herida (${(wounds[0].confidence * 100).toFixed(0)}% confianza).`
        : `Se detectaron ${wounds.length} heridas. Revisión recomendada.`;
    } else if (hasDiseases && !hasWounds) {
      message = sortedDiseases.length === 1
        ? `Posible signo de: ${sortedDiseases[0].name} (${(sortedDiseases[0].confidence * 100).toFixed(0)}%).`
        : `Posibles signos de enfermedad (${sortedDiseases.length} hallazgos). Revisión recomendada.`;
    } else {
      message = `Se detectaron ${wounds.length} herida(s) y ${sortedDiseases.length} posible(s) signo(s) de enfermedad. Revisión recomendada.`;
    }

    const indicators = [];
    const diagnoses = [];

    wounds.forEach(w => {
      const info = getDiagnosisInfo(w.class);
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
      const info = getDiagnosisInfo(d.name);
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
        label: 'Sin hallazgos',
        value: precisionPercent.toString() + '%',
        severity: 'healthy',
        rawConfidence: combinedConfidence
      });
      diagnoses.push({
        type: 'healthy',
        id: 'healthy',
        diagnosisLabel: 'Animal sin signos detectados',
        precisionPercent,
        symptoms: 'No se detectaron lesiones ni signos de enfermedad en el análisis.',
        recommendation: 'Mantener observación y buenas prácticas de manejo.',
        severity: 'healthy'
      });
    }

    const summary = {
      status: classification,
      statusLabel,
      message,
      hasWounds,
      woundsCount: wounds.length,
      hasDiseases,
      diseasesCount: sortedDiseases.length,
      topWound: wounds[0] ? { class: wounds[0].class, confidence: wounds[0].confidence } : null,
      topDiseases: sortedDiseases.slice(0, 3).map(d => ({ name: d.name, confidence: d.confidence })),
      indicators,
      diagnoses,
      confidencePercent: (combinedConfidence * 100).toFixed(0) + '%'
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

