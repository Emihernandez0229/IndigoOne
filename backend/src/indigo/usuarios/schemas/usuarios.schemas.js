const { z } = require("zod");

const nombre = z
  .string("El nombre es requerido")
  .trim()
  .min(1, "El nombre es requerido");

const sucursalId = z.string().nullish();
const textoOpcional = z.string().trim().nullish();

const primerSuperUsuario = z.object({
  nombre: z.string("Faltan datos requeridos").min(1, "Faltan datos requeridos"),
  usuario: z.string("Faltan datos requeridos").min(1, "Faltan datos requeridos"),
  password: z.string("Faltan datos requeridos").min(1, "Faltan datos requeridos"),
});

const soloNombre = z.object({ nombre });

const gerente = z.object({
  nombre,
  sucursal_id: sucursalId,
  nueva_sucursal_nombre: textoOpcional,
});

const empleado = z.object({
  nombre: z
    .string("Faltan datos requeridos (nombre y tipo)")
    .trim()
    .min(1, "Faltan datos requeridos (nombre y tipo)"),
  tipo: z
    .string("Faltan datos requeridos (nombre y tipo)")
    .min(1, "Faltan datos requeridos (nombre y tipo)"),
  sucursal_id: sucursalId,
});

const actualizar = z.object({
  rol: z.string("El rol es requerido").min(1, "El rol es requerido"),
  sucursal_id: sucursalId,
  nueva_sucursal_nombre: textoOpcional,
});

module.exports = {
  primerSuperUsuario,
  soloNombre,
  gerente,
  empleado,
  actualizar,
};