

const { z } = require('zod');

const crearGerenteSchema = z.object({

    nombre: z.string()
            .trim()
            .min(1, { error:'El nombre es obligatorio'})
            .max(150, { error:'El nombre no puede superar los 150 caracteres'})
}).strict();


const crearEmpleadoSchema = z.object({
    nombre: z.string()
            .trim()
            .min(1, {error:'El nombre es obligatorio'})
            .max(150, {error:'El nombre no puede superar los 150 caracteres'}),
    sucursal_id: z.uuid({
        error:'El id de la sucursal es requerido'
    })
}).strict();


const actualizarUsuarioSchema = z.object({

    nombre: z.string()
             .trim()
             .min(1,{
                error: 'El nombre es obligatorio'
             })
             .max(150,{
                error:'El nombre no puede superar los 150 caracteres'
             })
             .optional(),
    activo: z.boolean().optional()
}).strict().refine(
    (datos) => Object.keys(datos).length > 0,
    {
        error:'Debes proporcionar al menos un campos para actualizar'
    }
);

module.exports = {
    crearGerenteSchema,
    crearEmpleadoSchema,
    actualizarUsuarioSchema
}