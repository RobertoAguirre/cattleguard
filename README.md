# GUSANO – Detección de enfermedades en ganado

Proyecto con **backend** (Node.js + Express) y **frontend** (Flutter) en carpetas separadas.

## Estructura

- **backend/** – API REST (MongoDB, JWT, Cloudinary, Roboflow, Twilio)
- **frontend/** – App Flutter (web + Android)
- **.env** – Variables de entorno (en la raíz; el backend las carga desde aquí)

## Cómo ejecutar

**Backend** (desde la carpeta backend):

```bash
cd backend
npm install
npm run dev
```

El servidor usa el `.env` de la raíz del proyecto (`gusano/.env`). Por defecto escucha en `http://localhost:3000`.

**Frontend** (en otra terminal):

```bash
cd frontend
flutter pub get
flutter run -d chrome
```

Para Android emulador: `flutter run -d android --dart-define=API_BASE_URL=http://10.0.2.2:3000`

## Documentación

- Backend: `backend/README.md`
- Frontend: `frontend/README.md`
