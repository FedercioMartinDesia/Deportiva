import twilio from 'twilio';

// Configurar cliente de Twilio
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Número de WhatsApp de Twilio (sandbox o número propio)
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

/**
 * Enviar código de recuperación por WhatsApp
 * @param {string} phoneNumber - Número de teléfono con código de país (ej: +5491123456789)
 * @param {string} code - Código de 6 dígitos
 * @param {string} nombre - Nombre del usuario
 */
export const sendWhatsAppResetCode = async (phoneNumber, code, nombre) => {
  try {
    // Formatear número para WhatsApp
    const formattedNumber = phoneNumber.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:${phoneNumber}`;

    const message = await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: formattedNumber,
      body: `🔐 *Deportiva - Recuperación de contraseña*

Hola ${nombre || 'Usuario'},

Tu código de verificación es:

*${code}*

Este código expira en 15 minutos.

Si no solicitaste este cambio, ignora este mensaje.

_No compartas este código con nadie._`
    });

    console.log('WhatsApp enviado:', message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    throw new Error('No se pudo enviar el mensaje de WhatsApp');
  }
};

/**
 * Enviar confirmación de cambio de contraseña por WhatsApp
 * @param {string} phoneNumber - Número de teléfono con código de país
 * @param {string} nombre - Nombre del usuario
 */
export const sendWhatsAppPasswordChanged = async (phoneNumber, nombre) => {
  try {
    const formattedNumber = phoneNumber.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:${phoneNumber}`;

    const message = await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: formattedNumber,
      body: `✅ *Deportiva*

Hola ${nombre || 'Usuario'},

Tu contraseña ha sido actualizada exitosamente.

Ya puedes iniciar sesión con tu nueva contraseña.

_Si no realizaste este cambio, contacta con soporte inmediatamente._`
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error enviando confirmación WhatsApp:', error);
    // No lanzamos error, es solo confirmación
  }
};

/**
 * Enviar código de verificación para cambio de teléfono
 * @param {string} phoneNumber - Nuevo número de teléfono
 * @param {string} code - Código de 6 dígitos
 * @param {string} nombre - Nombre del usuario
 */
export const sendWhatsAppPhoneChangeCode = async (phoneNumber, code, nombre) => {
  try {
    const formattedNumber = phoneNumber.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:${phoneNumber}`;

    const message = await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: formattedNumber,
      body: `📱 *Deportiva - Verificación de número*

Hola ${nombre || 'Usuario'},

Tu código de verificación para cambiar tu número de teléfono es:

*${code}*

Este código expira en 15 minutos.

Si no solicitaste este cambio, ignora este mensaje.

_No compartas este código con nadie._`
    });

    console.log('WhatsApp de cambio de teléfono enviado:', message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error enviando WhatsApp:', error);
    throw new Error('No se pudo enviar el mensaje de WhatsApp');
  }
};

/**
 * Enviar confirmación de cambio de teléfono al número anterior
 * @param {string} phoneNumber - Número anterior
 * @param {string} newPhone - Nuevo número
 * @param {string} nombre - Nombre del usuario
 */
export const sendWhatsAppPhoneChanged = async (phoneNumber, newPhone, nombre) => {
  try {
    const formattedNumber = phoneNumber.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:${phoneNumber}`;

    const message = await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: formattedNumber,
      body: `📱 *Deportiva*

Hola ${nombre || 'Usuario'},

Tu número de teléfono ha sido actualizado exitosamente.

Nuevo número: ${newPhone}

_Si no realizaste este cambio, contacta con soporte inmediatamente._`
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error enviando confirmación WhatsApp:', error);
    // No lanzamos error, es solo confirmación
  }
};

/**
 * Enviar código de verificación para registro de nuevo usuario
 * @param {string} phoneNumber - Número de teléfono con código de país
 * @param {string} code - Código de 6 dígitos
 * @param {string} nombre - Nombre del usuario
 */
export const sendWhatsAppRegisterCode = async (phoneNumber, code, nombre) => {
  try {
    const formattedNumber = phoneNumber.startsWith('whatsapp:') 
      ? phoneNumber 
      : `whatsapp:${phoneNumber}`;

    const message = await client.messages.create({
      from: TWILIO_WHATSAPP_NUMBER,
      to: formattedNumber,
      body: `⚽ *Deportiva - Verificación de cuenta*

Hola ${nombre || 'Usuario'},

Tu código de verificación para registrarte es:

*${code}*

Este código expira en 15 minutos.

¡Bienvenido a Deportiva! 🏆

_No compartas este código con nadie._`
    });

    console.log('WhatsApp de registro enviado:', message.sid);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Error enviando WhatsApp de registro:', error);
    throw new Error('No se pudo enviar el mensaje de WhatsApp');
  }
};
