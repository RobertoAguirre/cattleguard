# Backend - Sistema de Detección de Enfermedades en Ganado

Backend minimalista en Node.js + Express para sistema de detección de enfermedades en ganado usando IA.

## Stack

- **Express** - Framework web
- **MongoDB + Mongoose** - Base de datos
- **JWT** - Autenticación
- **Cloudinary** - Almacenamiento de imágenes
- **Roboflow API** - Análisis de imágenes con IA (2 modelos: cattle-diseases y cow-diseases)
- **Twilio WhatsApp** - Alertas

## Instalación

```bash
npm install
```

## Configuración

1. Copia `.env.example` a `.env`
2. Completa las variables de entorno:

```env
PORT=3000
MONGODB_URI=tu_uri_de_mongodb
JWT_SECRET=sentinelgan_jwt_secret_2024
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# Roboflow API Key (compartida para ambos modelos)
ROBOFLOW_API_KEY=tu_api_key

# Modelo 1: cattle-diseases (sliit-kuemd)
ROBOFLOW_WORKSPACE=sliit-kuemd
ROBOFLOW_PROJECT=cattle-diseases
ROBOFLOW_VERSION=1

# Modelo 2: cow-diseases (thanuja-marasingha-gmbpr)
ROBOFLOW_MODEL2_WORKSPACE=thanuja-marasingha-gmbpr
ROBOFLOW_MODEL2_PROJECT=cow-diseases
ROBOFLOW_MODEL2_VERSION=1

# Twilio WhatsApp
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

## Ejecutar

```bash
# Desarrollo
npm run dev

# Producción
npm start

# Probar API (sin cámara)
npm run test:api
```

## Endpoints

### Autenticación

- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual (protegido)

### Escaneos

- `POST /api/scans` - Crear escaneo (protegido, multipart/form-data)
  - Archivos: `thermal` (imagen), `rgb` (imagen)
  - Body opcional: `lat`, `lng`, `source`
  - Analiza la imagen RGB con ambos modelos de Roboflow y combina resultados
- `GET /api/scans` - Listar escaneos del usuario (protegido)
- `GET /api/scans/:id` - Obtener escaneo específico (protegido)

### Health Check

- `GET /health` - Estado del servidor

## Modelos de IA

El sistema utiliza **2 modelos de Roboflow** para análisis dual:

1. **cattle-diseases** (sliit-kuemd) - Detección de enfermedades en ganado
2. **cow-diseases** (thanuja-marasingha-gmbpr) - Detección de enfermedades en vacas

Ambos modelos analizan la imagen RGB capturada por la cámara FLIR One Pro. Los resultados se combinan para:
- Mayor precisión en la detección
- Identificación de múltiples enfermedades
- Clasificación final basada en la confianza combinada

### Flujo de análisis

1. Se capturan imágenes RGB e infrarrojas con FLIR One Pro
2. La imagen RGB se analiza con ambos modelos en paralelo
3. Los resultados se combinan y se determina la clasificación:
   - `healthy`: confianza ≤ 0.7
   - `suspicious`: confianza > 0.7 y ≤ 0.9
   - `critical`: confianza > 0.9
4. Si es `suspicious` o `critical`, se envía alerta por WhatsApp

## Estructura

```
src/
├── models/
│   ├── User.js
│   └── Scan.js
├── routes/
│   ├── auth.js
│   └── scans.js
├── middleware/
│   └── auth.js
├── utils/
│   ├── cloudinary.js
│   ├── roboflow.js
│   └── whatsapp.js
├── app.js
└── server.js
```

