const { z } = require('zod');


const crearSucursalSchema = z.object({
    nombre: z.string()
        .trim()
        .min(1, { error: 'El nombre de la sucursal es obligatorio' })
        .max(150, { error: 'El nombre no puede superar los 150 caracteres' }),
    direccion: z.string()
        .trim()
        .max(255, { error: 'La dirección no puede superar los 255 caracteres' })
        .optional(),
    telefono: z.string()
        .trim()
        .max(20, { error: 'El teléfono no puede superar los 20 caracteres' })
        .optional(),
    gerente_optica_usuario_id: z.uuid({
        error: 'El ID del gerente debe tener un formato UUID válido'
    }).optional(),
    asignarme: z.boolean({
        error: 'El campo asignarme debe ser booleano'
    }).optional()
}).strict()
  .superRefine((data, ctx) => {
      if (data.gerente_optica_usuario_id && data.asignarme) {
          ctx.addIssue({
              code: 'custom',
              path: ['gerente_optica_usuario_id'],
              message: 'No puedes seleccionar un gerente y asignarte como gerente al mismo tiempo'
          });
      }
  });


const actualizarSucursalSchema = z.object({
    nombre: z.string()
        .trim()
        .min(1, { error: 'El nombre de la sucursal es obligatorio' })
        .max(150, { error: 'El nombre no puede superar los 150 caracteres' })
        .optional(),
    direccion: z.string()
        .trim()
        .max(255, { error: 'La dirección no puede superar los 255 caracteres' })
        .optional(),
    telefono: z.string()
        .trim()
        .max(20, { error: 'El teléfono no puede superar los 20 caracteres' })
        .optional()
}).strict();

const cambiarGerenteSchema = z.object({
    optica_usuario_id: z.uuid({
        error: 'El ID del gerente debe tener un formato UUID válido'
    })
}).strict();

module.exports = {
    crearSucursalSchema,
    actualizarSucursalSchema,
    cambiarGerenteSchema
}
