import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import multer from 'multer';
import authRoutes from './routes/auth.js';
import scanRoutes from './routes/scans.js';
import animalRoutes from './routes/animals.js';
import webhookRoutes from './routes/webhooks.js';

// .env se carga en server.js desde la raíz del proyecto (gusano/.env)

const app = express();

// CORS: permitir todos los orígenes (MVP en cambio continuo)
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conectar MongoDB
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI no está configurada');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado');
  } catch (error) {
    console.error('❌ Error al conectar MongoDB:', error.message);
    process.exit(1);
  }
};

connectDB();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/scans', scanRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/webhooks', webhookRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Error de Multer
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande (máximo 10MB)'
      });
    }
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 - log para depurar si llegan requests inesperados
app.use((req, res) => {
  console.warn(`⚠️ 404: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    received: `${req.method} ${req.originalUrl}`
  });
});

export default app;

