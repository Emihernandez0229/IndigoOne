const { z } = require('zod');

const dosDecimales = (v) => Math.round(v * 100) / 100 === v;

const itemSchema = z.object({
    productoId: z.uuid({ error: 'El ID del artículo debe tener un formato UUID válido' }),
    itemType: z.enum(['producto', 'servicio'], { error: 'itemType inválido' }).default('producto'),
    cantidad: z.number({ error: 'La cantidad debe ser un número' })
        .int({ error: 'La cantidad debe ser un entero' })
        .min(1, { error: 'La cantidad debe ser mayor a 0' })
        .max(10000, { error: 'La cantidad es demasiado alta' }),
});   // sin .strict(): precioUnitario y demás se descartan

const crearVentaSchema = z.object({
    sucursalId: z.uuid({ error: 'El ID de la sucursal debe tener un formato UUID válido' }).optional(),
    pacienteId: z.uuid({ error: 'El ID del paciente debe tener un formato UUID válido' }).nullish(),
    tipoTrabajo: z.enum(['venta_directa', 'trabajo_interno', 'orden_laboratorio'],
        { error: 'tipoTrabajo inválido' }).default('venta_directa'),
    prioridad: z.enum(['normal', 'urgente'], { error: 'prioridad inválida' }).default('normal'),
    metodoPago: z.enum(['efectivo'], { error: 'Por ahora solo se acepta efectivo' }).default('efectivo'),
    tasaIva: z.number({ error: 'tasaIva debe ser un número' })
        .min(0, { error: 'tasaIva no puede ser negativa' })
        .max(100, { error: 'tasaIva no puede superar 100' }),
    montoPagado: z.number({ error: 'montoPagado debe ser un número' })
        .min(0, { error: 'montoPagado no puede ser negativo' })
        .max(99999999.99)
        .refine(dosDecimales, { error: 'montoPagado admite máximo 2 decimales' })
        .default(0),
    items: z.array(itemSchema)
        .min(1, { error: 'Agrega al menos un artículo' })
        .max(50, { error: 'No puedes agregar más de 50 artículos' })
        .refine(
            (items) => new Set(items.map((i) => `${i.itemType}:${i.productoId}`)).size === items.length,
            { error: 'Un artículo está repetido: súmalo en la cantidad' }
        ),
}).superRefine((d, ctx) => {
    if (d.tipoTrabajo !== 'venta_directa' && !d.pacienteId) {
        ctx.addIssue({ code: 'custom', path: ['pacienteId'], message: 'El paciente es obligatorio en trabajo interno y orden de laboratorio' });
    }
});

const ventaParamsSchema = z.object({
    ventaId: z.uuid({ error: 'El ID de la venta debe tener un formato UUID válido' }),
}).strict();

const listarVentasQuerySchema = z.object({
    sucursalId: z.uuid({ error: 'El ID de la sucursal debe tener un formato UUID válido' }).optional(),
    pacienteId: z.uuid({ error: 'El ID del paciente debe tener un formato UUID válido' }).optional(),
    estado: z.enum(['pendiente', 'en_proceso', 'completada', 'cancelada'], { error: 'estado inválido' }).optional(),
    tipoTrabajo: z.enum(['venta_directa', 'trabajo_interno', 'orden_laboratorio']).optional(),
    busqueda: z.string().trim().min(1).max(30).optional(),   // folio
    desde: z.iso.datetime({ offset: true, error: 'desde debe ser ISO 8601 con zona horaria.' }).optional(),
    hasta: z.iso.datetime({ offset: true, error: 'hasta debe ser ISO 8601 con zona horaria.' }).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
}).strict().refine(
    (d) => !d.desde || !d.hasta || new Date(d.desde) < new Date(d.hasta),
    { message: '"desde" debe ser anterior a "hasta".', path: ['desde'] }
);

const liquidarVentaSchema = z.object({
    monto: z.number({ error: 'El monto debe ser un número' })
        .positive({ error: 'El monto debe ser mayor a 0' })
        .max(99999999.99)
        .refine(dosDecimales, { error: 'El monto admite máximo 2 decimales' }),
});

const cambiarEstadoVentaSchema = z.object({
    estado: z.enum(['en_proceso', 'completada'], { error: 'estado inválido' }),
}).strict();

module.exports = {
    crearVentaSchema, ventaParamsSchema, listarVentasQuerySchema,
    liquidarVentaSchema, cambiarEstadoVentaSchema,
};