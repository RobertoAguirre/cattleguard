# Ejemplos de Comandos curl para la API

## Configuración Base

```bash
API_URL="http://localhost:3000/api"
BASE_URL="http://localhost:3000"
```

---

## 1. Health Check

```bash
curl -X GET http://localhost:3000/health
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Servidor funcionando correctamente",
  "timestamp": "2026-01-02T20:16:31.294Z"
}
```

---

## 2. Registrar Usuario

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    ...
  }
}
```

**⚠️ IMPORTANTE:** Guarda el `token` para los siguientes pasos.

---

## 3. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan@example.com",
    "password": "password123"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

---

## 4. Obtener Usuario Actual

```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer {tu_token_aqui}"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    ...
  }
}
```

---

## 5. Crear Escaneo (con imágenes)

```bash
curl -X POST http://localhost:3000/api/scans \
  -H "Authorization: Bearer {tu_token_aqui}" \
  -F "thermal=@/ruta/a/tu/imagen1.jpg" \
  -F "rgb=@/ruta/a/tu/imagen2.jpg" \
  -F "lat=19.4326" \
  -F "lng=-99.1332" \
  -F "source=flir_one_pro"
```

**Notas:**
- Reemplaza `{tu_token_aqui}` con el token obtenido en registro/login
- Reemplaza las rutas de imágenes con archivos reales
- `lat`, `lng` y `source` son opcionales

**Respuesta esperada:**
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

## 6. Listar Escaneos

```bash
curl -X GET http://localhost:3000/api/scans \
  -H "Authorization: Bearer {tu_token_aqui}"
```

**Respuesta esperada:**
```json
{
  "success": true,
  "count": 1,
  "scans": [
    {
      "_id": "...",
      "status": "completed",
      ...
    }
  ]
}
```

---

## 7. Obtener Escaneo por ID

```bash
curl -X GET http://localhost:3000/api/scans/{scanId} \
  -H "Authorization: Bearer {tu_token_aqui}"
```

**Reemplaza `{scanId}` con el ID del escaneo obtenido en el paso 5 o 6.**

**Respuesta esperada:**
```json
{
  "success": true,
  "scan": {
    "_id": "...",
    "images": { ... },
    "aiResults": { ... },
    ...
  }
}
```

---

## Script Completo de Prueba

Puedes usar el script automatizado:

```bash
bash scripts/test-curl.sh
```

O ejecutar manualmente cada comando.

---

## Solución de Problemas

**Error: "Connection refused"**
- Verifica que el servidor esté corriendo: `npm run dev`

**Error: "Token inválido"**
- Asegúrate de usar el token completo
- Verifica que el header sea: `Authorization: Bearer {token}`

**Error: "Cloudinary no está configurado"**
- Configura las variables `CLOUDINARY_*` en tu `.env`
- El escaneo no se creará sin Cloudinary configurado

**Error: "Se requieren ambas imágenes"**
- Asegúrate de enviar `thermal` y `rgb` como archivos
- Usa `-F` para form-data, no `-d`

