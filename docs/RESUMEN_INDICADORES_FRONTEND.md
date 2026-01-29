# Resumen de indicadores para el frontend

La respuesta de cada scan incluye `aiResults.combined.summary`, pensado para mostrar estado e indicadores en la UI sin tener que interpretar el detalle completo.

---

## Estructura de `summary`

```json
{
  "status": "healthy" | "suspicious" | "critical",
  "statusLabel": "Sano" | "Sospechoso" | "Crítico",
  "message": "Texto listo para mostrar al usuario.",
  "hasWounds": true | false,
  "woundsCount": 0,
  "hasDiseases": true | false,
  "diseasesCount": 0,
  "topWound": { "class": "pressure-wound", "confidence": 0.92 } | null,
  "topDiseases": [ { "name": "lumpy", "confidence": 0.36 }, ... ],
  "indicators": [ ... ],
  "confidencePercent": "63%"
}
```

---

## Uso en el frontend

| Campo | Uso sugerido |
|-------|-------------------------------|
| `status` | Lógica (estilos, alertas, filtros). |
| `statusLabel` | Texto del badge/estado (ej. "Crítico"). |
| `message` | Mensaje principal del resultado (una línea). |
| `hasWounds` / `woundsCount` | Icono o contador de heridas. |
| `hasDiseases` / `diseasesCount` | Icono o contador de hallazgos de enfermedad. |
| `topWound` | Destacar la herida más confiable (nombre + %). |
| `topDiseases` | Lista corta de posibles enfermedades (nombre + %). |
| `indicators` | Chips/badges por hallazgo (tipo, etiqueta, severidad). |
| `confidencePercent` | Mostrar confianza global del resultado. |

---

## Array `indicators`

Cada elemento es un indicador listo para chip/badge:

```json
{
  "type": "wound" | "disease" | "healthy",
  "id": "pressure-wound",
  "label": "Herida por presión",
  "value": "92%",
  "severity": "critical" | "suspicious" | "low" | "healthy",
  "rawConfidence": 0.92
}
```

- **type** `wound`: herida detectada.  
- **type** `disease`: posible enfermedad.  
- **type** `healthy`: sin hallazgos (solo si no hay wounds ni diseases).

**severity** para estilos:
- `critical` → rojo / alta prioridad  
- `suspicious` → amarillo / revisar  
- `low` → gris / informativo  
- `healthy` → verde  

Ejemplo de mapeo en UI: un chip por `indicator` con `label`, `value` y color según `severity`.

---

## Ejemplo de respuesta (resumen solo)

Para un scan con heridas y posibles enfermedades:

```json
"summary": {
  "status": "critical",
  "statusLabel": "Crítico",
  "message": "Se detectaron 2 herida(s) y 2 posible(s) signo(s) de enfermedad. Revisión recomendada.",
  "hasWounds": true,
  "woundsCount": 2,
  "hasDiseases": true,
  "diseasesCount": 2,
  "topWound": { "class": "pressure-wound", "confidence": 0.9209327101707458 },
  "topDiseases": [
    { "name": "lumpy", "confidence": 0.3618888854980469 },
    { "name": "skin", "confidence": 0.34445568919181824 }
  ],
  "indicators": [
    { "type": "wound", "id": "pressure-wound", "label": "Herida por presión", "value": "92%", "severity": "critical", "rawConfidence": 0.92 },
    { "type": "wound", "id": "wound-ulser", "label": "Úlcera", "value": "81%", "severity": "critical", "rawConfidence": 0.81 },
    { "type": "disease", "id": "lumpy", "label": "lumpy", "value": "36%", "severity": "suspicious", "rawConfidence": 0.36 },
    { "type": "disease", "id": "skin", "label": "skin", "value": "34%", "severity": "suspicious", "rawConfidence": 0.34 }
  ],
  "confidencePercent": "92%"
}
```

El detalle completo (model1, model2, wound, combined.detections, combined.diseases, combined.wounds, etc.) sigue en la misma respuesta; el frontend puede usar solo `summary` para la vista resumida y el detalle para pantallas de “ver más”.
