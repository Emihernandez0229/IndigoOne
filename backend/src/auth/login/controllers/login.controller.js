// const loginService = require('../services/login.service');

// async function loginIndigo(req, res, next) {
//   try {
//     const { usuario, password } = req.body;
//     if (!usuario || !password) {
//       return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
//     }
//     const resultado = await loginService.loginIndigo(usuario, password);
//     res.json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// async function loginOptica(req, res, next) {
//   try {
//     const { codigo, usuario, password } = req.body;
//     if (!codigo || !usuario || !password) {
//       return res.status(400).json({ error: 'Codigo, usuario y contraseña son requeridos' });
//     }
//     const resultado = await loginService.loginOptica(codigo, usuario, password);
//     res.json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }


// async function cambiarPassword(req, res, next) {
//   try {
//     const { passwordNueva } = req.body;
//     if (!passwordNueva || passwordNueva.length < 6) {
//       return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
//     }
//     await loginService.cambiarPassword({
//       optica_usuario_id: req.user.id,
//       optica_id: req.user.optica_id,
//       passwordNueva,
//       esDueno: req.user.rol === 'dueno',
//     });
//     res.json({ mensaje: 'Contraseña actualizada' });
//   } catch (err) {
//     next(err);
//   }
// }

// module.exports = { loginIndigo, loginOptica, cambiarPassword };

const loginService = require('../services/login.service');

async function login(req, res, next) {
  try {
    const { usuario, password } = req.body;
    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }
    const resultado = await loginService.login(usuario, password);
    res.json(resultado);
  } catch (err) {
    next(err);
  }
}


async function cambiarPassword(req, res, next) {
  try {
    const { passwordNueva } = req.body;
    if (!passwordNueva || passwordNueva.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    await loginService.cambiarPassword({
      tipo: req.user.tipo,
      id: req.user.id,
      optica_id: req.user.optica_id,
      passwordNueva,
      esDuenoOptica: req.user.tipo === 'optica' && req.user.rol === 'dueno',
    });
    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, cambiarPassword };