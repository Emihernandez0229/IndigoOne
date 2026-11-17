const inventarioService = require("../services/inventario.service");

// Del body (snake_case) a lo que usa el service
function datosDelBody(body) {
  return {
    codigo: body.codigo,
    modelo: body.modelo,
    descripcion: body.descripcion || null,
    color: body.color,
    tipo: body.tipo,
    material: body.material || null,
    genero: body.genero,
    medidas: body.medidas,
    stockDisponible: body.stock_disponible,
    stockMinimo: body.stock_minimo,
    costo: body.costo,
    // fotos: body.fotos,
  };
}

async function listarInventario(req, res, next) {
  try {
    res.json(await inventarioService.listarInventario(req.user));
  } catch (err) {
    next(err);
  }
}

async function crearProducto(req, res, next) {
  try {
    const resultado = await inventarioService.crearProducto(req.user, {
      ...datosDelBody(req.body),
      sucursalId: req.body.sucursal_id || null,
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function actualizarProducto(req, res, next) {
  try {
    const resultado = await inventarioService.actualizarProducto(
      req.user,
      req.params.id,
      datosDelBody(req.body)
    );

    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function darDeBajaProducto(req, res, next) {
  try {
    res.json(await inventarioService.darDeBajaProducto(req.user, req.params.id));
  } catch (err) {
    next(err);
  }
}

async function darDeAltaProducto(req, res, next) {
  try {
    res.json(await inventarioService.darDeAltaProducto(req.user, req.params.id));
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarInventario,
  crearProducto,
  actualizarProducto,
  darDeBajaProducto,
  darDeAltaProducto,
};