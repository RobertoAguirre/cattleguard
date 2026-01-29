import dotenv from 'dotenv';

// Cargar .env ANTES de importar app (las rutas cargan cloudinary, roboflow, etc.
// y leen process.env al cargar; si dotenv no ha corrido, ven todo undefined)
dotenv.config();

const { default: app } = await import('./app.js');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Error no manejado:', err);
  server.close(() => {
    process.exit(1);
  });
});

