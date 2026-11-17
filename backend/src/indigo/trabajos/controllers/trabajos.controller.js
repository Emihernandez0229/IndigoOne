const trabajosService = require("../services/trabajos.service");

async function listarTrabajos(req, res, next) {
  try {
    res.json(await trabajosService.listarTrabajos(req.user));
  } catch (err) {
    next(err);
  }
}

async function obtenerOpciones(req, res, next) {
  try {
    res.json(await trabajosService.obtenerOpciones(req.user));
  } catch (err) {
    next(err);
  }
}

async function crearTrabajo(req, res, next) {
  try {
    const {
      cliente_id,
      vendedor_id,
      tipo_servicio,
      tipo_bisel,
      cantidad,
      urgente,
      fecha_entrega,
    } = req.body;

    const resultado = await trabajosService.crearTrabajo(req.user, {
      clienteId: cliente_id,
      vendedorId: vendedor_id,
      tipoServicio: tipo_servicio,
      tipoBisel: tipo_bisel,
      cantidad,
      urgente: urgente ?? false,
      fechaEntrega: fecha_entrega,
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

async function aceptarTrabajo(req, res, next) {
  try {
    res.json(await trabajosService.aceptarTrabajo(req.user, req.params.id));
  } catch (err) {
    next(err);
  }
}

async function terminarTrabajo(req, res, next) {
  try {
    res.json(await trabajosService.terminarTrabajo(req.user, req.params.id));
  } catch (err) {
    next(err);
  }
}

async function registrarMerma(req, res, next) {
  try {
    const resultado = await trabajosService.registrarMerma(
      req.user,
      req.params.id,
      { motivo: req.body.motivo }
    );

    res.json(resultado);
  } catch (err) {
    next(err);
  }
}

async function agregarDetalle(req, res, next) {
  try {
    const resultado = await trabajosService.agregarDetalle(
      req.user,
      req.params.id,
      { texto: req.body.texto }
    );

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listarTrabajos,
  obtenerOpciones,
  crearTrabajo,
  aceptarTrabajo,
  terminarTrabajo,
  registrarMerma,
  agregarDetalle,
};