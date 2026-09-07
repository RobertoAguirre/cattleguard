/**
 * Bilingual diagnosis copy for CattleGuard scan results.
 * Keys match Roboflow class labels used by cattle-diseases / cow-diseases / wound models.
 */

function pickLang(lang) {
  if (lang == null || lang === '') return 'en';
  const raw = String(lang).toLowerCase();
  return raw.startsWith('es') ? 'es' : 'en';
}

const DIAGNOSIS_INFO = {
  lumpy: {
    es: {
      label: 'Dermatosis nodular contagiosa (Lumpy)',
      symptoms: 'Nódulos en piel, fiebre, descarga nasal y ocular, pérdida de apetito, cojera. Afecta piel, nódulos linfáticos y puede causar mastitis.',
      recommendation: 'Aislamiento y revisión veterinaria. Enfermedad de declaración obligatoria en muchas regiones.'
    },
    en: {
      label: 'Lumpy skin disease',
      symptoms: 'Skin nodules, fever, nasal/ocular discharge, loss of appetite, lameness. Affects skin and lymph nodes; may cause mastitis.',
      recommendation: 'Isolate and call a veterinarian. Notifiable in many regions.'
    }
  },
  skin: {
    es: {
      label: 'Alteración cutánea',
      symptoms: 'Lesiones en piel, enrojecimiento, descamación o engrosamiento. Puede asociarse a parásitos, hongos, dermatitis o reacción alérgica.',
      recommendation: 'Revisar zona afectada y estado general. Valorar tratamiento antiparasitario o antifúngico.'
    },
    en: {
      label: 'Skin abnormality',
      symptoms: 'Skin lesions, redness, scaling or thickening. May relate to parasites, fungi, dermatitis or allergy.',
      recommendation: 'Inspect the area and overall condition. Consider antiparasitic or antifungal care.'
    }
  },
  dermatitis: {
    es: {
      label: 'Dermatitis',
      symptoms: 'Inflamación de la piel, enrojecimiento, picor, costras o pérdida de pelo en la zona afectada.',
      recommendation: 'Identificar causa (contacto, parásitos, humedad). Tratamiento según origen.'
    },
    en: {
      label: 'Dermatitis',
      symptoms: 'Skin inflammation, redness, itching, scabs or hair loss in the affected area.',
      recommendation: 'Identify the cause (contact, parasites, moisture). Treat according to origin.'
    }
  },
  disease: {
    es: {
      label: 'Signos de enfermedad',
      symptoms: 'Indicios inespecíficos de malestar: aspecto general alterado, posible decaimiento o alteración del pelaje.',
      recommendation: 'Observación y revisión veterinaria para concretar diagnóstico.'
    },
    en: {
      label: 'Disease signs',
      symptoms: 'Non-specific signs of illness: altered appearance, possible lethargy or coat changes.',
      recommendation: 'Observe and seek veterinary review to refine the diagnosis.'
    }
  },
  contagious: {
    es: {
      label: 'Indicio de proceso contagioso',
      symptoms: 'Patrón compatible con enfermedad transmisible entre animales (lesiones, estado general).',
      recommendation: 'Aislamiento preventivo y diagnóstico veterinario.'
    },
    en: {
      label: 'Possible contagious process',
      symptoms: 'Pattern compatible with a transmissible disease (lesions, overall condition).',
      recommendation: 'Preventive isolation and veterinary diagnosis.'
    }
  },
  ecthym: {
    es: {
      label: 'Ectima contagioso',
      symptoms: 'Lesiones costrosas en boca, morro y patas. Enfermedad viral que afecta ovejas y puede afectar al ganado.',
      recommendation: 'Revisión veterinaria. Evitar contacto con otros animales hasta diagnóstico.'
    },
    en: {
      label: 'Contagious ecthyma (orf)',
      symptoms: 'Crusty lesions on mouth, muzzle and feet. Viral disease mainly in sheep; can affect cattle.',
      recommendation: 'Veterinary review. Limit contact with other animals until diagnosed.'
    }
  },
  respiratory: {
    es: {
      label: 'Afección respiratoria',
      symptoms: 'Tos, descarga nasal, dificultad respiratoria o respiración acelerada. Puede asociarse a BRD u otras infecciones.',
      recommendation: 'Revisión veterinaria. Valorar antibiótico o antiinflamatorio según criterio profesional.'
    },
    en: {
      label: 'Respiratory issue',
      symptoms: 'Cough, nasal discharge, labored or rapid breathing. May relate to BRD or other infections.',
      recommendation: 'Veterinary review. Antibiotic or anti-inflammatory only under professional guidance.'
    }
  },
  brd: {
    es: {
      label: 'Complejo respiratorio bovino (BRD)',
      symptoms: 'Fiebre, tos, descarga nasal, respiración rápida, orejas caídas, pérdida de apetito y de peso.',
      recommendation: 'Tratamiento temprano con antibiótico y antiinflamatorio. Aislamiento y buen manejo.'
    },
    en: {
      label: 'Bovine respiratory disease (BRD)',
      symptoms: 'Fever, cough, nasal discharge, rapid breathing, drooping ears, loss of appetite and weight.',
      recommendation: 'Early antibiotic and anti-inflammatory treatment. Isolate and improve handling.'
    }
  },
  '(brd)': {
    es: {
      label: 'Complejo respiratorio bovino (BRD)',
      symptoms: 'Fiebre, tos, descarga nasal, respiración rápida, orejas caídas, pérdida de apetito y de peso.',
      recommendation: 'Tratamiento temprano con antibiótico y antiinflamatorio. Aislamiento y buen manejo.'
    },
    en: {
      label: 'Bovine respiratory disease (BRD)',
      symptoms: 'Fever, cough, nasal discharge, rapid breathing, drooping ears, loss of appetite and weight.',
      recommendation: 'Early antibiotic and anti-inflammatory treatment. Isolate and improve handling.'
    }
  },
  bovine: {
    es: {
      label: 'Hallazgo en bovino',
      symptoms: 'Detección de alteración en el animal; se requieren más datos para precisar el tipo de problema.',
      recommendation: 'Completar evaluación con inspección directa o más imágenes.'
    },
    en: {
      label: 'Bovine finding',
      symptoms: 'An abnormality was detected; more data is needed to specify the problem.',
      recommendation: 'Complete evaluation with direct inspection or more images.'
    }
  },
  unlabeled: {
    es: {
      label: 'Hallazgo sin clasificar',
      symptoms: 'El modelo detectó una anomalía que no pudo asignar a una categoría concreta.',
      recommendation: 'Revisión visual o veterinaria para identificar la causa.'
    },
    en: {
      label: 'Unclassified finding',
      symptoms: 'The model detected an anomaly it could not assign to a specific category.',
      recommendation: 'Visual or veterinary review to identify the cause.'
    }
  },
  'pressure-wound': {
    es: {
      label: 'Herida por presión',
      symptoms: 'Lesión por apoyo prolongado o rozadura: piel dañada, posible ulceración, riesgo de infección. Común en animales postrados.',
      recommendation: 'Cambios de postura, camas blandas, limpieza y desinfección de la herida.'
    },
    en: {
      label: 'Pressure wound',
      symptoms: 'Injury from prolonged pressure or rubbing: damaged skin, possible ulceration, infection risk. Common in downed animals.',
      recommendation: 'Repositioning, soft bedding, clean and disinfect the wound.'
    }
  },
  'wound-ulser': {
    es: {
      label: 'Úlcera',
      symptoms: 'Pérdida de tejido en piel o mucosas, zona enrojecida o con exudado. Puede infectarse si no se trata.',
      recommendation: 'Limpieza, desinfección y protección de la zona. Revisión veterinaria si es profunda.'
    },
    en: {
      label: 'Ulcer',
      symptoms: 'Tissue loss on skin or mucosa, redness or exudate. May infect if untreated.',
      recommendation: 'Clean, disinfect and protect the area. Veterinary review if deep.'
    }
  },
  'orthopaedic-wounds': {
    es: {
      label: 'Lesión ortopédica / zona afectada',
      symptoms: 'Zona de posible traumatismo, inflamación o herida asociada a patas o soporte. Puede haber cojera o dolor.',
      recommendation: 'Reposo, antiinflamatorio y revisión para descartar fractura o infección.'
    },
    en: {
      label: 'Orthopaedic / limb-area lesion',
      symptoms: 'Possible trauma, inflammation or wound on limbs or weight-bearing areas. May include lameness or pain.',
      recommendation: 'Rest, anti-inflammatory care and review to rule out fracture or infection.'
    }
  },
  wound: {
    es: {
      label: 'Herida',
      symptoms: 'Corte, rasguño o abertura en la piel con riesgo de sangrado e infección.',
      recommendation: 'Limpieza, desinfección y vigilancia de signos de infección.'
    },
    en: {
      label: 'Wound',
      symptoms: 'Cut, scratch or break in the skin with bleeding and infection risk.',
      recommendation: 'Clean, disinfect and watch for infection signs.'
    }
  },
  cut: {
    es: {
      label: 'Corte',
      symptoms: 'Herida por objeto cortante: bordes definidos, posible sangrado. Riesgo de infección.',
      recommendation: 'Limpieza, hemostasia si sangra y desinfección. Sutura si es necesario.'
    },
    en: {
      label: 'Cut',
      symptoms: 'Sharp-object wound: defined edges, possible bleeding. Infection risk.',
      recommendation: 'Clean, control bleeding if needed, disinfect. Suture if required.'
    }
  },
  burn: {
    es: {
      label: 'Quemadura',
      symptoms: 'Daño por calor o sustancia: piel enrojecida, ampollas o necrosis. Dolor y riesgo de infección.',
      recommendation: 'Enfriar la zona, no reventar ampollas. Tratamiento veterinario según extensión.'
    },
    en: {
      label: 'Burn',
      symptoms: 'Heat or chemical damage: redness, blisters or necrosis. Pain and infection risk.',
      recommendation: 'Cool the area; do not pop blisters. Veterinary care based on extent.'
    }
  },
  scratch: {
    es: {
      label: 'Rasguño',
      symptoms: 'Lesión superficial en la piel, enrojecimiento o pequeña pérdida de continuidad.',
      recommendation: 'Limpieza suave y desinfección para evitar infección.'
    },
    en: {
      label: 'Scratch',
      symptoms: 'Superficial skin injury, redness or small break in the skin.',
      recommendation: 'Gentle cleaning and disinfection to prevent infection.'
    }
  }
};

