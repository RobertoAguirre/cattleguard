/// URL base de la API (backend). Por defecto: backend en Render.
/// Para desarrollo local: flutter run --dart-define=API_BASE_URL=http://localhost:3000
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'https://cattleguard.onrender.com',
);

const String apiPrefix = '/api';
