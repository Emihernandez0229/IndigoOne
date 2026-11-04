const { BadRequestError } = require('../../../core/utils/errors');
const { ROL } = require('../../constants/roles.constants');
const { resolverSucursal } = require('../../helpers/autorizacion.helper');

class ConsultaController {
    constructor(consultaService) {
        this.consultaService = consultaService;
    }

    async crearConsulta(req, res) {
        const { sucursalId: sucursalIdBody, clienteId, fechaExamen, od, oi, dip, observaciones } = req.body;

        const { sucursalId } = resolverSucursal(
            req,
            sucursalIdBody,
            'Debes indicar la sucursal (sucursalId) donde se registra la consulta.'
        );

        const consulta = await this.consultaService.crearConsulta({
            sucursalId,
            opticaId: req.user.optica_id,
            clienteId,
            fechaExamen,
            od,
            oi,
            dip,
            observaciones,
            registradoPor: req.user.id,
        });

        res.status(201).json({ success: true, data: consulta });
    }

    async obtenerTodasConsultas(req, res) {
        const { sucursalId: sucursalIdQuery, clienteId, limit, offset, desde, hasta } = req.query;

        const { sucursalId } = resolverSucursal(
            req,
            sucursalIdQuery,
            'Debes indicar la sucursal (sucursalId) a consultar.'
        );

        const { data, paginacion } = await this.consultaService.listarConsultasPorSucursal({
            sucursalId,
            opticaId: req.user.optica_id,
            paginacion: { limit, offset },
            filtros: { clienteId, desde, hasta },
        });

        res.status(200).json({ success: true, data, paginacion });
    }

    async obtenerConsultaPorId(req, res) {
        const { consultaId } = req.params;
        const esDueno = req.user.rol === ROL.DUENO;

        if (!esDueno && !req.user.sucursal_id) {
            throw new BadRequestError('Tu usuario no tiene una sucursal asignada.');
        }

        const consulta = await this.consultaService.obtenerConsultaPorId({
            consultaId,
            opticaId: req.user.optica_id,
            sucursalId: req.user.sucursal_id,
            esDueno,
        });

        res.status(200).json({ success: true, data: consulta });
    }
}

module.exports = ConsultaController;