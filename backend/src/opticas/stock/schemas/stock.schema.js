const { z } = require('zod');

const sucursalIdOpcional = z.uuid({
    error: 'El ID de la sucursal debe tener un formato UUID válido',
}).optional();

const listarStockQuerySchema = z.object({
    sucursalId: sucursalIdOpcional,
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    busqueda: z.string().trim().min(1).max(100).optional(),
    bajoMinimo: z.enum(['true', 'false'], { error: 'bajoMinimo debe ser true o false' })
        .transform((v) => v === 'true')
        .optional(),
}).strict();

const stockParamsSchema = z.object({
    productoId: z.uuid({ error: 'El ID del producto debe tener un formato UUID válido' }),
}).strict();

const ajustarStockSchema = z.object({
    sucursalId: sucursalIdOpcional,
    tipo: z.enum(['entrada', 'salida', 'ajuste'], { error: 'tipo inválido' }),
    cantidad: z.number({ error: 'La cantidad debe ser un número' })
        .int({ error: 'La cantidad debe ser un entero' })
        .min(0, { error: 'La cantidad no puede ser negativa' })
        .max(1000000, { error: 'La cantidad es demasiado alta' }),
    motivo: z.string()
        .trim()
        .min(1, { error: 'El motivo no puede estar vacío' })
        .max(200, { error: 'El motivo no puede superar los 200 caracteres' })
        .optional(),
}).strict().superRefine((d, ctx) => {
    if (d.tipo !== 'ajuste' && d.cantidad < 1) {
        ctx.addIssue({ code: 'custom', path: ['cantidad'], message: 'La cantidad debe ser mayor a 0' });
    }
    if (d.tipo !== 'entrada' && !d.motivo) {
        ctx.addIssue({ code: 'custom', path: ['motivo'], message: 'El motivo es obligatorio en salidas y ajustes' });
    }
});

const listarMovimientosQuerySchema = z.object({
    sucursalId: sucursalIdOpcional,
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
}).strict();

module.exports = {
    listarStockQuerySchema,
    stockParamsSchema,
    ajustarStockSchema,
    listarMovimientosQuerySchema,
};