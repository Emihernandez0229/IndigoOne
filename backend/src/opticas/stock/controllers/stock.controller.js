const { resolverSucursal } = require('../../helpers/autorizacion.helper');

class StockController {
    constructor(stockService) {
        this.stockService = stockService;
    }

    async listarStock(req, res) {
        const { sucursalId: sucursalIdQuery, limit, offset, busqueda, bajoMinimo } = req.query;

        const { sucursalId } = resolverSucursal(
            req, sucursalIdQuery, 'Debes indicar la sucursal (sucursalId) a consultar.'
        );

        const { data, paginacion } = await this.stockService.listarStock({
            sucursalId,
            opticaId: req.user.optica_id,
            paginacion: { limit, offset },
            filtros: { busqueda, bajoMinimo },
        });

        res.status(200).json({ success: true, data, paginacion });
    }

    async ajustarStock(req, res) {
        const { productoId } = req.params;
        const { sucursalId: sucursalIdBody, tipo, cantidad, motivo } = req.body;
        
        const { sucursalId } = resolverSucursal(
            req, sucursalIdBody, 'Debes indicar la sucursal (sucursalId) donde se ajusta el stock.'
        );
    
        const resultado = await this.stockService.ajustarStock({
            productoId,
            sucursalId,
            opticaId: req.user.optica_id,
            realizadoPor: req.user.id,
            tipo, cantidad, motivo,
        });
    
        res.status(200).json({ success: true, data: resultado });
    }

    async listarMovimientos(req, res) {
        const { productoId } = req.params;
        const { sucursalId: sucursalIdQuery, limit, offset } = req.query;

        const { sucursalId } = resolverSucursal(
            req, sucursalIdQuery, 'Debes indicar la sucursal (sucursalId) a consultar.'
        );

        const { data, paginacion } = await this.stockService.listarMovimientos({
            productoId,
            sucursalId,
            opticaId: req.user.optica_id,
            paginacion: { limit, offset },
        });

        res.status(200).json({ success: true, data, paginacion });
    }
}

module.exports = StockController;