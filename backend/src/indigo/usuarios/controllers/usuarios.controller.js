// const usuariosService = require('../services/usuarios.service');

// async function obtenerUsuarios(req, res, next) {
//   try {
//     const usuarios = await usuariosService.obtenerUsuarios({
//       usuarioId: req.user.id,
//       rol: req.user.rol,
//       sucursalId: req.user.sucursal_id,
//     });

//     res.json(usuarios);
//   } catch (err) {
//     next(err);
//   }
// }

// async function crearPrimerSuperUsuario(req, res, next) {
//   try {
//     const { nombre, usuario, password } = req.body;

//     if (!nombre || !usuario || !password) {
//       return res.status(400).json({
//         error: 'Faltan datos requeridos',
//       });
//     }

//     const resultado = await usuariosService.crearPrimerSuperUsuario({
//       nombre,
//       usuario,
//       password,
//     });

//     res.status(201).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// async function crearSuperUsuario(req, res, next) {
//   try {
//     const { nombre } = req.body;

//     if (!nombre) {
//       return res.status(400).json({
//         error: 'El nombre es requerido',
//       });
//     }

//     const resultado = await usuariosService.crearSuperUsuario({
//       nombre,
//       creadoPorId: req.user.id,
//     });

//     res.status(201).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// async function crearDueno(req, res, next) {
//   try {
//     const { nombre } = req.body;

//     if (!nombre) {
//       return res.status(400).json({
//         error: 'El nombre es requerido',
//       });
//     }

//     const resultado = await usuariosService.crearDueno({
//       nombre,
//       creadoPorId: req.user.id,
//     });

//     res.status(201).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// async function crearGerenteSucursal(req, res, next) {
//   try {
//     const { nombre, sucursal_id } = req.body;

//     if (!nombre) {
//       return res.status(400).json({
//         error: 'El nombre es requerido',
//       });
//     }

//     const resultado = await usuariosService.crearGerenteSucursal({
//       nombre,
//       sucursal_id,
//       creadoPorId: req.user.id,
//     });

//     res.status(201).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// async function crearEmpleado(req, res, next) {
//   try {
//     const { nombre, tipo } = req.body;

//     if (!nombre || !tipo) {
//       return res.status(400).json({
//         error: 'Faltan datos requeridos (nombre y tipo)',
//       });
//     }

//     const resultado = await usuariosService.crearEmpleado({
//       nombre,
//       tipo,
//       creadorSucursalId: req.user.sucursal_id,
//       creadoPorId: req.user.id,
//     });

//     res.status(201).json(resultado);
//   } catch (err) {
//     next(err);
//   }
// }

// module.exports = {
//   obtenerUsuarios,
//   crearPrimerSuperUsuario,
//   crearSuperUsuario,
//   crearDueno,
//   crearGerenteSucursal,
//   crearEmpleado,
// };


const usuariosService =
  require("../services/usuarios.service");


async function obtenerUsuarios(
  req,
  res,
  next
) {

  try {

    const usuarios =
      await usuariosService.obtenerUsuarios({
        usuarioId:
          req.user.id,

        rol:
          req.user.rol,

        sucursalId:
          req.user.sucursal_id,
      });


    res.json(usuarios);

  } catch (err) {

    next(err);

  }

}


async function obtenerOpcionesFormulario(
  req,
  res,
  next
) {

  try {

    const opciones =
      await usuariosService.obtenerOpcionesFormulario({
        creadorRol:
          req.user.rol,

        creadorSucursalId:
          req.user.sucursal_id,

        usuarioEditarId:
          req.query.usuario_id || null,
      });


    res.json(opciones);

  } catch (err) {

    next(err);

  }

}


/* =========================================================
   BOOTSTRAP
========================================================= */

async function crearPrimerSuperUsuario(
  req,
  res,
  next
) {

  try {

    const {
      nombre,
      usuario,
      password,
    } = req.body;


    if (
      !nombre ||
      !usuario ||
      !password
    ) {

      return res.status(400).json({
        error:
          "Faltan datos requeridos",
      });

    }


    const resultado =
      await usuariosService.crearPrimerSuperUsuario({
        nombre,
        usuario,
        password,
      });


    res.status(201).json(
      resultado
    );

  } catch (err) {

    next(err);

  }

}


/* =========================================================
   SUPER USUARIO
========================================================= */

