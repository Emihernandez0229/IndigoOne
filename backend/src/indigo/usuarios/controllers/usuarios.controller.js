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

/* Super usuario */
async function crearSuperUsuario(req, res, next) {
  try {
    const resultado = await usuariosService.crearSuperUsuario(req.user, {
      nombre: req.body.nombre,
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

/* Dueño */
async function crearDueno(req, res, next) {
  try {
    const resultado = await usuariosService.crearDueno(req.user, {
      nombre: req.body.nombre,
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

/* Gerente */
async function crearGerenteSucursal(req, res, next) {
  try {
    const { nombre, sucursal_id, nueva_sucursal_nombre } = req.body;

    const resultado = await usuariosService.crearGerenteSucursal(req.user, {
      nombre,
      sucursalId: sucursal_id || null,
      nuevaSucursalNombre: nueva_sucursal_nombre || null,
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

/* Empleado */
async function crearEmpleado(req, res, next) {
  try {
    const { nombre, tipo, sucursal_id } = req.body;

    const resultado = await usuariosService.crearEmpleado(req.user, {
      nombre,
      tipo,
      sucursalId: sucursal_id || null,
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

/* Actualizar */
async function actualizarUsuario(req, res, next) {
  try {
    const { rol, sucursal_id, nueva_sucursal_nombre } = req.body;

    const resultado = await usuariosService.actualizarUsuario(
      req.user,
      req.params.id,
      {
        rolNuevo: rol,
        sucursalId: sucursal_id || null,
        nuevaSucursalNombre: nueva_sucursal_nombre || null,
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

module.exports = {
  obtenerUsuarios,
  obtenerOpcionesFormulario,
  crearPrimerSuperUsuario,
  crearSuperUsuario,
  crearDueno,
  crearGerenteSucursal,
  crearEmpleado,
  actualizarUsuario,
  darDeBajaUsuario,
  darDeAltaUsuario,
};