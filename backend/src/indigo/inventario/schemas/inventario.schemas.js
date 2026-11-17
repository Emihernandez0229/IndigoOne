const { z } = require("zod");

const requerido = (mensaje) => z.string(mensaje).trim().min(1, mensaje);

// Tipos que llevan material (los demás no tienen catálogo de materiales)
const TIPOS_CON_MATERIAL = ["armazones", "micas"];

const datosProducto = {
  codigo: requerido("El código es obligatorio.").max(50, "El código es demasiado largo."),
  modelo: requerido("El modelo es obligatorio.").max(150, "El modelo es demasiado largo."),
  descripcion: z.string().trim().max(1000, "La descripción es demasiado larga.").nullish(),
  color: requerido("El color es obligatorio.").max(50, "El color es demasiado largo."),
  tipo: z.enum(["armazones", "micas", "accesorios", "estuches", "otros"], {
    error: "Selecciona un tipo.",
  }),
  material: z.string().trim().max(100, "El material es demasiado largo.").nullish(),
  genero: z.enum(["hombre", "mujer", "unisex"], { error: "Selecciona un género." }),
  medidas: requerido("Indica las medidas.").max(50, "Las medidas son demasiado largas."),
  stock_disponible: z
    .number({ error: "Indica el stock disponible." })
    .int("El stock debe ser un número entero.")
    .min(0, "Indica el stock disponible.")
    .max(1000000, "El stock es demasiado grande."),
  stock_minimo: z
    .number({ error: "Indica el stock mínimo." })
    .int("El stock mínimo debe ser un número entero.")
    .min(0, "Indica el stock mínimo.")
    .max(1000000, "El stock mínimo es demasiado grande."),
  costo: z
    .number({ error: "Indica el costo." })
    .min(0, "Indica el costo.")
    .max(99999999, "El costo es demasiado grande."),
  // URLs de fotos ya guardadas o imágenes nuevas en base64
//   fotos: z.array(z.string()).max(3, "Máximo 3 fotos.").default([]),
};

const materialSiAplica = {
  fn: (d) => !TIPOS_CON_MATERIAL.includes(d.tipo) || Boolean(d.material?.trim()),
  mensaje: { message: "Selecciona un material.", path: ["material"] },
};

const crear = z
  .object({ ...datosProducto, sucursal_id: z.string().nullish() })
  .refine(materialSiAplica.fn, materialSiAplica.mensaje);

const actualizar = z
  .object({ ...datosProducto })
  .refine(materialSiAplica.fn, materialSiAplica.mensaje);

module.exports = { crear, actualizar };