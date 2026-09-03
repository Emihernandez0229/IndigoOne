const { verificarToken } = require('../utils/jwt');


function autenticar(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = verificarToken(token);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
}


function soloTipo(...tipos) {
  return (req, res, next) => {
    if (!req.user || !tipos.includes(req.user.tipo)) {
      return res.status(403).json({ error: 'No tienes permiso para acceder a este recurso' });
    }
    next();
  };
}


function soloRol(...roles) {
  return (req, res, next) => {
    if (req.user && req.user.tipo === 'indigo' && req.user.rol === 'super_usuario') {
      return next();
    }
    if (!req.user || !roles.includes(req.user.rol)) {
      return res.status(403).json({ error: 'Tu rol no tiene permiso para esta accion' });
    }
    next();
  };
}

module.exports = { autenticar, soloTipo, soloRol };