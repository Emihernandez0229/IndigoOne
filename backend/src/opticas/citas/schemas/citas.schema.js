const { z } = require('zod');

const estadosCita = [
    'programada',
    'confirmada',
    'atendida',
    'cancelada',
    'no_asistio'
];





const crearCitaSchema = z.object({
    clienteId: z.uuid({
        error: 'El ID de la sucursal debe tener un formato UUID válido'}
    ),
    fechaHora: z.coerce
        .date({ invalid_type_error: 'La fecha y hora no son válidas.' })
        .refine((fecha) => fecha.getTime() > Date.now(), {
            message: 'La fecha y hora de la cita deben ser futuras.',
        })
        // Normaliza sin mutar: elimina segundos y milisegundos
        .transform((fecha) => {
            const normalizada = new Date(fecha);
            normalizada.setSeconds(0, 0);
            return normalizada;
        }),
    motivo: z.string().trim().min(1, 'El motivo es obligatorio.').max(255),
});


const listarCitasSchema = z.object({
    sucursalId: z.uuid({error: 'El ID de la sucursal debe de tener un formato UUID válido.'}).optional(),
    clienteId: z.uuid({error: 'El ID del cliente debe tener un formato UUID válido.'}).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
    estado:z.string()
            .transform(
                (valor) => valor.split(',').map(
                    (e) => e.trim()
                )
            )
            .pipe(z.array(z.enum(estadosCita,{ error: 'Estado inválido'})))
            .optional(),

    desde: z.iso.datetime({ offset: true, error: 'desde debe ser fecha ISO 8601 con zona horaria.' }).optional(),
    hasta: z.iso.datetime({ offset: true, error: 'hasta debe ser fecha ISO 8601 con zona horaria.' }).optional(),
}).refine(
    (datos) => !datos.desde || !datos.hasta || new Date(datos.desde) < new Date(datos.hasta),
    { message: '"desde" debe ser anterior a "hasta".', path: ['desde'] }
)

const  obtenerCitaPorIdSchema = z.object({
    citaId: z.uuid({
        error: 'El ID de la cita debe de tener un formado UUID válido.'
    })
});




const actualizarCitaParamsSchema = z.object({
    citaId: z.uuid({
        error: 'El ID de la cita debe de tener un formado UUID válido.'
    }),
})


const actualizarCitaBodySchema = z.object({
    fechaHora: z.coerce
            .date({error:'La fecha y hora no son válidas.'})
            .refine(
                (fecha) => fecha.getTime() > Date.now(),{
                    error:'La fecha y hora de la cita deben ser futuras.'
                }
            )
            .transform(
                (fecha) => {
                    const normalizada = new Date(fecha);
                    normalizada.setSeconds(0,0);
                    return normalizada;
                }
            )
            .optional(),
    motivo: z.string().trim().min(1,'El motivo no puede estar vacío.').max(255).optional()
}).refine(
    (datos) => datos.fechaHora !== undefined || datos.motivo !== undefined,
    {error: 'Debes indicar al menos un campo a actulizar(fecha Hora o motivo).'}
);


const actualizarEstadoParamsSchema = z.object({

    citaId: z.uuid({
        error: 'El ID de la cita debe tener un formato UUID válido.'
    })
})

const actualizarEstadoBodySchema = z.object({
    estado: z.enum(['programada', 'confirmada', 'atendida', 'cancelada', 'no_asistio'], {
        error: 'Estado inválido.',
    }),
});




module.exports = {
    crearCitaSchema,
    listarCitasSchema,
    obtenerCitaPorIdSchema,
    actualizarCitaParamsSchema,
    actualizarCitaBodySchema,
    actualizarEstadoParamsSchema,
    actualizarEstadoBodySchema
}