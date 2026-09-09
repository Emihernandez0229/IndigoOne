const sucursalesService = require('../services/sucursales.service');

async function crearSucursal(req, res, next) {
  try {
    const {
      nombre,
      direccion,
      telefono,
      gerente_indigo_usuario_id,
      nuevo_gerente_nombre
    } = req.body;

    // Validar nombre de la sucursal
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        error: 'El nombre de la sucursal es requerido'
      });
    }

    // Validar nombre del nuevo gerente
    if (
      nuevo_gerente_nombre !== undefined &&
      nuevo_gerente_nombre !== null &&
      !String(nuevo_gerente_nombre).trim()
    ) {
      return res.status(400).json({
        error: 'El nombre del nuevo gerente es requerido'
      });
    }

    const sucursal = await sucursalesService.crearSucursal({
      nombre,
      direccion,
      telefono,
      gerenteIndigoUsuarioId:
        gerente_indigo_usuario_id || null,
      nuevoGerenteNombre:
        nuevo_gerente_nombre || null,
      creadoPorId: req.user.id
    });

    res.status(201).json(sucursal);
  } catch (err) {
    next(err);
  }
}


async function listarGerentesDisponibles(req, res, next) {
  try {
    const gerentes =
      await sucursalesService.listarGerentesDisponibles(
        req.query.gerente_actual_id || null
      );

    res.json(gerentes);
  } catch (err) {
    next(err);
  }
}


async function asignarGerente(req, res, next) {
  try {
    const {
      gerente_indigo_usuario_id,
      nuevo_gerente_nombre
    } = req.body;

    const resultado =
      await sucursalesService.asignarGerente({
        sucursalId: req.params.id,
        gerenteIndigoUsuarioId:
          gerente_indigo_usuario_id || null,
        nuevoGerenteNombre:
          nuevo_gerente_nombre || null,
        creadoPorId: req.user.id
      });

    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function listarSucursales(req, res, next) {
  try {
    const sucursales =
      await sucursalesService.listarSucursales(
        req.user
      );

    res.json(sucursales);
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
      nuevo_gerente_nombre
    } = req.body;

    // Validar nombre de la sucursal
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({
        error: 'El nombre de la sucursal es requerido'
      });
    }

    // Validar nombre del nuevo gerente
    if (
      nuevo_gerente_nombre !== undefined &&
      nuevo_gerente_nombre !== null &&
      !String(nuevo_gerente_nombre).trim()
    ) {
      return res.status(400).json({
        error: 'El nombre del nuevo gerente es requerido'
      });
    }

    const sucursal =
      await sucursalesService.actualizarSucursal(
        req.params.id,
        {
          nombre,
          direccion,
          telefono,
          gerenteIndigoUsuarioId:
            gerente_indigo_usuario_id || null,
          nuevoGerenteNombre:
            nuevo_gerente_nombre || null,
          creadoPorId: req.user.id
        }
      );

    res.json(sucursal);
  } catch (err) {
    next(err);
  }
}


async function darDeBaja(req, res, next) {
  try {
    const sucursal =
      await sucursalesService.darDeBaja(
        req.params.id
      );

    res.json(sucursal);
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
  darDeBaja
};