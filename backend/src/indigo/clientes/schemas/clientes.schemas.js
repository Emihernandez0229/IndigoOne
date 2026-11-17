const { z } = require("zod");

const MSG = "Este campo es obligatorio.";
const MSG_ASIGNAR = "Faltan datos requeridos (sucursal_id e indigo_sucursal_id)";

const requerido = (mensaje) => z.string(mensaje).trim().min(1, mensaje);

// Es el usuario y la contraseña inicial del dueño de la óptica
const codigo = z
  .string(MSG)
  .trim()
  .regex(
    /^[A-Za-z0-9._-]{3,20}$/,
    "El código debe tener de 3 a 20 caracteres (letras, números, punto, guion o guion bajo)."
  );

const rfc = z
  .string(MSG)
  .trim()
  .min(12, "El RFC debe tener 12 o 13 caracteres.")
  .max(13, "El RFC debe tener 12 o 13 caracteres.");

// Datos que se pueden editar. País y estado vienen de la sucursal de Indigo.
const datosCliente = {
  razon_social: requerido(MSG).max(200, "El nombre de la óptica es demasiado largo."),
  rfc,
  municipio: requerido(MSG),
  direccion: requerido(MSG).max(255, "La dirección es demasiado larga."),
  codigo_postal: z
    .string(MSG)
    .trim()
    .regex(/^\d{5}$/, "El código postal debe tener exactamente 5 dígitos."),
};

const crear = z.object({
  codigo,
  ...datosCliente,
  sucursal_cliente_nombre: requerido(MSG).max(150, "El nombre de la sucursal es demasiado largo."),
  // Solo lo usa el super usuario; gerente y subgerente usan su sucursal del token
  indigo_sucursal_id: z.string().nullish(),
});

const actualizar = z.object({ ...datosCliente });

const asignarProveedor = z.object({
  sucursal_id: requerido(MSG_ASIGNAR),
  indigo_sucursal_id: requerido(MSG_ASIGNAR),
});

module.exports = { crear, actualizar, asignarProveedor };