require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || 'IndigoOne <notificaciones@indigoone.dev>';

/**
 * Envía un correo genérico vía Resend.
 * @param {string} destinatario - email del destinatario
 * @param {string} asunto
 * @param {string} html - HTML ya renderizado
 */
async function enviarCorreo({ destinatario, asunto, html }) {
  if (!process.env.RESEND_API_KEY) {
    // En desarrollo, si aún no se configura la API key, no truena el flujo:
    // solo lo deja registrado en consola para poder seguir probando.
    console.warn('[email.service] RESEND_API_KEY no configurada. Correo NO enviado.');
    console.warn(`  Para: ${destinatario} | Asunto: ${asunto}`);
    return { simulado: true };
  }

  const { data, error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: destinatario,
    subject: asunto,
    html,
  });

  if (error) {
    const err = new Error(`No se pudo enviar el correo: ${error.message || error}`);
    err.status = 502;
    throw err;
  }

  return data;
}

module.exports = { enviarCorreo };