export function getDiagnosisInfo(classKey, lang = 'en') {
  const L = pickLang(lang);
  const key = (classKey || '').toLowerCase().trim();
  const entry = DIAGNOSIS_INFO[key];
  if (entry) return entry[L];
  return L === 'en'
    ? {
        label: classKey || 'Finding',
        symptoms: 'Sign detected by the model. Visual or veterinary review is recommended.',
        recommendation: 'Seek professional assessment.'
      }
    : {
        label: classKey || 'Hallazgo',
        symptoms: 'Signo detectado por el modelo. Se recomienda revisión visual o veterinaria para concretar.',
        recommendation: 'Valorar con un profesional.'
      };
}

export function buildDiagnosticoGeneral({
  classification,
  combinedConfidence,
  wounds,
  sortedDiseases,
  isHealthy,
  lang = 'en'
}) {
  const L = pickLang(lang);
  const precision = Math.round(combinedConfidence * 100);
  const woundLabels = wounds.slice(0, 3).map(w => getDiagnosisInfo(w.class, L).label);
  const diseaseLabels = sortedDiseases.slice(0, 3).map(d => getDiagnosisInfo(d.name, L).label);

  if (isHealthy && wounds.length === 0) {
    return L === 'en'
      ? `No disease signs or wounds were detected (precision ${precision}%). The animal appears within normal limits. Keep monitoring and good herd practices.`
      : `No se detectaron signos de enfermedad ni heridas en el análisis (precisión ${precision}%). El animal presenta un estado aparente dentro de lo normal. Se recomienda mantener la observación y las buenas prácticas de manejo.`;
  }

  const parts = [];
  if (wounds.length > 0) {
    parts.push(
      L === 'en'
        ? `${wounds.length} wound(s) detected: ${woundLabels.join(', ')}.`
        : `Se detectaron ${wounds.length} herida(s): ${woundLabels.join(', ')}.`
    );
  }
  if (sortedDiseases.length > 0) {
    parts.push(
      L === 'en'
        ? `Signs compatible with: ${diseaseLabels.join(', ')}.`
        : `Signos compatibles con: ${diseaseLabels.join(', ')}.`
    );
  }
  const hallazgos = parts.join(' ');
  const recomendacion =
    classification === 'critical'
      ? (L === 'en' ? 'Priority veterinary review recommended.' : 'Se recomienda revisión veterinaria con prioridad.')
      : classification === 'suspicious'
        ? (L === 'en'
            ? 'Veterinary review or direct inspection recommended to confirm.'
            : 'Se recomienda revisión veterinaria o inspección directa para confirmar.')
        : (L === 'en' ? 'Keep observing.' : 'Mantener observación.');

  return L === 'en'
    ? `Decision-support assessment (precision ${precision}%): ${hallazgos} ${recomendacion} This result is indicative and does not replace professional judgment.`
    : `Diagnóstico de apoyo (precisión ${precision}%): ${hallazgos} ${recomendacion} Este resultado es orientativo y no sustituye el criterio de un profesional.`;
}

