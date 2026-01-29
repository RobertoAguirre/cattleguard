# CattleGuard – App web y móvil

Frontend en Flutter (web + iOS/Android) para probar la API de detección de enfermedades en ganado.

## Requisitos

- Flutter SDK (3.2+)
- Backend API corriendo (por defecto `http://localhost:3000`)

## Configuración

1. **URL de la API**  
   Por defecto usa `http://localhost:3000`. Para producción, compila con:
   ```bash
   flutter build web --dart-define=API_BASE_URL=https://tu-api.com
   ```

2. **Dependencias**
   ```bash
   cd frontend && flutter pub get
   ```

## Ejecutar

- **Web:** `flutter run -d chrome` o `flutter run -d web-server --web-port=8080`
- **Android:** `flutter run -d android` (emulador o dispositivo conectado)

**Probar contra el backend local:**
- En **web**, la app usa por defecto `http://localhost:3000`. Asegúrate de tener el backend corriendo en ese puerto.
- En **Android emulador**, `localhost` del host es `10.0.2.2`. Ejecuta la app con:
  ```bash
  flutter run -d android --dart-define=API_BASE_URL=http://10.0.2.2:3000
  ```
- En **Android dispositivo físico** en la misma red, usa la IP de tu PC, por ejemplo:
  ```bash
  flutter run -d android --dart-define=API_BASE_URL=http://192.168.1.10:3000
  ```

## Build para producción

- **Web:** `flutter build web --release`  
  Salida en `build/web`. Para Vercel: conectar el repo y usar como directorio de salida `frontend/build/web`, y como comando de build (en el proyecto frontend) `flutter pub get && flutter build web --release`.  
  Si Vercel no tiene Flutter, compila en local y despliega la carpeta `build/web` (por ejemplo con Vercel CLI desde `frontend`).

- **Android:** `flutter build apk --release`
- **iOS:** `flutter build ios --release`

## Flujo de la app

1. Login / Registro  
2. Inicio: lista de escaneos (vacía al principio)  
3. Botón “Analizar foto”: elegir imagen RGB (y opcional térmica), subir y ver resultado (summary + indicadores)