async function crearSuperUsuario(
  req,
  res,
  next
) {

  try {

    const {
      nombre,
    } = req.body;


    if (!nombre?.trim()) {

      return res.status(400).json({
        error:
          "El nombre es requerido",
      });

    }


    const resultado =
      await usuariosService.crearSuperUsuario({
        nombre:
          nombre.trim(),

        creadoPorId:
          req.user.id,
      });


    res.status(201).json(
      resultado
    );

  } catch (err) {

    next(err);

  }

}


/* =========================================================
   DUEÑO
========================================================= */

async function crearDueno(
  req,
  res,
  next
) {

  try {

    const {
      nombre,
    } = req.body;


    if (!nombre?.trim()) {

      return res.status(400).json({
        error:
          "El nombre es requerido",
      });

    }


    const resultado =
      await usuariosService.crearDueno({
        nombre:
          nombre.trim(),

        creadoPorId:
          req.user.id,
      });


    res.status(201).json(
      resultado
    );

  } catch (err) {

    next(err);

  }

}


/* =========================================================
   GERENTE
========================================================= */

async function crearGerenteSucursal(
  req,
  res,
  next
) {

  try {

    const {
      nombre,
      sucursal_id,
      nueva_sucursal_nombre,
    } = req.body;


    if (!nombre?.trim()) {

      return res.status(400).json({
        error:
          "El nombre es requerido",
      });

    }


    const resultado =
      await usuariosService.crearGerenteSucursal({
        nombre:
          nombre.trim(),

        sucursal_id:
          sucursal_id || null,

        nuevaSucursalNombre:
          nueva_sucursal_nombre?.trim() ||
          null,

        creadoPorId:
          req.user.id,

        creadorRol:
          req.user.rol,
      });


    res.status(201).json(
      resultado
    );

  } catch (err) {

    next(err);

  }

}


/* =========================================================
   EMPLEADO
========================================================= */

async function crearEmpleado(
  req,
  res,
  next
) {

  try {

    const {
      nombre,
      tipo,
      sucursal_id,
    } = req.body;


    if (
      !nombre?.trim() ||
      !tipo
    ) {

      return res.status(400).json({
        error:
          "Faltan datos requeridos (nombre y tipo)",
      });

    }


    const resultado =
      await usuariosService.crearEmpleado({
        nombre:
          nombre.trim(),

        tipo,

        sucursalId:
          sucursal_id || null,

        creadorSucursalId:
          req.user.sucursal_id,

        creadoPorId:
          req.user.id,

        creadorRol:
          req.user.rol,
      });


    res.status(201).json(
      resultado
    );

  } catch (err) {

    next(err);

  }

}


/* =========================================================
   ACTUALIZAR
========================================================= */

async function actualizarUsuario(
  req,
  res,
  next
) {

  try {

    const {
      rol,
      sucursal_id,
      nueva_sucursal_nombre,
    } = req.body;


    if (!rol) {

      return res.status(400).json({
        error:
          "El rol es requerido",
      });

    }


    const resultado =
      await usuariosService.actualizarUsuario({
        usuarioId:
          req.params.id,

        rolNuevo:
          rol,

        sucursalId:
          sucursal_id || null,

        nuevaSucursalNombre:
          nueva_sucursal_nombre?.trim() ||
          null,

        creadorRol:
          req.user.rol,

        creadorSucursalId:
          req.user.sucursal_id,
      });


    res.json(
      resultado
    );

  } catch (err) {

    next(err);

  }

}


/* =========================================================
   DAR DE BAJA
========================================================= */

async function darDeBajaUsuario(
  req,
  res,
  next
) {

  try {

    const resultado =
      await usuariosService.darDeBajaUsuario({
        usuarioId:
          req.params.id,

        creadorRol:
          req.user.rol,

        creadorSucursalId:
          req.user.sucursal_id,

        creadorUsuarioId:
          req.user.id,
      });


    res.json(
      resultado
    );

  } catch (err) {

    next(err);

  }

}


async function darDeAltaUsuario(
  req,
  res,
  next
) {

  try {

    const resultado =
      await usuariosService.darDeAltaUsuario({
        usuarioId:
          req.params.id,

        creadorRol:
          req.user.rol,

        creadorSucursalId:
          req.user.sucursal_id,
      });


    res.json(
      resultado
    );

  } catch (err) {

    next(err);

  }

}


module.exports = {
  obtenerUsuarios,
  obtenerOpcionesFormulario,
  crearPrimerSuperUsuario,
  crearSuperUsuario,
  crearDueno,
  crearGerenteSucursal,
  crearEmpleado,
  actualizarUsuario,
  darDeBajaUsuario,
  darDeAltaUsuario,
};

