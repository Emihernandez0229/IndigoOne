require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';


function generarToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}


function generarTokenAutorizacion(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '48h' });
}

function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generarToken, generarTokenAutorizacion, verificarToken };