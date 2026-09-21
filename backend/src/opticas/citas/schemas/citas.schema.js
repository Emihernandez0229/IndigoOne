const { z } = require('zod');

const estadosCita = [
    'programada',
    'confirmada',
    'atendida',
    'cancelada',
    'no_asistio'
];

const uuidSchema = z.string().uuid();

const fechaHoraSchema = z.coerce.date()
    .refine(
        fecha => fecha > new Date(),
        {
            message: 'La cita debe programarse para una fecha y hora futuras.'
        }
    );

const crearCitaSchema = z.object({
    sucursalId: uuidSchema,
    clienteId: uuidSchema,
    fechaHora: fechaHoraSchema,
    motivo: z.string()
        .trim()
        .min(1, 'El motivo de la cita es obligatorio.'),
    creadoPor: uuidSchema
});

const obtenerCitasPorDiaSchema = z.object({
    sucursalId: uuidSchema,
    fecha: z.coerce.date({
        message: 'La fecha proporcionada no es válida.'
    })
});

const obtenerCitasPorEstadoSchema = z.object({
    sucursalId: uuidSchema,
    estado: z.enum(estadosCita)
});

const obtenerCitaPorIdSchema = z.object({
    sucursalId: uuidSchema,
    citaId: uuidSchema
});

const obtenerCitasPorClienteSchema = z.object({
    sucursalId: uuidSchema,
    clienteId: uuidSchema
});

const actualizarCitaSchema = z.object({
    citaId: uuidSchema,
    sucursalId: uuidSchema,
    fechaHora: fechaHoraSchema.optional(),
    motivo: z.string()
        .trim()
        .min(1, 'El motivo de la cita no puede estar vacío.')
        .optional()
}).refine(
    data => data.fechaHora !== undefined || data.motivo !== undefined,
    {
        message: 'Debe proporcionar al menos un dato para actualizar la cita.'
    }
);

const actualizarEstadoCitaSchema = z.object({
    citaId: uuidSchema,
    sucursalId: uuidSchema,
    nuevoEstado: z.enum(estadosCita)
});

module.exports = {
    crearCitaSchema,
    obtenerCitasPorDiaSchema,
    obtenerCitasPorEstadoSchema,
    obtenerCitaPorIdSchema,
    obtenerCitasPorClienteSchema,
    actualizarCitaSchema,
    actualizarEstadoCitaSchema
};