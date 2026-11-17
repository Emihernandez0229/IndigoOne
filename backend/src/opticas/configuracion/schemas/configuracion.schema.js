const { z } = require('zod');

const campoTexto = (maximo) =>
    z.string()
        .trim()
        .max(maximo)
        .nullable()
        .optional();

const colorSchema = z
    .string()
    .regex(
        /^#[0-9A-Fa-f]{6}$/,
        { error: 'Debe ser un color hexadecimal válido, por ejemplo #294580' }
    );

const correoSchema = (mensaje) =>
    z.string()
        .trim()
        .email({ error: mensaje })
        .max(254, { error: 'El correo no puede superar los 254 caracteres' })
        .nullable()
        .optional();

const crearConfiguracionSchema = z.object({
    // Información de la empresa
    nombre_comercial: campoTexto(150),
    responsable_sanitario: campoTexto(150),
    razon_social: campoTexto(150),
    telefono: campoTexto(20),
    correo: correoSchema('El correo electrónico debe ser válido'),

    // Domicilio fiscal
    calle: campoTexto(150),
    numero_exterior: campoTexto(20),
    numero_interior: campoTexto(20),
    colonia: campoTexto(100),
    codigo_postal: campoTexto(10),
    municipio: campoTexto(100),
    estado_direccion: campoTexto(100),
    pais: z.string()
        .trim()
        .min(1, { error: 'El país no puede estar vacío' })
        .max(100)
        .optional(),

    // Configuración fiscal
    rfc: z.string()
        .trim()
        .min(1, { error: 'El RFC no puede estar vacío' })
        .max(13, { error: 'El RFC no puede superar los 13 caracteres' })
        .nullable()
        .optional(),
    regimen_fiscal: campoTexto(10),
    correo_fiscal: correoSchema('El correo fiscal debe ser válido'),

    // Identidad visual
    logo_url: z.string()
        .trim()
        .url({ error: 'La URL del logo debe ser válida' })
        .nullable()
        .optional(),
    color_principal: colorSchema.optional(),
    color_secundario: colorSchema.optional(),
    eslogan: campoTexto(200),
}).strict();

const actualizarConfiguracionSchema = crearConfiguracionSchema
    .partial()
    .strict()
    .refine(
        (datos) => Object.keys(datos).length > 0,
        { error: 'Debes proporcionar al menos un campo para actualizar' }
    );

module.exports = {
    crearConfiguracionSchema,
    actualizarConfiguracionSchema,
};