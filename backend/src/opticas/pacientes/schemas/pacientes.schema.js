const { z } = require('zod');

const crearPacienteSchema = z.object({
    sucursalId: z.uuid({
        error: 'El ID de la sucursal debe tener un formato UUID válido'
    }).optional(),
    nombre: z.string()
        .trim()
        .toUpperCase()
        .min(1, {
            error: 'El nombre del paciente es obligatorio'
        })
        .max(200, {
            error: 'El nombre del paciente no puede superar los 200 caracteres'
        }),
    telefono: z.string()
        .trim()
        .max(20, {
            error: 'El teléfono no puede superar los 20 caracteres'
        })
        .optional()
        .nullable(),
    email: z.email({
        error: 'El correo electrónico no es válido'
    })
        .trim()
        .toLowerCase()
        .max(150, {
            error: 'El correo electrónico no puede superar los 150 caracteres'
        })
        .optional()
        .nullable(),
    fechaNacimiento: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, {
            error:'Formato inválido, use YYY-MM-DD'
        })
        .max(new Date(), {
            error: 'La fecha de nacimiento no puede ser futura'
        })
        .optional()
        .nullable()
}).strict();

const actualizarPacienteSchema = z.object({
    nombre: z.string()
        .trim()
        .toUpperCase()
        .min(1, {
            error: 'El nombre del paciente es obligatorio'
        })
        .max(200, {
            error: 'El nombre del paciente no puede superar los 200 caracteres'
        })
        .optional(),
    telefono: z.string()
        .trim()
        .max(20, {
            error: 'El teléfono no puede superar los 20 caracteres'
        })
        .optional()
        .nullable(),
    email: z.email({
        error: 'El correo electrónico no es válido'
    })
        .trim()
        .toLowerCase()
        .max(150, {
            error: 'El correo electrónico no puede superar los 150 caracteres'
        })
        .optional()
        .nullable(),
    fechaNacimiento: z.coerce.date({
        error: 'La fecha de nacimiento no es válida'
    })
        .max(new Date(), {
            error: 'La fecha de nacimiento no puede ser futura'
        })
        .optional()
        .nullable()
}).strict().refine(
    (datos) => Object.keys(datos).length > 0,
    {
        error: 'Debes proporcionar al menos un campo para actualizar'
    }
);

module.exports = {
    crearPacienteSchema,
    actualizarPacienteSchema
};