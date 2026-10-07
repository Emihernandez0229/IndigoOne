const sucursalesService = require("../services/sucursales.service");

async function crearSucursal(req, res, next) {
  try {
    const {
      nombre,
      direccion,
      telefono,
      gerente_indigo_usuario_id,
      nuevo_gerente_nombre,
    } = req.body;

    const sucursal = await sucursalesService.crearSucursal(req.user, {
      nombre,
      direccion,
      telefono,
      gerenteIndigoUsuarioId: gerente_indigo_usuario_id || null,
      nuevoGerenteNombre: nuevo_gerente_nombre || null,
    });

    res.status(201).json(sucursal);
  } catch (err) {
    next(err);
  }
}

async function listarGerentesDisponibles(req, res, next) {
  try {
    const gerentes = await sucursalesService.listarGerentesDisponibles(
      req.query.gerente_actual_id || null
    );

    res.json(gerentes);
  } catch (err) {
    next(err);
  }
}

async function asignarGerente(req, res, next) {
  try {
    const { gerente_indigo_usuario_id, nuevo_gerente_nombre } = req.body;

    const resultado = await sucursalesService.asignarGerente(
      req.user,
      req.params.id,
      {
        gerenteIndigoUsuarioId: gerente_indigo_usuario_id || null,
        nuevoGerenteNombre: nuevo_gerente_nombre || null,
      }
    );

    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function listarSucursales(req, res, next) {
  try {
    res.json(await sucursalesService.listarSucursales(req.user));
  } catch (err) {
    next(err);
  }
}

async function actualizarSucursal(req, res, next) {
  try {
    const {
      nombre,
      direccion,
      telefono,
      gerente_indigo_usuario_id,
      nuevo_gerente_nombre,
    } = req.body;

    const sucursal = await sucursalesService.actualizarSucursal(
      req.user,
      req.params.id,
      {
        nombre,
        direccion,
        telefono,
        gerenteIndigoUsuarioId: gerente_indigo_usuario_id || null,
        nuevoGerenteNombre: nuevo_gerente_nombre || null,
      }
    );

    res.json(sucursal);
  } catch (err) {
    next(err);
  }
}

async function darDeBaja(req, res, next) {
  try {
    res.json(await sucursalesService.darDeBaja(req.params.id));
  } catch (err) {
    next(err);
  }
}

async function darDeAlta(req, res, next) {
  try {
    res.json(await sucursalesService.darDeAlta(req.params.id));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  crearSucursal,
  listarGerentesDisponibles,
  asignarGerente,
  listarSucursales,
  actualizarSucursal,
  darDeBaja,
  darDeAlta,
};