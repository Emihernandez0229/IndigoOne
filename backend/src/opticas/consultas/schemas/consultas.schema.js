const { z } = require('zod');


const ojoSchema = z.object({
    esfera: z.coerce.number().min(-30).max(30).optional(),
    cilindro: z.coerce.number().min(-10).max(10).optional(),
    eje: z.coerce.number().int().min(0).max(180).optional(),
    adicion: z.coerce.number().min(0).max(5).optional(),
});



const crearConsultaBodySchema = z.object({
    sucursalId: z.uuid({ error: 'El id de la sucursal debe tener un formato UUID válido.' }).optional(),
    clienteId: z.uuid({error: 'El ID del cliente debe tener un formato UUID válido' }),

    fechaExamen: z.iso.date({
        error: 'La fecha del examen no es válida (formato esperado: YYYY-MM-DD).'
    }).refine(
        (fecha) => new Date(fecha) <= new Date(), {
            error: 'La fecha del examen no puede ser futura'
        }
    ),

    od: ojoSchema.optional().default({}),
    oi: ojoSchema.optional().default({}),

    dip: z.coerce.number().min(40).max(85).optional(),

    observaciones: z.string().trim().max(2000).optional(),

});

const listarConsultasQuerySchema = z.object({
    sucursalId: z.uuid({ error: 'El ID de la sucursal debe tener un formato UUID válido.' }).optional(),
    clienteId: z.uuid({ error: 'El ID del cliente debe tener un formato UUID válido.' }).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),

    // Al ser DATE (sin hora), no se exige zona horaria aquí.
    desde: z.iso.date({ error: 'desde debe tener formato YYYY-MM-DD.' }).optional(),
    hasta: z.iso.date({ error: 'hasta debe tener formato YYYY-MM-DD.' }).optional(),
}).refine(
    (datos) => !datos.desde || !datos.hasta || datos.desde <= datos.hasta,
    { message: '"desde" debe ser anterior o igual a "hasta".', path: ['desde'] }
);
const obtenerConsultaPorIdParamsSchema = z.object({
    consultaId: z.uuid({ error: 'El ID de la consulta debe tener un formato UUID válido.' }),
});
module.exports = {
    crearConsultaBodySchema,
    listarConsultasQuerySchema,
    obtenerConsultaPorIdParamsSchema
};