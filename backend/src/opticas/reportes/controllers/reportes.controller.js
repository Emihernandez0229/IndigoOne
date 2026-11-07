class ReportesController {
    constructor(reportesService) {
        this.reportesService = reportesService;
    }

    async ventas(req, res) {
    const data = await this.reportesService.reporteVentas({
        usuario: req.user,
        filtros: req.query,
    });
    res.status(200).json({ success: true, data });
}

    async servicios(req, res) {
        const data = await this.reportesService.reporteServicios({ usuario: req.user, filtros: req.query });
        res.status(200).json({ success: true, data });
    }

    async clientes(req, res) {
        const data = await this.reportesService.reporteClientes({ 
            usuario: req.user,
            filtros: req.query 
        });
        res.status(200).json({ success: true, data });
    }
    async clientesActividad(req, res) {
        const data = await this.reportesService.reporteClientesActividad({
            usuario: req.user, filtros: req.query,
        });
        res.status(200).json({ success: true, data });
    }
    
    async citas(req, res) {
        const data = await this.reportesService.reporteCitas({
            usuario: req.user, 
            filtros: req.query
        });
        res.status(200).json({ success: true, data });
    }

    async inventario(req, res) {
        const data = await this.reportesService.reporteInventario({
            usuario: req.user,
            filtros: req.query
        });

        res.status(200).json({
            success:true,
            data: data.items,
            resumen:data.resumen,
            paginacion: data.paginacion
        });
    }

    async movimientos(req, res) {
        const data = await this.reportesService.reporteMovimientos({ usuario: req.user, filtros: req.query });
        res.status(200).json({ success: true, data });
    }

    async resumen(req, res) {
        const data = await this.reportesService.reporteResumen({
            usuario: req.user,
            filtros: req.query,
        });
        res.status(200).json({ success: true, data });
}

    async serviciosDetalle(req, res) {
        const data = await this.reportesService.reporteServiciosDetalle({
            usuario: req.user, filtros: req.query,
        });
        res.status(200).json({ success: true, data });
    }
}

module.exports = ReportesController;