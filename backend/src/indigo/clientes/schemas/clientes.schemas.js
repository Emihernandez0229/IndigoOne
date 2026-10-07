const { z } = require("zod");

const MSG_CREAR = "Código, razón social y nombre del dueño son requeridos";
const MSG_ASIGNAR =
  "Faltan datos requeridos (sucursal_id e indigo_sucursal_id)";

const requerido = (mensaje) => z.string(mensaje).min(1, mensaje);

const crearOptica = z.object({
  codigo: requerido(MSG_CREAR),
  razon_social: requerido(MSG_CREAR),
  dueno_nombre: requerido(MSG_CREAR),
});

const asignarProveedor = z.object({
  sucursal_id: requerido(MSG_ASIGNAR),
  indigo_sucursal_id: requerido(MSG_ASIGNAR),
});

module.exports = { crearOptica, asignarProveedor };