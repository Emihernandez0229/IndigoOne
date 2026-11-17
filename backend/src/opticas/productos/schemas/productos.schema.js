const { z } = require('zod');

const precioValido = (valor) => Math.round(valor * 100) / 100 === valor;

const categoriaId = z.number({ error: 'La categoría es obligatoria' })
    .int({ error: 'La categoría no es válida' })
    .positive({ error: 'La categoría no es válida' });

const crearProductoSchema = z.object({
    nombre: z.string()
        .trim()
        .min(1, { error: 'El nombre del producto es obligatorio' })
        .max(150, { error: 'El nombre no puede superar los 150 caracteres' }),
    sku: z.string()
        .trim()
        .toUpperCase()
        .min(1, { error: 'El SKU no puede estar vacío' })
        .max(50, { error: 'El SKU no puede superar los 50 caracteres' })
        .nullish(),
    marca: z.string()
        .trim()
        .min(1, { error: 'La marca no puede estar vacía' })
        .max(100, { error: 'La marca no puede superar los 100 caracteres' })
        .nullish(),
    descripcion: z.string()
        .trim()
        .min(1, { error: 'La descripción no puede estar vacía' })
        .max(1000, { error: 'La descripción no puede superar los 1000 caracteres' })
        .nullish(),
    categoriaId,
    precioVenta: z.number({ error: 'El precio de venta debe ser un número' })
        .min(0, { error: 'El precio de venta no puede ser negativo' })
        .max(99999999.99, { error: 'El precio de venta es demasiado alto' })
        .refine(precioValido, { error: 'El precio admite máximo 2 decimales' }),
    stockMinimo: z.number({ error: 'El stock mínimo debe ser un número' })
        .int({ error: 'El stock mínimo debe ser un entero' })
        .min(0, { error: 'El stock mínimo no puede ser negativo' })
        .max(1000000)
        .optional(),
}).strict();

const listarProductosQuerySchema = z.object({
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
    marca: z.string()
        .trim()
        .min(1, { error: 'La marca no puede estar vacía' })
        .max(100, { error: 'La marca no puede superar los 100 caracteres' })
        .optional(),
    categoriaId: z.coerce.number().int().positive().optional(),
}).strict();


const productoParamsSchema = z.object({
    productoId: z.uuid({ error: 'El ID del producto debe tener un formato UUID válido' }),
}).strict();

const actualizarProductoSchema = z.object({
    nombre: crearProductoSchema.shape.nombre.optional(),
    sku: crearProductoSchema.shape.sku,
    marca: crearProductoSchema.shape.marca,
    descripcion: crearProductoSchema.shape.descripcion,
    categoriaId: categoriaId.optional(),
    precioVenta: crearProductoSchema.shape.precioVenta.optional(),
    stockMinimo: crearProductoSchema.shape.stockMinimo,
}).strict().refine(
    (datos) => Object.keys(datos).length > 0,
    { error: 'Debes proporcionar al menos un campo para actualizar' }
);


const cambiarEstadoProductoSchema = z.object({
    activo: z.boolean({ error: 'activo debe ser true o false' }),
}).strict();


module.exports = { 
    crearProductoSchema,
    listarProductosQuerySchema,
    productoParamsSchema,
    actualizarProductoSchema,
    cambiarEstadoProductoSchema
};