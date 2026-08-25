function manejadorErrores(err, req, res, next) {
  console.error(err);

  const status = err.status || 500;
  const mensaje = err.message || 'Error interno del servidor';

  res.status(status).json({ error: mensaje });
}

module.exports = manejadorErrores;