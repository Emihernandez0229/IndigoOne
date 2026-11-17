const { z } = require("zod");

const nombre = z
  .string("El nombre es requerido")
  .trim()
  .min(1, "El nombre es requerido");

// El front manda el rol como "indigo:xxx"; en la base es solo "xxx"
const rol = z
  .string("El rol es requerido")
  .min(1, "El rol es requerido")
  .transform((valor) => valor.replace(/^indigo:/, ""));

const sucursalId = z.string().nullish();

const telefono = z
  .string()
  .trim()
  .regex(/^\d{10}$/, "El teléfono debe tener exactamente 10 dígitos.")
  .or(z.literal(""))
  .nullish();

const correo = z
  .string()
  .trim()
  .email("Escribe un correo electrónico válido.")
  .or(z.literal(""))
  .nullish();

const usuario = z
  .string()
  .trim()
  .min(3, "El usuario debe tener al menos 3 caracteres.")
  .max(50, "El usuario no puede superar los 50 caracteres.")
  .regex(
    /^[A-Za-z0-9._-]+$/,
    "El usuario solo puede tener letras, números, punto, guion y guion bajo."
  )
  .nullish();

const primerSuperUsuario = z.object({
  nombre: z.string("Faltan datos requeridos").min(1, "Faltan datos requeridos"),
  usuario: z.string("Faltan datos requeridos").min(1, "Faltan datos requeridos"),
  password: z.string("Faltan datos requeridos").min(1, "Faltan datos requeridos"),
});

// Alta: Gerente/Subgerente (Empleados) y Super usuario (Personal)
const crear = z.object({
  nombre,
  telefono,
  correo,
  rol,
  sucursal_id: sucursalId,
  requiere_cambio_password: z.boolean().optional(),
});

const actualizar = z.object({
  nombre,
  usuario,
  telefono,
  correo,
  rol,
  sucursal_id: sucursalId,
});

const miPerfil = z.object({ nombre, usuario, telefono, correo });

const cambiarPassword = z
  .object({
    actual: z.string("La contraseña actual es requerida").min(1, "La contraseña actual es requerida"),
    nueva: z
      .string("La nueva contraseña es requerida")
      .min(6, "La contraseña debe tener al menos 6 caracteres"),
  })
  .refine((datos) => datos.actual !== datos.nueva, {
    message: "La nueva contraseña debe ser diferente a la actual.",
    path: ["nueva"],
  });

module.exports = { primerSuperUsuario, crear, actualizar, miPerfil, cambiarPassword };