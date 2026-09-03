const sucursalesService = require('../services/sucursales.service');

async function crearSucursal(req, res, next) {
  try {
    const { nombre, direccion, telefono, gerente_indigo_usuario_id } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la sucursal es requerido' });
    }
    const sucursal = await sucursalesService.crearSucursal({
      nombre, direccion, telefono, gerente_indigo_usuario_id,
    });
    res.status(201).json(sucursal);
  } catch (err) {
    next(err);
  }
}

async function listarGerentesDisponibles(req, res, next) {
  try {
    const gerentes = await sucursalesService.listarGerentesDisponibles();
    res.json(gerentes);
  } catch (err) {
    next(err);
  }
}

async function asignarGerente(req, res, next) {
  try {
    const { gerente_indigo_usuario_id } = req.body;
    const resultado = await sucursalesService.asignarGerente({
      sucursalId: req.params.id,
      gerenteIndigoUsuarioId: gerente_indigo_usuario_id || null,
    });
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { crearSucursal, listarGerentesDisponibles, asignarGerente };