const { 
    BadRequestError, 
    ForbiddenError } = require('../../core/utils/errors');

const { ROL } = require('../constants/roles.constants');

/**
 * Resuelve qué sucursal usar según el rol del usuario autenticado.
 * Dueño: toma el valor indicado explícitamente (body o query).
 * Gerente/Empleado: siempre usa la sucursal de su token.
 *
 * Uso típico en un controller:
 *   const { sucursalId, esDueno } = resolverSucursal(req, req.body.sucursalId, 'Debes indicar...');
 *
 * @param {import('express').Request} req
 * @param {string|undefined} sucursalIdIndicada - Valor que el dueño pudo haber mandado (body o query).
 * @param {string} mensajeFaltante - Mensaje de error si el dueño no indicó sucursal.
 * @returns {{ sucursalId: string, esDueno: boolean }}
 * @throws {BadRequestError} Si falta la sucursal en cualquiera de los dos casos.
 */
function resolverSucursal(req, sucursalIdIndicada, mensajeFaltante) {
    const esDueno = req.user.rol === ROL.DUENO;
    const sucursalId = esDueno ? sucursalIdIndicada : req.user.sucursal_id;

    if (!sucursalId) {
        throw new BadRequestError(
            esDueno ? mensajeFaltante : 'Tu usuario no tiene una sucursal asignada.'
        );
    }

    return { sucursalId, esDueno };
}

/**
 * Valida que el usuario tenga acceso a un recurso ya obtenido
 * (debe traer optica_id y sucursal_id, ej. una cita o consulta por ID).
 * Fail-closed: si no es dueño, siempre exige sucursalId presente y coincidente.
 *
 * @param {Object} recurso - Debe tener optica_id y sucursal_id.
 * @param {Object} contexto
 * @param {string} contexto.opticaId
 * @param {string|null} contexto.sucursalId
 * @param {boolean} contexto.esDueno
 * @param {string} [mensaje]
 * @throws {ForbiddenError}
 */
function validarAccesoRecurso(recurso, { opticaId, sucursalId, esDueno }, mensaje = 'No tienes acceso a este recurso.') {
    if (String(recurso.optica_id) !== String(opticaId)) {
        throw new ForbiddenError(mensaje);
    }

    if (!esDueno) {
        if (!sucursalId || String(recurso.sucursal_id) !== String(sucursalId)) {
            throw new ForbiddenError(mensaje);
        }
    }
}

module.exports = { resolverSucursal, validarAccesoRecurso };