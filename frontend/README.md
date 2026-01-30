# CattleGuard – App web y móvil

Frontend en Flutter (web + iOS/Android) para probar la API de detección de enfermedades en ganado.

## Requisitos

- Flutter SDK (3.2+)
- Backend API corriendo (por defecto `http://localhost:3000`)

## Configuración

1. **URL de la API**  
   Por defecto usa el backend en Render: `https://cattleguard.onrender.com`.  
   Para desarrollo local con backend en tu máquina:
   ```bash
   flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000
   ```

2. **Dependencias**
   ```bash
   cd frontend && flutter pub get
   ```

## Ejecutar

- **Web:** `flutter run -d chrome` o `flutter run -d web-server --web-port=8080`
- **Android:** `flutter run -d android` (emulador o dispositivo conectado)

**Probar contra el backend local** (opcional):
- Por defecto la app usa `https://cattleguard.onrender.com`. Para apuntar a tu backend local:
  ```bash
  flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:3000
  ```
- **Android emulador** con backend local: `flutter run -d android --dart-define=API_BASE_URL=http://10.0.2.2:3000`
- **Android dispositivo** en la misma red: `flutter run -d android --dart-define=API_BASE_URL=http://TU_IP:3000`

## Build para producción

- **Web:** `flutter build web --release`  
  Salida en `frontend/build/web`. Compila en local y publica esa carpeta como sitio estático (p. ej. en Render).

- **Android:** `flutter build apk --release`
- **iOS:** `flutter build ios --release`

## Flujo de la app

1. Login / Registro  
2. Inicio: lista de escaneos (vacía al principio)  
3. Botón “Analizar foto”: elegir imagen RGB (y opcional térmica), subir y ver resultado (summary + indicadores)
