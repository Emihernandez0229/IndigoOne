const clientesService = require('../services/clientes.service');

async function crearOptica(req, res, next) {
  try {
    const { codigo, razon_social, dueno_nombre } = req.body;
    if (!codigo || !razon_social || !dueno_nombre) {
      return res.status(400).json({ error: 'Código, razón social y nombre del dueño son requeridos' });
    }
    const resultado = await clientesService.crearOptica({
      codigo,
      razon_social,
      dueno_nombre,
      creadoPorIndigoId: req.user.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { crearOptica, buscarPorCodigo, asignarProveedor };

async function buscarPorCodigo(req, res, next) {
  try {
    const { codigo } = req.query;
    if (!codigo) {
      return res.status(400).json({ error: 'Falta el código a buscar' });
    }
    const resultado = await clientesService.buscarPorCodigo(codigo);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function asignarProveedor(req, res, next) {
  try {
    const { sucursal_id, indigo_sucursal_id } = req.body;
    if (!sucursal_id || !indigo_sucursal_id) {
      return res.status(400).json({ error: 'Faltan datos requeridos (sucursal_id e indigo_sucursal_id)' });
    }
    const resultado = await clientesService.asignarProveedor({
      sucursalId: sucursal_id,
      indigoSucursalId: indigo_sucursal_id,
      creador: { id: req.user.id, rol: req.user.rol, sucursal_id: req.user.sucursal_id },
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}