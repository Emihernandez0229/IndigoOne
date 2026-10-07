const { z } = require("zod");

const gerenteId = z.string().nullish();

// Crear y editar usan el mismo body
const sucursal = z.object({
  nombre: z
    .string("El nombre de la sucursal es requerido")
    .trim()
    .min(1, "El nombre de la sucursal es requerido"),
  direccion: z.string().nullish(),
  telefono: z.string().nullish(),
  gerente_indigo_usuario_id: gerenteId,
  nuevo_gerente_nombre: z
    .string()
    .trim()
    .min(1, "El nombre del nuevo gerente es requerido")
    .nullish(),
});

const asignarGerente = z.object({
  gerente_indigo_usuario_id: gerenteId,
  nuevo_gerente_nombre: z.string().nullish(),
});

module.exports = { sucursal, asignarGerente };