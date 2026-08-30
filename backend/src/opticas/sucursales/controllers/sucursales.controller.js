const sucursalesService = require('../services/sucursales.service');

async function crearSucursal(req, res, next) {
  try {
    const { nombre, direccion, telefono, gerente_optica_usuario_id, asignarme } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre de la sucursal es requerido' });
    }
    const resultado = await sucursalesService.crearSucursal({
      opticaId: req.user.optica_id,
      nombre, direccion, telefono, gerente_optica_usuario_id, asignarme,
      creadorId: req.user.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function listarGerentesDisponibles(req, res, next) {
  try {
    const gerentes = await sucursalesService.listarGerentesDisponibles(req.user.optica_id);
    res.json(gerentes);
  } catch (err) {
    next(err);
  }
}

module.exports = { crearSucursal, listarGerentesDisponibles };