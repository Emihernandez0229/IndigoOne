const { z } = require('zod');

const uuid = (msg) => z.uuid({ error: msg });

const boolQuery = (msg) =>
    z.enum(['true', 'false'], { error: msg }).transform((v) => v === 'true').optional();

const filtroBase = {
    sucursalId: uuid('El ID de la sucursal debe tener un formato UUID válido').optional(),
    todas: boolQuery('todas debe ser true o false'),
    periodo: z.enum(['day', 'week', 'month', 'year'], { error: 'periodo inválido' }).default('month'),
    desde: z.iso.datetime({ offset: true, error: 'desde debe ser ISO 8601 con zona horaria.' }).optional(),
    hasta: z.iso.datetime({ offset: true, error: 'hasta debe ser ISO 8601 con zona horaria.' }).optional(),
};

const rangoValido = [
    (d) => !d.desde || !d.hasta || new Date(d.desde) < new Date(d.hasta),
    { message: '"desde" debe ser anterior a "hasta".', path: ['desde'] },
];

const reporteResumenQuerySchema = z.object(filtroBase).strict().refine(...rangoValido);

const reporteVentasQuerySchema = z.object({
    ...filtroBase,
    agrupar: z.enum(['sucursal', 'empleado', 'producto', 'servicio', 'dia'],
        { error: 'agrupar inválido' }).optional(),
    vendedorId: uuid('El ID del empleado debe tener un formato UUID válido').optional(),
    productoId: uuid('El ID del producto debe tener un formato UUID válido').optional(),
    servicioId: uuid('El ID del servicio debe tener un formato UUID válido').optional(),
    // Por día se ignora el límite (ver ventasDesglose)
    limit: z.coerce.number().int().min(1).max(1000).default(1000),
}).strict().refine(...rangoValido);

const reporteServiciosQuerySchema = z.object({
    ...filtroBase,
    servicioId: uuid('El ID del servicio debe tener un formato UUID válido').optional(),
    agrupar: z.enum(['dia', 'sucursal'], { error: 'agrupar inválido' }).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(10),
}).strict().refine(...rangoValido);

const reporteClientesQuerySchema = z.object({
    ...filtroBase,
    agrupar: z.enum(['sucursal'], { error: 'agrupar inválido' }).optional(),
}).strict().refine(...rangoValido);

const reporteClientesActividadQuerySchema = z.object({
    ...filtroBase,
    busqueda: z.string().trim().min(1).max(100).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
}).strict().refine(...rangoValido);

const reporteCitasQuerySchema = z.object({
    ...filtroBase,
    estado: z.enum(['programada', 'confirmada', 'atendida', 'cancelada', 'no_asistio'],
        { error: 'estado inválido' }).optional(),
    agrupar: z.enum(['dia', 'sucursal', 'estado'], { error: 'agrupar inválido' }).optional(),
}).strict().refine(...rangoValido);

const reporteInventarioQuerySchema = z.object({
    sucursalId: filtroBase.sucursalId,
    todas: filtroBase.todas,
    productoId: uuid('El ID del producto debe tener un formato UUID válido').optional(),
    busqueda: z.string().trim().min(1).max(100).optional(),
    bajoMinimo: boolQuery('bajoMinimo debe ser true o false'),
    agotados: boolQuery('agotados debe ser true o false'),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
}).strict();

const reporteMovimientosQuerySchema = z.object({
    ...filtroBase,
    productoId: uuid('El ID del producto debe tener un formato UUID válido').optional(),
    tipo: z.enum(['entrada', 'salida', 'ajuste', 'venta', 'devolucion'],
        { error: 'tipo inválido' }).optional(),
    agrupar: z.enum(['tipo', 'producto', 'dia'], { error: 'agrupar inválido' }).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
}).strict().refine(...rangoValido);


const reporteServiciosDetalleQuerySchema = z.object({
    ...filtroBase,
    servicioId: uuid('El ID del servicio debe tener un formato UUID válido').optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
}).strict().refine(...rangoValido);


module.exports = {
    reporteResumenQuerySchema,
    reporteVentasQuerySchema,
    reporteServiciosQuerySchema,
    reporteClientesQuerySchema,
    reporteClientesActividadQuerySchema,
    reporteCitasQuerySchema,
    reporteInventarioQuerySchema,
    reporteMovimientosQuerySchema,
    reporteServiciosDetalleQuerySchema
};