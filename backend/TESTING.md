# Guía de Pruebas de la API con Postman

## Inicio Rápido

1. **Inicia el backend:**
   ```bash
   npm run dev
   ```

2. **Abre Postman** y sigue los pasos a continuación

3. **Prepara dos imágenes** (JPG o PNG) - cualquier imagen que tengas funciona

---

## Paso 1: Health Check

```http
GET http://localhost:3000/health
```

Deberías recibir: `{"success": true, "message": "Servidor funcionando correctamente"}`

---

## Paso 2: Registrar Usuario

```http
POST http://localhost:3000/api/auth/register
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "phone": "+526141234567",
  "role": "rancher",
  "ranch": {
    "name": "Rancho San José",
    "location": { "lat": 19.4326, "lng": -99.1332 },
    "size": 150
  }
}
```

**⚠️ IMPORTANTE:** Guarda el `token` de la respuesta - lo necesitarás para los siguientes pasos.

---

## Paso 3: Login (Opcional)

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

---

## Paso 4: Obtener Usuario Actual

```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer {tu_token_aqui}
```

---

## Paso 5: Crear Escaneo con Imágenes ⭐

Este es el paso principal para probar la subida de imágenes.

### Configuración en Postman:

1. **Método y URL:**
   ```
   POST http://localhost:3000/api/scans
   ```

2. **Headers:**
   - Agrega: `Authorization` → `Bearer {tu_token}`
   - **NO agregues** `Content-Type` (Postman lo hace automáticamente)

3. **Body:**
   - Pestaña **"Body"**
   - Selecciona **"form-data"** (no "raw" ni "x-www-form-urlencoded")
   
4. **Agregar campos:**
   
   | Key | Type | Value |
   |-----|------|-------|
   | `thermal` | **File** | Selecciona tu primera imagen |
   | `rgb` | **File** | Selecciona tu segunda imagen |
   | `lat` | **Text** | `19.4326` (opcional) |
   | `lng` | **Text** | `-99.1332` (opcional) |
   | `source` | **Text** | `flir_one_pro` (opcional) |

   **⚠️ CRÍTICO:** 
   - `thermal` y `rgb` **DEBEN** ser tipo **File** (no Text)
   - Haz clic en el dropdown del tipo → cambia de "Text" a **"File"**
   - Luego haz clic en **"Select Files"** para elegir tus imágenes

5. **Enviar:**
   - Haz clic en **"Send"**
   - Deberías recibir una respuesta con el escaneo creado

**Ejemplo de respuesta exitosa:**
```json
{
  "success": true,
  "scan": {
    "_id": "...",
    "images": {
      "thermal": "https://res.cloudinary.com/...",
      "rgb": "https://res.cloudinary.com/..."
    },
    "aiResults": {
      "combined": {
        "classification": "healthy",
        "confidence": 0.5,
        "diseases": []
      }
    },
    "status": "completed"
  }
}
```

---

## Paso 6: Listar Escaneos

```http
GET http://localhost:3000/api/scans
Authorization: Bearer {tu_token}
```

---

## Paso 7: Obtener Escaneo por ID

```http
GET http://localhost:3000/api/scans/{scanId}
Authorization: Bearer {tu_token}
```

---

## Requisitos de Imágenes

- **Formato:** JPG o PNG
- **Tamaño máximo:** 10MB por imagen
- **Cantidad:** 2 imágenes (thermal y rgb)
- **Fuentes sugeridas:**
  - Cualquier imagen que tengas en tu computadora
  - [Unsplash - Cattle](https://unsplash.com/s/photos/cattle)
  - [Pexels - Cows](https://www.pexels.com/search/cow/)

---

## Variables de Entorno Necesarias

Asegúrate de tener en tu `.env`:

```env
# Mínimas requeridas
MONGODB_URI=tu_uri_mongodb
JWT_SECRET=tu_secret

# Para subir imágenes
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Para análisis de IA (opcional)
ROBOFLOW_API_KEY=tu_api_key
ROBOFLOW_WORKSPACE=sliit-kuemd
ROBOFLOW_PROJECT=cattle-diseases
ROBOFLOW_VERSION=1
ROBOFLOW_MODEL2_WORKSPACE=thanuja-marasingha-gmbpr
ROBOFLOW_MODEL2_PROJECT=cow-diseases
ROBOFLOW_MODEL2_VERSION=1

# Para WhatsApp (opcional)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

---

## Solución de Problemas

**Error: "MONGODB_URI no está configurada"**
- Verifica que `.env` tenga `MONGODB_URI=tu_uri`

**Error: "Token inválido"**
- Asegúrate de usar el token completo del registro/login
- Verifica que el header sea: `Authorization: Bearer {token}`

**Error: "Se requieren ambas imágenes"**
- Asegúrate de que `thermal` y `rgb` sean tipo **File** (no Text)
- Verifica que hayas seleccionado archivos válidos

**Error: "Cloudinary no está configurado"**
- Configura las variables `CLOUDINARY_*` en tu `.env`

**Las imágenes no se suben:**
- Verifica que `thermal` y `rgb` estén configurados como tipo **File** en Postman
- Revisa que las imágenes sean JPG o PNG válidos

---

## Notas

- Si no tienes `ROBOFLOW_API_KEY`, el escaneo se creará pero sin análisis de IA
- Si no tienes Twilio configurado, las alertas no se enviarán pero el escaneo se guardará
- El backend está listo para recibir imágenes desde Postman, apps móviles o portales web
