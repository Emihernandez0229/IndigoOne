const { z } = require("zod");

const nombre = z
  .string("El nombre de la sucursal es requerido")
  .trim()
  .min(1, "El nombre de la sucursal es requerido");

const requerido = (mensaje) => z.string(mensaje).trim().min(1, mensaje);

// Responsable: uno existente o uno nuevo, nunca los dos
const gerente = {
  gerente_indigo_usuario_id: z.string().nullish(),
  nuevo_gerente_nombre: z
    .string()
    .trim()
    .min(1, "El nombre del nuevo gerente es requerido")
    .nullish(),
};

const noAmbos = {
  fn: (d) => !(d.gerente_indigo_usuario_id && d.nuevo_gerente_nombre),
  mensaje: {
    message: "No puedes seleccionar un gerente existente y crear uno nuevo al mismo tiempo.",
    path: ["gerente_indigo_usuario_id"],
  },
};

const alMenosUno = {
  fn: (d) => Boolean(d.gerente_indigo_usuario_id || d.nuevo_gerente_nombre),
  mensaje: {
    message: "Debes seleccionar o crear un gerente.",
    path: ["gerente_indigo_usuario_id"],
  },
};

const ubicacion = {
  pais: requerido("Selecciona un país."),
  estado: requerido("Selecciona un estado."),
  municipio: requerido("Selecciona un municipio."),
};

// Alta: el responsable es obligatorio
const crear = z
  .object({ nombre, ...ubicacion, ...gerente })
  .refine(noAmbos.fn, noAmbos.mensaje)
  .refine(alMenosUno.fn, alMenosUno.mensaje);

// Edición del dueño: el responsable es opcional (si no se manda, no se toca)
const actualizar = z
  .object({ nombre, ...ubicacion, ...gerente })
  .refine(noAmbos.fn, noAmbos.mensaje);

const asignarGerente = z
  .object({ ...gerente })
  .refine(noAmbos.fn, noAmbos.mensaje)
  .refine(alMenosUno.fn, alMenosUno.mensaje);

// Edición del gerente/subgerente
const contacto = z.object({
  direccion: z
    .string("La dirección es obligatoria.")
    .trim()
    .min(1, "La dirección es obligatoria.")
    .max(255, "La dirección no puede superar los 255 caracteres."),
  telefono: z
    .string("Escribe un teléfono válido de 10 dígitos.")
    .trim()
    .regex(/^\d{10}$/, "Escribe un teléfono válido de 10 dígitos."),
});

module.exports = { crear, actualizar, asignarGerente, contacto };