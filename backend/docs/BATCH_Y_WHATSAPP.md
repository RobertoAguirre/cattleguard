# Procesamiento en lote y envío por WhatsApp

## 1. Procesar varias imágenes a la vez (batch)

### Endpoint

**POST /api/scans/batch** (protegido con JWT)

Envía varias imágenes en una sola petición; se procesan en paralelo (Cloudinary + Roboflow + creación de scans).

### Cuerpo (multipart/form-data)

| Campo    | Tipo   | Requerido | Descripción |
|----------|--------|-----------|-------------|
| rgb      | archivo(s) | Sí   | Una o más imágenes RGB. Múltiples archivos con el **mismo nombre de campo** `rgb`. |
| thermal  | archivo(s) | No   | Opcional: una térmica por índice (rgb[0] + thermal[0], etc.). Si no envías térmicas, se usa la misma RGB como placeholder. |
| source   | string | No   | Ej: `flir_one_pro`. |
| animalId | string | No   | ID del animal para asociar todos los scans. |
| scanType | string | No   | Ej: `lateral`, `frontal`, `other`. |
| lat, lng | string | No   | Coordenadas. |

- **Límite:** hasta **20 imágenes** por lote (configurable en código).
- Cada imagen RGB genera un scan independiente; si envías 5 `rgb`, obtienes 5 scans.

### Respuesta

```json
{
  "success": true,
  "count": 5,
  "total": 5,
  "scans": [ { ... scan 1 ... }, { ... scan 2 ... }, ... ],
  "errors": [ { "index": 2, "error": "mensaje" } ]
}
```

- `count`: scans creados correctamente.
- `total`: imágenes enviadas (pares rgb/thermal).
- `scans`: array de scans creados (mismo formato que POST /api/scans).
- `errors`: solo si alguna imagen falló (índice 0-based y mensaje).

### Ejemplo con Postman

1. Método: **POST**.
2. URL: `http://localhost:3000/api/scans/batch`.
3. Headers: `Authorization: Bearer <tu_jwt>`.
4. Body: **form-data**.
   - Añade varias claves con **el mismo nombre** `rgb` y en cada una selecciona un archivo (o arrastra varios si el cliente lo permite).
   - Opcional: mismas claves `thermal` para emparejar por índice.

### Ejemplo con curl (varias imágenes)

```bash
curl -X POST http://localhost:3000/api/scans/batch \
  -H "Authorization: Bearer TU_JWT" \
  -F "rgb=@foto1.jpg" \
  -F "rgb=@foto2.jpg" \
  -F "rgb=@foto3.jpg"
```

---

## 2. Enviar imágenes por WhatsApp

Los granjeros pueden enviar fotos por WhatsApp; el backend las recibe, las procesa y responde con un resumen.

### Webhook

**POST /api/webhooks/whatsapp**

- **Sin autenticación JWT.** Lo llama Twilio cuando alguien escribe o envía medios al número de WhatsApp configurado.
- La URL debe ser **pública** (ej. ngrok o tu dominio en producción) y configurada en Twilio como “Webhook URL” del número de WhatsApp.

### Flujo

1. El granjero envía uno o más mensajes con **fotos** al número de WhatsApp del sistema.
2. Twilio hace POST a `https://tu-dominio.com/api/webhooks/whatsapp` con los parámetros del mensaje (From, NumMedia, MediaUrl0, MediaUrl1, …).
3. El backend:
   - Responde **200** enseguida (para no bloquear a Twilio).
   - Descarga las imágenes desde Twilio (con Account SID y Auth Token).
   - Busca un **usuario** cuyo `phone` coincida con el número que envía (From).
   - Si no hay usuario: responde por WhatsApp indicando que debe registrarse con ese número.
   - Si hay usuario: por cada imagen hace upload a Cloudinary, análisis con Roboflow y crea un scan asociado a ese usuario.
   - Envía por WhatsApp un **resumen** (ej. “Procesadas 3 imagen(es). 1 crítica(s). 2 sana(s).”).

### Requisitos

1. **Twilio configurado** en `.env`:  
   `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`.
2. **Usuario registrado** con el **mismo número de teléfono** (o equivalente) que el que envía por WhatsApp. El backend normaliza y compara números para encontrar al usuario.
3. **URL pública** del webhook configurada en la consola de Twilio (WhatsApp → número → “When a message comes in” → URL de tu backend).

### Límites

- Máximo **10 imágenes** por mensaje (el resto se ignora).
- Solo se procesan archivos cuyo tipo sea imagen (p. ej. image/jpeg, image/png).

### Respuestas automáticas por WhatsApp

- Sin fotos: “Envía una o varias fotos del ganado para analizarlas…”
- Sin imágenes válidas: “No se detectaron imágenes en el mensaje…”
- Usuario no encontrado: “No estás registrado en el sistema. Regístrate con el mismo número de WhatsApp…”
- Tras procesar: “Procesadas N imagen(es). X crítica(s). Y sospechosa(s). Z sana(s).”

---

## Resumen

| Uso                    | Endpoint                    | Auth | Descripción |
|------------------------|-----------------------------|------|-------------|
| Varias imágenes (API)  | POST /api/scans/batch       | JWT  | Hasta 20 imágenes por petición, procesadas en paralelo. |
| Fotos por WhatsApp     | POST /api/webhooks/whatsapp | No   | Twilio envía las fotos; el backend las procesa y responde por WhatsApp. |

El detalle de cada scan (enfermedades, heridas, summary, etc.) es el mismo que en POST /api/scans; solo cambia la forma de enviar las imágenes (batch o WhatsApp).
