/// URL base de la API (backend). Cambiar en producción.
/// Para desarrollo local: http://localhost:3000
/// Para Vercel/producción: https://tu-backend.vercel.app o tu dominio
const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:3000',
);

const String apiPrefix = '/api';
