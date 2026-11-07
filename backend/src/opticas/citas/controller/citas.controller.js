const { ROL } = require('../../constants/roles.constants');
const { resolverSucursal } = require('../../helpers/autorizacion.helper');

class CitasController {
    constructor(citaService) {
        this.citaService = citaService;
    }

    /**
     * Crea una nueva cita.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {Promise<void>}
     */
    async crearCita(req, res) {
        const { sucursalId: sucursalIdBody, clienteId, fechaHora, motivo } = req.body;

        const { sucursalId } = resolverSucursal(
            req,
            sucursalIdBody,
            'Debes indicar la sucursal (sucursalId) donde se crea la cita.'
        );

        const cita = await this.citaService.crearCita({
            sucursalId,
            opticaId: req.user.optica_id,
            clienteId,
            fechaHora,
            motivo,
            creadoPor: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: 'Cita creada correctamente.',
            data: cita,
        });
    }

    /**
     * Lista las citas de una sucursal, con paginación y filtros opcionales.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {Promise<void>}
     */
    async obtenerTodasCitas(req, res) {
        const { sucursalId: sucursalIdQuery, todas, clienteId, limit, offset, estado, desde, hasta } = req.query;
        
        const paginacion = { limit, offset };
        const filtros = { estados: estado, desde, hasta, clienteId };
        
        // Dueño con todas=true: citas de todas las sucursales de su óptica.
        // Para los demás roles el parámetro se ignora y rige su sucursal.
        if (req.user.rol === ROL.DUENO && todas === 'true') {
            const resultado = await this.citaService.listarCitasPorOptica({
                opticaId: req.user.optica_id,
                paginacion,
                filtros,
            });
        
            return res.status(200).json({
                success: true,
                data: resultado.data,
                paginacion: resultado.paginacion,
            });
        }
    
        const { sucursalId } = resolverSucursal(
            req,
            sucursalIdQuery,
            'Debes indicar la sucursal (sucursalId) a consultar.'
        );
    
        const { data, paginacion: infoPaginacion } = await this.citaService.listarCitasPorSucursal({
            sucursalId,
            opticaId: req.user.optica_id,
            paginacion,
            filtros,
        });
    
        res.status(200).json({ success: true, data, paginacion: infoPaginacion });
    }

    /**
     * Obtiene el detalle de una cita por su ID.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {Promise<void>}
     */
    async obtenerCitaPorId(req, res) {
        const { citaId } = req.params;
        const esDueno = req.user.rol === ROL.DUENO;

        if (!esDueno && !req.user.sucursal_id) {
            throw new BadRequestError('Tu usuario no tiene una sucursal asignada.');
        }

        const cita = await this.citaService.obtenerCitaPorId({
            citaId,
            opticaId: req.user.optica_id,
            sucursalId: req.user.sucursal_id,
            esDueno,
        });

        res.status(200).json({ success: true, data: cita });
    }

    /**
     * Actualiza la fecha/hora y/o el motivo de una cita existente.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {Promise<void>}
     */
    async actualizarCita(req, res) {
        const { citaId } = req.params;
        const { fechaHora, motivo } = req.body;
        const esDueno = req.user.rol === ROL.DUENO;

        if (!esDueno && !req.user.sucursal_id) {
            throw new BadRequestError('Tu usuario no tiene una sucursal asignada.');
        }

        const cita = await this.citaService.actualizarCita({
            citaId,
            opticaId: req.user.optica_id,
            sucursalId: req.user.sucursal_id,
            esDueno,
            fechaHora,
            motivo,
        });

        res.status(200).json({ success: true, data: cita });
    }

    /**
     * Actualiza el estado de una cita.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {Promise<void>}
     */
    async actualizarEstadoCita(req, res) {
        const { citaId } = req.params;
        const { estado } = req.body;
        const esDueno = req.user.rol === ROL.DUENO;

        if (!esDueno && !req.user.sucursal_id) {
            throw new BadRequestError('Tu usuario no tiene una sucursal asignada.');
        }

        const cita = await this.citaService.actualizarEstadoCita({
            citaId,
            opticaId: req.user.optica_id,
            sucursalId: req.user.sucursal_id,
            esDueno,
            nuevoEstado: estado,
        });

        res.status(200).json({
            success: true,
            message: 'Estado de la cita actualizado correctamente.',
            data: cita,
        });
    }
}

module.exports = CitasController;