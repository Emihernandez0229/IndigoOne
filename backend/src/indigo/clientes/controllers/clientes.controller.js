const clientesService = require("../services/clientes.service");
const { BadRequestError } = require("../../../core/utils/errors");

async function listarClientes(req, res, next) {
  try {
    res.json(await clientesService.listarClientes(req.user));
  } catch (err) {
    next(err);
  }
}

async function crearCliente(req, res, next) {
  try {
    const {
      codigo,
      razon_social,
      rfc,
      municipio,
      direccion,
      codigo_postal,
      sucursal_cliente_nombre,
      indigo_sucursal_id,
    } = req.body;

    const resultado = await clientesService.crearCliente(req.user, {
      codigo,
      razonSocial: razon_social,
      rfc,
      municipio,
      direccion,
      codigoPostal: codigo_postal,
      sucursalClienteNombre: sucursal_cliente_nombre,
      indigoSucursalId: indigo_sucursal_id || null,
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function actualizarCliente(req, res, next) {
  try {
    const { razon_social, rfc, municipio, direccion, codigo_postal } = req.body;

    const resultado = await clientesService.actualizarCliente(
      req.user,
      req.params.id,
      {
        razonSocial: razon_social,
        rfc,
        municipio,
        direccion,
        codigoPostal: codigo_postal,
      }
    );

    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function darDeBajaCliente(req, res, next) {
  try {
    res.json(await clientesService.darDeBajaCliente(req.user, req.params.id));
  } catch (err) {
    next(err);
  }
}

async function darDeAltaCliente(req, res, next) {
  try {
    res.json(await clientesService.darDeAltaCliente(req.user, req.params.id));
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

module.exports = {
  listarClientes,
  crearCliente,
  actualizarCliente,
  darDeBajaCliente,
  darDeAltaCliente,
  buscarPorCodigo,
  asignarProveedor,
};