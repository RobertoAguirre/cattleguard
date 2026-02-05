import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido']
  },
  animal: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Animal',
    required: false // Opcional para mantener compatibilidad
  },
  scanType: {
    type: String,
    enum: ['lateral', 'frontal', 'rear', 'head_close', 'legs', 'other'],
    default: 'other'
  },
  images: {
    thermal: {
      type: String, // Cloudinary URL
      required: [true, 'La imagen térmica es requerida']
    },
    rgb: {
      type: String, // Cloudinary URL
      required: [true, 'La imagen RGB es requerida']
    }
  },
  metadata: {
    source: {
      type: String,
      default: 'flir_one_pro'
    },
    location: {
      lat: Number,
      lng: Number
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  aiResults: {
    // Resultados del modelo cattle-diseases (sliit-kuemd)
    model1: {
      detections: [{
        type: Object
      }],
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
      },
      classes: [{
        type: String
      }]
    },
    // Resultados del modelo cow-diseases (thanuja-marasingha-gmbpr)
    model2: {
      detections: [{
        type: Object
      }],
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
      },
      classes: [{
        type: String
      }]
    },
    // Resultados del modelo Wound Object Detection (heridas)
    wound: {
      detections: [{
        type: Object
      }],
      confidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
      },
      classes: [{
        type: String
      }]
    },
    // Resultados combinados
    combined: {
      detections: [{
        type: Object
      }],
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
        model: String // 'model1' o 'model2'
      }],
      wounds: [{
        class: String,
        confidence: Number,
        x: Number,
        y: Number,
        width: Number,
        height: Number
      }],
      woundsCount: {
        type: Number,
        default: 0
      },
      imageDimensions: {
        width: Number,
        height: Number
      },
      // Resumen de indicadores para frontend
      summary: {
        status: String,
        statusLabel: String,
        message: String,
        hasWounds: Boolean,
        woundsCount: Number,
        hasDiseases: Boolean,
        diseasesCount: Number,
        topWound: { class: String, confidence: Number },
        topDiseases: [{ name: String, confidence: Number }],
        // type es palabra reservada en Mongoose: campo "type" con Schema type String
        indicators: [{
          type: { type: String },
          id: String,
          label: String,
          value: String,
          severity: String,
          rawConfidence: Number
        }],
        confidencePercent: String
      }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  alert: {
    sent: {
      type: Boolean,
      default: false
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high']
    }
  }
}, {
  timestamps: true
});

// Índice para búsquedas rápidas por usuario
scanSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Scan', scanSchema);

