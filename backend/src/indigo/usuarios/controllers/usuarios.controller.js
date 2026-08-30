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

// Solo super_usuario
async function crearSuperUsuario(req, res, next) {
  try {
    const { nombre, usuario, password } = req.body;
    if (!nombre || !usuario || !password) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const resultado = await usuariosService.crearSuperUsuario({
      nombre, usuario, password,
      creadoPorId: req.user.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

// Solo super_usuario
async function crearDueno(req, res, next) {
  try {
    const { nombre, usuario, password } = req.body;
    if (!nombre || !usuario || !password) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const resultado = await usuariosService.crearDueno({
      nombre, usuario, password,
      creadoPorId: req.user.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function crearGerenteSucursal(req, res, next) {
  try {
    const { nombre, usuario, password, sucursal_id } = req.body;
    if (!nombre || !usuario || !password) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const resultado = await usuariosService.crearGerenteSucursal({
      nombre, usuario, password, sucursal_id,
      creadoPorId: req.user.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

// Gerente de sucursal, solo para su propia sucursal
async function crearEmpleado(req, res, next) {
  try {
    const { nombre, usuario, password, tipo } = req.body;
    if (!nombre || !usuario || !password || !tipo) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const resultado = await usuariosService.crearEmpleado({
      nombre, usuario, password, tipo,
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