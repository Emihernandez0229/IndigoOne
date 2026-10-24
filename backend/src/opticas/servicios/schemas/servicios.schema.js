const { z } = require('zod');

const precioValido = (valor) => Math.round(valor * 100) / 100 === valor;


const categoriaId = z.number({ error: 'La categoría es obligatoria' })
    .int({ error: 'La categoría no es válida' })
    .positive({ error: 'La categoría no es válida' });

const crearServicioSchema = z.object({
    nombre: z.string()
        .trim()
        .min(1, { error: 'El nombre del servicio es obligatorio' })
        .max(150, { error: 'El nombre no puede superar los 150 caracteres' }),
    codigo: z.string()
        .trim()
        .toUpperCase()
        .min(1, { error: 'El código no puede estar vacío' })
        .max(50, { error: 'El código no puede superar los 50 caracteres' })
        .nullish(),
    descripcion: z.string()
        .trim()
        .min(1, { error: 'La descripción no puede estar vacía' })
        .max(1000, { error: 'La descripción no puede superar los 1000 caracteres' })
        .nullish(),
    categoriaId,
    precio: z.number({ error: 'El precio debe ser un número' })
        .min(0, { error: 'El precio no puede ser negativo' })
        .max(99999999.99, { error: 'El precio es demasiado alto' })
        .refine(precioValido, { error: 'El precio admite máximo 2 decimales' }),
}).strict();

const listarServiciosQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    activo: z.enum(['true', 'false'], { error: 'activo debe ser true o false' })
        .transform((v) => v === 'true')
        .optional(),
    busqueda: z.string()
        .trim()
        .min(1, { error: 'La búsqueda no puede estar vacía' })
        .max(100, { error: 'La búsqueda no puede superar los 100 caracteres' })
        .optional(),
    categoriaId: z.coerce.number().int().positive().optional(),
}).strict();

const servicioParamsSchema = z.object({
    servicioId: z.uuid({ error: 'El ID del servicio debe tener un formato UUID válido' }),
}).strict();

const actualizarServicioSchema = z.object({
    nombre: crearServicioSchema.shape.nombre.optional(),
    codigo: crearServicioSchema.shape.codigo,
    descripcion: crearServicioSchema.shape.descripcion,
    categoriaId: categoriaId.optional(),
    precio: crearServicioSchema.shape.precio.optional(),
}).strict().refine(
    (datos) => Object.keys(datos).length > 0,
    { error: 'Debes proporcionar al menos un campo para actualizar' }
);

const cambiarEstadoServicioSchema = z.object({
    activo: z.boolean({ error: 'activo debe ser true o false' }),
}).strict();

module.exports = {
    crearServicioSchema,
    listarServiciosQuerySchema,
    servicioParamsSchema,
    actualizarServicioSchema,
    cambiarEstadoServicioSchema,
};