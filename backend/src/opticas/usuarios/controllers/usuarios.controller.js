const usuariosService = require('../services/usuarios.service');

async function crearGerente(req, res, next) {
  try {
    const { nombre, usuario, password } = req.body;
    if (!nombre || !usuario || !password) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const resultado = await usuariosService.crearGerente({
      opticaId: req.user.optica_id,
      nombre, usuario, password,
      creadoPorId: req.user.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function crearEmpleado(req, res, next) {
  try {
    const { nombre, usuario, password, sucursal_id } = req.body;
    if (!nombre || !usuario || !password || !sucursal_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const resultado = await usuariosService.crearEmpleado({
      opticaId: req.user.optica_id,
      sucursalId: sucursal_id,
      nombre, usuario, password,
      creador: { id: req.user.id, rol: req.user.rol },
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { crearGerente, crearEmpleado };