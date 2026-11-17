const { ROL } = require('../../constants/roles.constants');
const { resolverSucursal } = require('../../helpers/autorizacion.helper');
const { BadRequestError } = require('../../../core/utils/errors');

class VentasController {
    constructor(ventasService) {
        this.ventasService = ventasService;
    }

    #contexto(req) {
        const esDueno = req.user.rol === ROL.DUENO;
        if (!esDueno && !req.user.sucursal_id) {
            throw new BadRequestError('Tu usuario no tiene una sucursal asignada.');
        }
        return { opticaId: req.user.optica_id, sucursalId: req.user.sucursal_id, esDueno };
    }

    async crear(req, res) {
        const { sucursalId: sucursalIdBody, pacienteId, tipoTrabajo, prioridad,
                metodoPago, tasaIva, montoPagado, items } = req.body;

        const { sucursalId } = resolverSucursal(
            req, sucursalIdBody, 'Debes indicar la sucursal (sucursalId) donde se registra la venta.'
        );

        const venta = await this.ventasService.crearVenta({
            sucursalId, opticaId: req.user.optica_id, vendedorId: req.user.id,
            clienteId: pacienteId ?? null,
            tipoTrabajo, prioridad, metodoPago, tasaIva, montoPagado, items,
        });

        res.status(201).json({ success: true, message: 'Venta registrada correctamente.', data: venta });
    }

    async listar(req, res) {
        const { sucursalId: q, pacienteId, estado, tipoTrabajo, busqueda, desde, hasta, limit, offset } = req.query;

        const { sucursalId } = resolverSucursal(req, q, 'Debes indicar la sucursal (sucursalId) a consultar.');

        const { data, paginacion } = await this.ventasService.listarVentas({
            sucursalId, opticaId: req.user.optica_id,
            paginacion: { limit, offset },
            filtros: { clienteId: pacienteId, estado, tipoTrabajo, busqueda, desde, hasta },
        });

        res.status(200).json({ success: true, data, paginacion });
    }

    async obtener(req, res) {
        const venta = await this.ventasService.obtenerVenta({
            ventaId: req.params.ventaId, ...this.#contexto(req),
        });
        res.status(200).json({ success: true, data: venta });
    }

    async liquidar(req, res) {
        const venta = await this.ventasService.liquidar({
            ventaId: req.params.ventaId, monto: req.body.monto, ...this.#contexto(req),
        });
        res.status(200).json({ success: true, message: 'Pago registrado correctamente.', data: venta });
    }

    async cambiarEstado(req, res) {
        const venta = await this.ventasService.cambiarEstado({
            ventaId: req.params.ventaId, nuevoEstado: req.body.estado, ...this.#contexto(req),
        });
        res.status(200).json({ success: true, message: 'Estado actualizado correctamente.', data: venta });
    }

    async cancelar(req, res) {
        const venta = await this.ventasService.cancelarVenta({
            ventaId: req.params.ventaId, usuarioId: req.user.id, ...this.#contexto(req),
        });
        res.status(200).json({ success: true, message: 'Venta cancelada correctamente.', data: venta });
    }
}

module.exports = VentasController;