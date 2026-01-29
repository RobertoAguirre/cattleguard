import express from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import twilio from 'twilio';
import Scan from '../models/Scan.js';
import User from '../models/User.js';
import { uploadImage } from '../utils/cloudinary.js';
import { analyzeWithBothModels } from '../utils/roboflow.js';

const router = express.Router();

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM;

const client = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

const MAX_IMAGES_WHATSAPP = 10;

/** Normaliza teléfono para buscar usuario (quita whatsapp:, espacios, etc.) */
function normalizePhone(from) {
  if (!from || typeof from !== 'string') return '';
  let p = from.replace(/^whatsapp:/i, '').trim();
  p = p.replace(/\D/g, '');
  return p;
}

/** Busca usuario por teléfono (normaliza ambos) */
async function findUserByPhone(from) {
  const normalized = normalizePhone(from);
  if (!normalized) return null;
  const users = await User.find({}).select('_id phone name');
  for (const u of users) {
    const uPhone = (u.phone || '').replace(/\D/g, '');
    if (uPhone && uPhone === normalized) return u;
    if (uPhone && normalized.endsWith(uPhone)) return u;
    if (uPhone && uPhone.endsWith(normalized)) return u;
  }
  return null;
}

/** Descarga un medio de Twilio (requiere Basic auth) */
async function downloadTwilioMedia(mediaUrl) {
  const response = await axios.get(mediaUrl, {
    responseType: 'arraybuffer',
    auth: {
      username: TWILIO_ACCOUNT_SID,
      password: TWILIO_AUTH_TOKEN
    },
    timeout: 30000
  });
  return Buffer.from(response.data);
}

/** Responde al usuario por WhatsApp */
async function replyWhatsApp(to, body) {
  if (!client || !TWILIO_WHATSAPP_FROM) return;
  const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  await client.messages.create({
    from: TWILIO_WHATSAPP_FROM,
    to: toFormatted,
    body
  });
}

/**
 * POST /api/webhooks/whatsapp
 * Webhook que Twilio llama cuando un usuario envía un mensaje (o imagen) por WhatsApp.
 * Si el mensaje incluye imágenes, se descargan, se procesan (Cloudinary + Roboflow) y se crean escaneos.
 * Se responde por WhatsApp con un resumen.
 * No usa auth JWT; Twilio debe validarse por firma si se desea (opcional).
 */
router.post('/whatsapp', express.urlencoded({ extended: true }), async (req, res) => {
  // Responder 200 rápido para que Twilio no reintente
  res.status(200).send('');

  const body = req.body || {};
  const from = body.From;
  const numMedia = parseInt(body.NumMedia, 10) || 0;

  if (numMedia === 0) {
    try {
      await replyWhatsApp(from, 'Envía una o varias fotos del ganado para analizarlas. Responde con imágenes cuando quieras.');
    } catch (e) {
      console.error('Error enviando respuesta WhatsApp (sin media):', e.message);
    }
    return;
  }

  const imageCount = Math.min(numMedia, MAX_IMAGES_WHATSAPP);
  const mediaUrls = [];
  for (let i = 0; i < imageCount; i++) {
    const url = body[`MediaUrl${i}`];
    const contentType = body[`MediaContentType${i}`] || '';
    if (url && contentType.startsWith('image/')) {
      mediaUrls.push(url);
    }
  }

  if (mediaUrls.length === 0) {
    try {
      await replyWhatsApp(from, 'No se detectaron imágenes en el mensaje. Envía fotos (JPEG, PNG) del ganado para analizarlas.');
    } catch (e) {
      console.error('Error enviando respuesta WhatsApp (no images):', e.message);
    }
    return;
  }

  let user = null;
  try {
    user = await findUserByPhone(from);
  } catch (e) {
    console.error('Error buscando usuario por teléfono:', e.message);
  }

  if (!user) {
    try {
      await replyWhatsApp(from, 'No estás registrado en el sistema. Regístrate con el mismo número de WhatsApp para poder analizar imágenes.');
    } catch (e) {
      console.error('Error enviando respuesta WhatsApp (no user):', e.message);
    }
    return;
  }

  const defaultAiResults = () => ({
    model1: { detections: [], confidence: 0, classes: [] },
    model2: { detections: [], confidence: 0, classes: [] },
    wound: { detections: [], confidence: 0, classes: [] },
    combined: {
      detections: [],
      classification: 'healthy',
      confidence: 0,
      diseases: [],
      wounds: [],
      woundsCount: 0,
      summary: {
        status: 'healthy',
        statusLabel: 'Sano',
        message: 'No se detectaron enfermedades ni heridas.',
        hasWounds: false,
        woundsCount: 0,
        hasDiseases: false,
        diseasesCount: 0,
        topWound: null,
        topDiseases: [],
        indicators: [],
        confidencePercent: '0%'
      }
    }
  });

  const results = [];
  const errors = [];

  for (let i = 0; i < mediaUrls.length; i++) {
    try {
      const buffer = await downloadTwilioMedia(mediaUrls[i]);
      const [rgbUrl, thermalUrl] = await Promise.all([
        uploadImage(buffer, 'scans/rgb'),
        uploadImage(buffer, 'scans/thermal')
      ]);
      let aiResults = defaultAiResults();
      try {
        const analysis = await analyzeWithBothModels(rgbUrl);
        aiResults = analysis;
      } catch (err) {
        console.error(`WhatsApp análisis imagen ${i + 1}:`, err.message);
      }
      const scan = await Scan.create({
        user: user._id,
        scanType: 'other',
        images: { thermal: thermalUrl, rgb: rgbUrl },
        metadata: {
          source: 'whatsapp',
          timestamp: new Date(),
          from
        },
        aiResults,
        status: 'completed'
      });
      results.push({
        index: i + 1,
        classification: aiResults.combined?.classification || 'healthy',
        message: aiResults.combined?.summary?.message || aiResults.combined?.classification
      });
    } catch (err) {
      console.error(`WhatsApp error procesando imagen ${i + 1}:`, err.message);
      errors.push({ index: i + 1, error: err.message });
    }
  }

  const critical = results.filter(r => r.classification === 'critical').length;
  const suspicious = results.filter(r => r.classification === 'suspicious').length;
  const healthy = results.filter(r => r.classification === 'healthy').length;

  let summary = `Procesadas ${results.length} imagen(es).`;
  if (critical > 0) summary += ` ${critical} crítica(s).`;
  if (suspicious > 0) summary += ` ${suspicious} sospechosa(s).`;
  if (healthy > 0) summary += ` ${healthy} sana(s).`;
  if (errors.length > 0) summary += ` (${errors.length} error(es)).`;

  try {
    await replyWhatsApp(from, summary);
  } catch (e) {
    console.error('Error enviando resumen por WhatsApp:', e.message);
  }
});

export default router;