export function buildSummaryCopy({
  classification,
  isHealthy,
  hasWounds,
  hasDiseases,
  wounds,
  sortedDiseases,
  lang = 'en'
}) {
  const L = pickLang(lang);
  const statusLabels =
    L === 'en'
      ? { healthy: 'Healthy', suspicious: 'Suspicious', critical: 'Critical' }
      : { healthy: 'Sano', suspicious: 'Sospechoso', critical: 'Crítico' };
  const statusLabel = statusLabels[classification] || classification;

  let message = '';
  if (isHealthy && !hasWounds) {
    message = L === 'en'
      ? 'No diseases or wounds detected.'
      : 'No se detectaron enfermedades ni heridas.';
  } else if (hasWounds && !hasDiseases) {
    message = wounds.length === 1
      ? (L === 'en'
          ? `1 wound detected (${(wounds[0].confidence * 100).toFixed(0)}% confidence).`
          : `Se detectó 1 herida (${(wounds[0].confidence * 100).toFixed(0)}% confianza).`)
      : (L === 'en'
          ? `${wounds.length} wounds detected. Review recommended.`
          : `Se detectaron ${wounds.length} heridas. Revisión recomendada.`);
  } else if (hasDiseases && !hasWounds) {
    message = sortedDiseases.length === 1
      ? (L === 'en'
          ? `Possible sign of: ${sortedDiseases[0].name} (${(sortedDiseases[0].confidence * 100).toFixed(0)}%).`
          : `Posible signo de: ${sortedDiseases[0].name} (${(sortedDiseases[0].confidence * 100).toFixed(0)}%).`)
      : (L === 'en'
          ? `Possible disease signs (${sortedDiseases.length} findings). Review recommended.`
          : `Posibles signos de enfermedad (${sortedDiseases.length} hallazgos). Revisión recomendada.`);
  } else {
    message = L === 'en'
      ? `${wounds.length} wound(s) and ${sortedDiseases.length} possible disease sign(s) detected. Review recommended.`
      : `Se detectaron ${wounds.length} herida(s) y ${sortedDiseases.length} posible(s) signo(s) de enfermedad. Revisión recomendada.`;
  }

  const healthyDiagnosis =
    L === 'en'
      ? {
          diagnosisLabel: 'No signs detected',
          symptoms: 'No lesions or disease signs were detected in this analysis.',
          recommendation: 'Keep monitoring and good herd practices.',
          noFindingsLabel: 'No findings'
        }
      : {
          diagnosisLabel: 'Animal sin signos detectados',
          symptoms: 'No se detectaron lesiones ni signos de enfermedad en el análisis.',
          recommendation: 'Mantener observación y buenas prácticas de manejo.',
          noFindingsLabel: 'Sin hallazgos'
        };

  return { statusLabel, message, healthyDiagnosis };
}

export { pickLang };
