const registerService = require('../services/register.service');
const { paginaConfirmacionRegistro, paginaResultado } = require('../../../core/templates/confirmacion-registro.template');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

// solo lo usa indigo 
async function registrarOptica(req, res, next) {
  try {
    const { codigo, razon_social } = req.body;
    if (!codigo || !razon_social) {
      return res.status(400).json({ error: 'Código y razón social son requeridos' });
    }
    const resultado = await registerService.registrarOptica({
      codigo,
      razon_social,
      creadoPorIndigoId: req.user.id,
    });
    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

// encargado/empleado se auto-registra
async function registrarOpticaUsuario(req, res, next) {
  try {
    const { codigo, usuario, password, nombre, rol, sucursal_id } = req.body;
    if (!codigo || !usuario || !password || !nombre || !rol) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    const resultado = await registerService.registrarOpticaUsuario({
      codigo, usuario, password, nombre, rol, sucursal_id,
    });
    res.status(201).json({
      mensaje: resultado.correoEnviado
        ? 'Registro creado. Se envio un correo para autorizarlo.'
        : 'Registro creado, pero no se pudo enviar el correo de autorización (falta email registrado).',
      usuario: resultado.usuario,
    });
  } catch (err) {
    next(err);
  }
}

// solo dueño o encargado
async function autorizarRegistro(req, res, next) {
  try {
    const { optica_usuario_id, codigo_confirmacion } = req.body;
    if (!optica_usuario_id || !codigo_confirmacion) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    await registerService.autorizarRegistro({
      optica_usuario_id,
      codigo_confirmacion,
      autorizadoPorId: req.user.id,
    });
    res.json({ mensaje: 'Registro autorizado correctamente' });
  } catch (err) {
    next(err);
  }
}


async function mostrarConfirmacion(req, res, next) {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Falta el token');

    const datos = await registerService.obtenerDatosParaConfirmacion(token);

    res.send(
      paginaConfirmacionRegistro({
        nombreSolicitante: datos.nombre,
        rolSolicitante: datos.rol,
        opticaNombre: datos.optica_nombre,
        token,
        urlBase: API_BASE_URL,
      })
    );
  } catch (err) {
    res.status(err.status || 500).send(
      paginaResultado({ mensaje: err.message || 'Ocurrió un error' })
    );
  }
}

async function aceptarConfirmacion(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).send('Falta el token');
    await registerService.resolverPorToken({ token, aprobar: true });
    res.send(paginaResultado({ mensaje: 'Registro autorizado correctamente. Ya puede iniciar sesión.' }));
  } catch (err) {
    res.status(err.status || 500).send(
      paginaResultado({ mensaje: err.message || 'Ocurrió un error' })
    );
  }
}

async function rechazarConfirmacion(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).send('Falta el token');
    await registerService.resolverPorToken({ token, aprobar: false });
    res.send(paginaResultado({ mensaje: 'Registro rechazado.' }));
  } catch (err) {
    res.status(err.status || 500).send(
      paginaResultado({ mensaje: err.message || 'Ocurrió un error' })
    );
  }
}

module.exports = {
  registrarOptica,
  registrarOpticaUsuario,
  autorizarRegistro,
  mostrarConfirmacion,
  aceptarConfirmacion,
  rechazarConfirmacion,
};