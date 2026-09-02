const usuariosService = require('../services/usuarios.service');

async function crearPrimerSuperUsuario(req, res, next) {
  try {
    const { nombre, usuario, password } = req.body;
    if (!nombre || !usuario || !password) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const resultado = await usuariosService.crearPrimerSuperUsuario({ nombre, usuario, password });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function crearSuperUsuario(req, res, next) {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const resultado = await usuariosService.crearSuperUsuario({
      nombre,
      creadoPorId: req.user.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function crearDueno(req, res, next) {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const resultado = await usuariosService.crearDueno({
      nombre,
      creadoPorId: req.user.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function crearGerenteSucursal(req, res, next) {
  try {
    const { nombre, sucursal_id } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    const resultado = await usuariosService.crearGerenteSucursal({
      nombre, sucursal_id,
      creadoPorId: req.user.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function crearEmpleado(req, res, next) {
  try {
    const { nombre, tipo } = req.body;
    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'Faltan datos requeridos (nombre y tipo)' });
    }
    const resultado = await usuariosService.crearEmpleado({
      nombre, tipo,
      creadorSucursalId: req.user.sucursal_id,
      creadoPorId: req.user.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  crearPrimerSuperUsuario,
  crearSuperUsuario,
  crearDueno,
  crearGerenteSucursal,
  crearEmpleado,
};