const usuariosService = require('../services/usuarios.service');

async function crearGerente(req, res, next) {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const resultado = await usuariosService.crearGerente({
      opticaId: req.user.optica_id,
      nombre,
      creadoPorId: req.user.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function crearEmpleado(req, res, next) {
  try {
    const { nombre, sucursal_id } = req.body;
    if (!nombre || !sucursal_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos (nombre y sucursal_id)' });
    }
    const resultado = await usuariosService.crearEmpleado({
      opticaId: req.user.optica_id,
      sucursalId: sucursal_id,
      nombre,
      creador: { id: req.user.id, rol: req.user.rol },
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { crearGerente, crearEmpleado };