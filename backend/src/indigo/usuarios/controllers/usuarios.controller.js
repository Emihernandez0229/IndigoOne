const usuariosService = require("../services/usuarios.service");

async function obtenerUsuarios(req, res, next) {
  try {
    res.json(await usuariosService.obtenerUsuarios(req.user));
  } catch (err) {
    next(err);
  }
}

async function obtenerOpcionesFormulario(req, res, next) {
  try {
    const opciones = await usuariosService.obtenerOpcionesFormulario(
      req.user,
      req.query.usuario_id || null
    );
    res.json(opciones);
  } catch (err) {
    next(err);
  }
}

/* Bootstrap */
async function crearPrimerSuperUsuario(req, res, next) {
  try {
    const { nombre, usuario, password } = req.body;

    const resultado = await usuariosService.crearPrimerSuperUsuario({
      nombre,
      usuario,
      password,
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

/* Alta */
async function crearUsuario(req, res, next) {
  try {
    const {
      nombre,
      telefono,
      correo,
      rol,
      sucursal_id,
      requiere_cambio_password,
    } = req.body;

    const resultado = await usuariosService.crearUsuario(req.user, {
      nombre,
      telefono: telefono || null,
      correo: correo || null,
      rol,
      sucursalId: sucursal_id || null,
      requiereCambioPassword: requiere_cambio_password ?? true,
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

/* Actualizar */
async function actualizarUsuario(req, res, next) {
  try {
    const { nombre, usuario, telefono, correo, rol, sucursal_id } = req.body;

    const resultado = await usuariosService.actualizarUsuario(
      req.user,
      req.params.id,
      {
        nombre,
        usuario: usuario || null,
        telefono: telefono || null,
        correo: correo || null,
        rolNuevo: rol,
        sucursalId: sucursal_id || null,
      }
    );

    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

/* Dar de baja */
async function darDeBajaUsuario(req, res, next) {
  try {
    res.json(await usuariosService.darDeBajaUsuario(req.user, req.params.id));
  } catch (err) {
    next(err);
  }
}

/* Dar de alta */
async function darDeAltaUsuario(req, res, next) {
  try {
    res.json(await usuariosService.darDeAltaUsuario(req.user, req.params.id));
  } catch (err) {
    next(err);
  }
}

/* Restablecer contraseña */
async function resetearPassword(req, res, next) {
  try {
    res.json(await usuariosService.resetearPassword(req.user, req.params.id));
  } catch (err) {
    next(err);
  }
}

/* Mi perfil */
async function actualizarMiPerfil(req, res, next) {
  try {
    const { nombre, usuario, telefono, correo } = req.body;

    const resultado = await usuariosService.actualizarMiPerfil(req.user, {
      nombre,
      usuario: usuario || null,
      telefono: telefono || null,
      correo: correo || null,
    });

    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function cambiarMiPassword(req, res, next) {
  try {
    const { actual, nueva } = req.body;

    res.json(await usuariosService.cambiarMiPassword(req.user, { actual, nueva }));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  obtenerUsuarios,
  obtenerOpcionesFormulario,
  crearPrimerSuperUsuario,
  crearUsuario,
  actualizarUsuario,
  darDeBajaUsuario,
  darDeAltaUsuario,
  resetearPassword,
  actualizarMiPerfil,
  cambiarMiPassword,
};