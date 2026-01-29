# Guía de posicionamiento de cámara para mejor detección

Recomendaciones para obtener la mejor precisión con los modelos de enfermedades y heridas (cattle-diseases, cow-diseases, wound-object-detection).

---

## Resumen rápido

| Aspecto | Recomendación |
|--------|----------------|
| **Animales por encuadre** | **Una vaca por foto** (ideal). Máximo 2–3 si están cerca. |
| **Ángulo** | **De lado (perfil)** preferible. Frente aceptable para cabeza/ojos. |
| **Distancia** | Cercana: el animal (o la zona a revisar) debe ocupar una parte importante del encuadre. |
| **Estabilidad** | Foto estable, sin movimiento; el animal bien encuadrado. |

---

## 1. Cuántos animales por encuadre

- **Ideal: una vaca por encuadre.**  
  El modelo de **clasificación** (cattle-diseases) interpreta toda la imagen como “un animal”. Si hay varias vacas, la imagen es ambigua y la confianza suele bajar.  
  Los modelos de **detección** (enfermedades y heridas) funcionan mejor cuando el animal ocupa un tamaño grande en la imagen; con muchas vacas pequeñas, las detecciones son más débiles.

- **Aceptable: 2–3 vacas** si están juntas y una de ellas es claramente el sujeto principal (más grande en el encuadre).  
  Evitar fotos de corral lleno con muchos animales pequeños.

---

## 2. Posición: de frente vs de lado

- **De lado (perfil)** es lo más recomendable:
  - Se ve mejor el cuerpo, flanco, patas y piel.
  - La mayoría de datasets de ganado usan vistas laterales.
  - Facilita detectar heridas, lesiones y signos de enfermedad en el cuerpo.

- **De frente** sirve sobre todo para:
  - Cara, ojos y morro.
  - Útil si te interesa más el estado de la cabeza.

- **Recomendación:** Priorizar **vista lateral** para enfermedades y heridas; usar frente solo cuando el foco sea la cabeza.

---

## 3. Distancia y encuadre

- El animal (o la zona que quieres revisar) debe **ocupar una parte relevante de la foto** (p. ej. entre un tercio y la mitad del encuadre o más).
- Demasiado lejos: el modelo ve vacas pequeñas y pierde detalle (menor precisión en heridas y enfermedades).
- Demasiado cerca: se pierde contexto del cuerpo; puede seguir siendo útil para una herida concreta si esa zona llena el encuadre.

---

## 4. Iluminación y nitidez

- Buena luz (natural o artificial) sin sombras fuertes sobre el animal.
- Evitar fotos muy oscuras o borrosas por movimiento.
- La cámara térmica (si se usa) complementa; los modelos actuales usan sobre todo la imagen RGB.

---

## 5. Uso en la app

En la pantalla **“Analizar foto”** de CattleGuard se muestran consejos breves: una vaca por encuadre, preferir vista lateral y acercar para que el animal o la zona a revisar se vea bien. Seguir estas pautas mejora la detección de enfermedades y heridas.
