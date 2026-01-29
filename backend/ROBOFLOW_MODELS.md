# Integración de Modelos Roboflow

## Modelos Utilizados

### 1. cattle-diseases (sliit-kuemd)
- **Workspace**: `sliit-kuemd`
- **Project**: `cattle-diseases`
- **Version**: `1`
- **URL**: https://universe.roboflow.com/sliit-kuemd/cattle-diseases
- **HOSTED API Endpoint**: `https://detect.roboflow.com/sliit-kuemd/cattle-diseases/1`

### 2. cow-diseases (thanuja-marasingha-gmbpr)
- **Workspace**: `thanuja-marasingha-gmbpr`
- **Project**: `cow-diseases`
- **Version**: `1`
- **URL**: https://universe.roboflow.com/thanuja-marasingha-gmbpr/cow-diseases
- **HOSTED API Endpoint**: `https://detect.roboflow.com/thanuja-marasingha-gmbpr/cow-diseases/1`

## Cómo Funciona la Integración

### Flujo de Análisis

1. **Captura de Imágenes**
   - La cámara FLIR One Pro captura:
     - Imagen RGB (luz visible)
     - Imagen térmica (infrarrojo)

2. **Upload a Cloudinary**
   - Ambas imágenes se suben a Cloudinary
   - Se obtienen URLs públicas

3. **Análisis con Roboflow**
   - La imagen RGB se envía a **ambos modelos en paralelo**
   - Cada modelo devuelve:
     - `predictions`: Array de detecciones
     - Cada detección contiene:
       - `class`: Nombre de la enfermedad/clase detectada
       - `confidence`: Nivel de confianza (0-1)
       - `x`, `y`, `width`, `height`: Coordenadas del bounding box

4. **Combinación de Resultados**
   - Se combinan las detecciones de ambos modelos
   - Se calcula la confianza máxima entre ambos
   - Se extraen enfermedades únicas (eliminando duplicados)
   - Se determina la clasificación final:
     - `healthy`: confianza ≤ 0.7
     - `suspicious`: confianza > 0.7 y ≤ 0.9
     - `critical`: confianza > 0.9

5. **Alerta Automática**
   - Si la clasificación es `suspicious` o `critical`:
     - Se envía alerta por WhatsApp con:
       - Clasificación
       - Confianza
       - Lista de enfermedades detectadas
       - Fecha y hora

## Estructura de Respuesta de Roboflow

```json
{
  "predictions": [
    {
      "class": "nombre_enfermedad",
      "confidence": 0.85,
      "x": 100,
      "y": 200,
      "width": 50,
      "height": 60
    }
  ],
  "image": {
    "width": 640,
    "height": 480
  }
}
```

## Estructura de Datos en la Base de Datos

El modelo `Scan` almacena:

```javascript
{
  aiResults: {
    // Resultados del modelo 1 (cattle-diseases)
    model1: {
      detections: [...],
      confidence: 0.85,
      classes: ["enfermedad1", "enfermedad2"]
    },
    // Resultados del modelo 2 (cow-diseases)
    model2: {
      detections: [...],
      confidence: 0.78,
      classes: ["enfermedad3"]
    },
    // Resultados combinados
    combined: {
      detections: [...], // Todas las detecciones
      classification: "suspicious",
      confidence: 0.85, // Máxima confianza
      diseases: [
        {
          name: "enfermedad1",
          confidence: 0.85,
          model: "model1"
        },
        {
          name: "enfermedad2",
          confidence: 0.80,
          model: "model1"
        },
        {
          name: "enfermedad3",
          confidence: 0.78,
          model: "model2"
        }
      ]
    }
  }
}
```

## Ventajas del Análisis Dual

1. **Mayor Precisión**: Dos modelos independientes validan las detecciones
2. **Cobertura Ampliada**: Cada modelo puede detectar diferentes enfermedades
3. **Redundancia**: Si un modelo falla, el otro puede seguir funcionando
4. **Confianza Combinada**: Se usa la máxima confianza para decisiones críticas

## Configuración

Las variables de entorno necesarias:

```env
# API Key compartida (misma para ambos modelos)
ROBOFLOW_API_KEY=tu_api_key

# Modelo 1
ROBOFLOW_WORKSPACE=sliit-kuemd
ROBOFLOW_PROJECT=cattle-diseases
ROBOFLOW_VERSION=1

# Modelo 2
ROBOFLOW_MODEL2_WORKSPACE=thanuja-marasingha-gmbpr
ROBOFLOW_MODEL2_PROJECT=cow-diseases
ROBOFLOW_MODEL2_VERSION=1
```

## Notas Técnicas

- **HOSTED API**: Utilizamos la Serverless Hosted API de Roboflow que no requiere infraestructura propia
- **Formato de Endpoint**: `https://detect.roboflow.com/{workspace}/{project}/{version}?api_key={api_key}`
- Los modelos se ejecutan en **paralelo** usando `Promise.allSettled()` para no bloquearse mutuamente
- Si un modelo falla, el otro continúa y se usa su resultado
- La imagen térmica se almacena pero actualmente no se analiza (puede usarse para análisis futuro)
- La HOSTED API acepta imágenes por URL (usamos Cloudinary) enviando JSON: `{ "image": "https://..." }`
- Límite de tamaño: 5MB por imagen

