const { z } = require('zod');

// ── Campos reutilizables ─────────────────────────────────────────────

const nombreCampo = z.string()
    .trim()
    .min(1, { error: 'El nombre es obligatorio' })
    .max(150, { error: 'El nombre no puede superar los 150 caracteres' });

const telefonoCampo = z.string()
    .trim()
    .min(7, { error: 'El teléfono es demasiado corto' })
    .max(20, { error: 'El teléfono no puede superar los 20 caracteres' })
    .regex(/^[0-9+()\-\s]+$/, { error: 'El teléfono contiene caracteres no válidos' })
    .nullable()
    .optional();

// trim y toLowerCase primero; el formato se valida sobre el valor ya limpio.
const emailCampo = z.string()
    .trim()
    .toLowerCase()
    .max(150, { error: 'El correo electrónico no puede superar los 150 caracteres' })
    .pipe(z.email({ error: 'El correo electrónico no es válido' }))
    .nullable()
    .optional();

// ── Schemas ──────────────────────────────────────────────────────────

const crearGerenteSchema = z.object({
    nombre: nombreCampo,
    telefono: telefonoCampo,
    email: emailCampo
}).strict();

const crearEmpleadoSchema = z.object({
    nombre: nombreCampo,
    telefono: telefonoCampo,
    email: emailCampo,
    sucursal_id: z.uuid({ error: 'El id de la sucursal es requerido' })
}).strict();

const actualizarUsuarioSchema = z.object({
    nombre: nombreCampo.optional(),
    telefono: telefonoCampo,
    email: emailCampo,
    activo: z.boolean().optional()
}).strict().refine(
    (datos) => Object.keys(datos).length > 0,
    { error: 'Debes proporcionar al menos un campo para actualizar' }
);

module.exports = {
    crearGerenteSchema,
    crearEmpleadoSchema,
    actualizarUsuarioSchema
};