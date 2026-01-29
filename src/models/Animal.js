import mongoose from 'mongoose';

const animalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido']
  },
  name: {
    type: String,
    trim: true
  },
  tag: {
    type: String, // Número de arete o identificación
    trim: true
  },
  breed: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 0
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    default: 'unknown'
  },
  location: {
    lat: Number,
    lng: Number
  },
  scans: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scan'
  }],
  // Diagnóstico consolidado de todos los escaneos
  consolidatedDiagnosis: {
    classification: {
      type: String,
      enum: ['healthy', 'suspicious', 'critical'],
      default: 'healthy'
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0
    },
    diseases: [{
      name: String,
      confidence: Number,
      detectedIn: Number, // Cantidad de escaneos donde se detectó
      totalScans: Number
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índice para búsquedas rápidas
animalSchema.index({ user: 1, createdAt: -1 });
animalSchema.index({ tag: 1, user: 1 }); // Búsqueda por arete

export default mongoose.model('Animal', animalSchema);

