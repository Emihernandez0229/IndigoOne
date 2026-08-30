const clientesService = require('../services/clientes.service');

async function crearOptica(req, res, next) {
  try {
    const { codigo, razon_social, dueno_nombre } = req.body;
    if (!codigo || !razon_social || !dueno_nombre) {
      return res.status(400).json({ error: 'Codigo, razon social y nombre del dueño son requeridos' });
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

module.exports = { crearOptica };