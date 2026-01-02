import mongoose from 'mongoose';

const scanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El usuario es requerido']
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
      }]
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

