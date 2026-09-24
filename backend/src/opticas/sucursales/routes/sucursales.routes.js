const express = require('express');
const router = express.Router();
const validate = require('../../../core/middlewares/validation.middleware');

const { crearSucursalSchema, 
        actualizarSucursalSchema,
        cambiarGerenteSchema 
    } = require('../schemas/sucursales.schema');


const { sucursalesController } = require('../container/sucursales.container')
const { autenticar, soloTipo, soloRol } = require('../../../core/middlewares/auth.middleware');

router.use(autenticar, soloTipo('optica'), soloRol('dueno'));

/** 
 * Obtiene los gerentes disponibles de la óptica. 
*/ 
router.get(
    '/gerentes-disponibles',
    sucursalesController.listarGerentesDisponibles.bind(
        sucursalesController
    ) 
);

/** 
 * Obtiene las sucursales de la óptica autenticada. 
 */ 
router.get(
    '/', 
    sucursalesController.listarSucursales.bind(
        sucursalesController
    ) 
);

/**
 * Asigna un gerente a una sucursal.
 */
router.post('/gerente', 
    soloRol('dueno'), 
    sucursalesController.asignarGerente.bind(
        sucursalesController
    )
);

/**
 * Crea una nueva sucursal. 
 */ 
router.post( '/', 
    soloRol('dueno') ,
    validate(crearSucursalSchema),
    sucursalesController.crearSucursal.bind(
        sucursalesController
    ) 
);

 /** 
  * Obtiene una sucursal por su ID. 
  */ 
 router.get( 
    '/:id', 
    soloRol('dueno'),
     sucursalesController.obtenerSucursal.bind(
         sucursalesController
     ) 
 );

 /**
  * Actualiza los datos de una sucursal.
  */
 router.patch( 
    '/:id',
    soloRol('dueno'),
    validate(actualizarSucursalSchema), 
    sucursalesController.actualizarSucursal.bind(
         sucursalesController
     )
 );

 /**
  * Desactiva una sucursal.
  */
 router.patch(
     '/:id/desactivar',
     sucursalesController.desactivarSucursal.bind(
         sucursalesController
     )
 );

 /**
  * Activa una sucursal.s
  */
 router.patch(
     '/:id/activar',
     sucursalesController.activarSucursal.bind(
         sucursalesController
     )
 );

 /**
  * Cambia el gerente de una sucursal.
  */
 router.patch(
     '/:id/gerente',
     validate(cambiarGerenteSchema),
     sucursalesController.cambiarGerente.bind(
         sucursalesController
     )
 );

// /**
//  * Quita el gerente de una sucursal.
//  */
// router.delete(
//     '/:id/gerente',
//     sucursalesController.quitarGerente.bind(
//         sucursalesController
//     )
// );



module.exports = router;