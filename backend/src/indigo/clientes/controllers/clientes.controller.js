const clientesService = require("../services/clientes.service");
const { BadRequestError } = require("../../../core/utils/errors");

async function crearOptica(req, res, next) {
  try {
    const { codigo, razon_social, dueno_nombre } = req.body;

    const resultado = await clientesService.crearOptica(req.user, {
      codigo,
      razonSocial: razon_social,
      duenoNombre: dueno_nombre,
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function buscarPorCodigo(req, res, next) {
  try {
    const { codigo } = req.query;

    // validate solo revisa el body, por eso el query se revisa aquí
    if (!codigo) {
      throw new BadRequestError("Falta el código a buscar");
    }

    res.json(await clientesService.buscarPorCodigo(codigo));
  } catch (err) {
    next(err);
  }
}

async function asignarProveedor(req, res, next) {
  try {
    const { sucursal_id, indigo_sucursal_id } = req.body;

    const resultado = await clientesService.asignarProveedor(req.user, {
      sucursalId: sucursal_id,
      indigoSucursalId: indigo_sucursal_id,
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = { crearOptica, buscarPorCodigo, asignarProveedor };