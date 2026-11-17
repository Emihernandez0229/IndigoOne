const { z } = require("zod");

const requerido = (mensaje) => z.string(mensaje).trim().min(1, mensaje);

const crear = z.object({
  cliente_id: z.uuid("Selecciona un cliente."),
  vendedor_id: z.uuid("Selecciona un vendedor."),
  tipo_servicio: requerido("Selecciona el tipo de servicio.").max(50, "El tipo de servicio es demasiado largo."),
  tipo_bisel: requerido("Selecciona el tipo de bisel.").max(50, "El tipo de bisel es demasiado largo."),
  cantidad: z
    .number("La cantidad debe ser al menos 1.")
    .int("La cantidad debe ser un número entero.")
    .min(1, "La cantidad debe ser al menos 1.")
    .max(999, "La cantidad es demasiado grande."),
  urgente: z.boolean().optional(),
  fecha_entrega: z
    .string("Selecciona la fecha y hora de entrega.")
    .refine((valor) => !Number.isNaN(Date.parse(valor)), "La fecha y hora de entrega no son válidas."),
});

const merma = z.object({
  motivo: requerido("Explica qué sucedió.").max(1000, "La explicación es demasiado larga."),
});

const detalle = z.object({
  texto: requerido("Escribe el detalle.").max(500, "El detalle es demasiado largo."),
});

module.exports = { crear, merma, detalle };