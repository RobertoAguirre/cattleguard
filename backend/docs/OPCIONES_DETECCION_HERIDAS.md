# Opciones para detección de heridas en ganado

Resumen de modelos y herramientas encontrados para complementar el MVP actual.

---

## Implementado: Wound Object Detection

El backend ya incluye el modelo **Wound Object Detection** como tercer modelo. En cada escaneo se ejecutan en paralelo:

1. **cattle-diseases** (enfermedades)
2. **cow-diseases** (enfermedades)
3. **wound-object-detection** (heridas)

**Variables de entorno opcionales** (en `.env`):

```env
# Wound Object Detection (por defecto: wound-object-detection/1)
ROBOFLOW_WOUND_PROJECT=wound-object-detection
ROBOFLOW_WOUND_VERSION=1
```

**Respuesta del scan:** En `aiResults` encontrarás `wound` (detections, confidence, classes) y en `combined`: `wounds` (array de heridas con confianza > 0.4), `woundsCount`. Si se detectan heridas, la clasificación sube al menos a `suspicious` (o `critical` si la confianza de la herida > 0.6).

---

## 1. Roboflow Universe – Modelos de heridas

### A) Wound Object Detection (recomendado para probar primero)
- **Proyecto:** [dlgoldenhourwounddetection/wound-object-detection](https://universe.roboflow.com/dlgoldenhourwounddetection/wound-object-detection/model/1)
- **Model ID:** `wound-object-detection/1`
- **Métricas:** mAP 49.7%, Precision 58.3%, Recall 47.1%
- **Entrenado con:** 772 imágenes
- **Uso:** Object Detection – detecta heridas en imágenes (no específico de ganado, pero reutilizable)
- **API:** Misma forma que tus modelos actuales:
  - `https://detect.roboflow.com/wound-object-detection/1?api_key=XXX&image=URL`
  - O Serverless: `https://serverless.roboflow.com/dlgoldenhourwounddetection/wound-object-detection/1`

**Nota:** Está entrenado en heridas humanas/ambientales; puede generalizar parcialmente a piel/lesiones en animales. Conviene probarlo con tus imágenes de ganado.

---

### B) Injured animal detector (incluye “injured cow”)
- **Proyecto:** [animalwounded/injured-dog-detector-xnb9y](https://universe.roboflow.com/animalwounded/injured-dog-detector-xnb9y)
- **Clases:** Animales lesionados vs no lesionados, incluye **injured cow**
- **Uso:** Clasificación de animal herido / no herido
- **Cómo usarlo:** Hay que obtener el project ID desde la app de Roboflow (Deploy → Hosted API) para ese proyecto.

---

### C) Otros modelos de heridas (167 en Universe)
Búsqueda: [class:wound](https://universe.roboflow.com/search?q=class:wound)

Algunos relevantes:
- **Burn / Cut / Scratch / Wound** – varias clases de lesiones
- **Wound segmentation** – segmentación de heridas (Lucas)
- **Ulcers, cuts, granulating, necrotic** – tipos de heridas

La mayoría son de heridas en humanos; sirven como referencia o para combinar con datos de ganado.

---

## 2. Roboflow – Enfermedades de piel / mastitis en ganado

### Cow and mastitis detection
- **Proyecto:** [kirubel/cow-and-mastitis-detection-ufyb8](https://universe.roboflow.com/kirubel/cow-and-mastitis-detection-ufyb8)
- **Clases:** vaca sana, ubre sana, vaca con lumpy, ubre con mastitis, comportamiento (alimentación, bebida, tumbada, de pie)
- **Imágenes:** ~4.8k
- **Uso:** Complementa tu modelo de enfermedades con detección de mastitis y estado de la ubre (cercano a “problemas locales” que pueden verse como heridas/lesiones).

---

## 3. Otras fuentes (investigación / productos)

### Termografía + IA (detectar lo que no se ve bien a simple vista)
- **Digital dermatitis (patas):** IA sobre termografía para detectar dermatitis digital en vacas (≈81% el día de aparición, ≈70% dos días antes).  
  Ref: *Nature*, “AI-based prediction and detection of early-onset of digital dermatitis in dairy cows using infrared thermography”.
- **Ojos y hocico en terneros:** Segmentación automática en termografía para patrones de temperatura (detección de fiebre / estrés).
- **Pezuñas (M2 digital dermatitis):** Termografía de patas traseras para lesiones M2; la temperatura ayuda pero no basta sola para automatizar lesiones concretas.

**Conclusión:** Tu cámara térmica (FLIR) es muy útil. Hoy no usas la imagen térmica en IA; integrar un modelo entrenado en **imágenes térmicas** de ganado (o un dataset que puedas crear) sería el siguiente paso para “heridas no tan fáciles de percibir”.

### Software / servicios
- No hay un “Google de heridas en ganado” listo para producción. Lo habitual es:
  - Modelos propios (p. ej. Roboflow) entrenados con datos de tu granja/región, o
  - Investigación (termografía + ML) que luego se convierte en producto.

---

## 4. Cómo añadir un tercer modelo (heridas) a tu backend

Si quieres probar **Wound Object Detection** sin tocar mucho código:

1. **Variables de entorno** (`.env`):
   ```env
   ROBOFLOW_WOUND_PROJECT=wound-object-detection
   ROBOFLOW_WOUND_VERSION=1
   ```
   Si el modelo está bajo otro workspace en Serverless, podría ser:
   `ROBOFLOW_WOUND_PROJECT=dlgoldenhourwounddetection/wound-object-detection`

2. **En `src/utils/roboflow.js`:**
   - Añadir constante con la URL del modelo de heridas (igual que MODEL1_URL / MODEL2_URL).
   - Crear `analyzeWithWoundModel(imageUrl)` que llame a ese endpoint.
   - En `analyzeWithBothModels` (o en una nueva función `analyzeWithAllModels`), llamar también al modelo de heridas y fusionar resultados (p. ej. nueva clave `wounds` en `aiResults`).

3. **Formato de respuesta:** El modelo de heridas devuelve detecciones (bounding boxes). Puedes mapear eso a algo como:
   - `wounds: [{ class: 'wound', confidence, x, y, width, height }]`
   y decidir umbral de confianza (p. ej. >0.5) para marcar “posible herida”.

4. **Clasificación global:** Si el modelo de heridas detecta al menos una herida por encima del umbral, podrías subir la severidad del scan (p. ej. de `healthy` a `suspicious` o `critical` según tu lógica actual).

---

## 5. Resumen de recomendaciones

| Prioridad | Acción | Esfuerzo |
|----------|--------|----------|
| 1 | Probar **Wound Object Detection** con tus imágenes RGB de ganado | Bajo – añadir 1 modelo y una ruta en el backend |
| 2 | Probar **Cow and mastitis detection** para ubre/lesiones locales | Bajo – mismo patrón que el modelo de heridas |
| 3 | Valorar **Injured animal detector** (incl. injured cow) como clasificador binario “herido / no herido” | Bajo, si el proyecto está disponible en Hosted/Serverless |
| 4 | A medio plazo: usar la **imagen térmica** en un modelo (entrenar en Roboflow con térmicas de ganado o buscar dataset público) | Alto – requiere datos y posiblemente Serverless/otro endpoint para térmicas |

Si quieres, el siguiente paso puede ser implementar solo el punto 1 (Wound Object Detection) en tu repo actual y dejarlo opcional por env var.
