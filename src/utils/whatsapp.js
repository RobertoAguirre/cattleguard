import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM_NUMBER = process.env.TWILIO_WHATSAPP_FROM;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !FROM_NUMBER) {
  console.warn('⚠️  Variables de Twilio no configuradas completamente');
}

const client = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

/**
 * Envía una alerta por WhatsApp usando Twilio
 * @param {string} phone - Número de teléfono (formato: +1234567890)
 * @param {string} message - Mensaje a enviar
 * @returns {Promise<void>}
 */
export async function sendAlert(phone, message) {
  try {
    if (!client || !FROM_NUMBER) {
      throw new Error('Twilio no está configurado correctamente');
    }

    if (!phone || !message) {
      throw new Error('Teléfono y mensaje son requeridos');
    }

    // Asegurar formato correcto del número
    const formattedPhone = phone.startsWith('whatsapp:') 
      ? phone 
      : `whatsapp:${phone}`;

    await client.messages.create({
      from: FROM_NUMBER,
      to: formattedPhone,
      body: message
    });

    console.log(`Alerta WhatsApp enviada a ${phone}`);
  } catch (error) {
    console.error('Error al enviar WhatsApp:', error.message);
    throw new Error(`Error al enviar alerta: ${error.message}`);
  }
}

