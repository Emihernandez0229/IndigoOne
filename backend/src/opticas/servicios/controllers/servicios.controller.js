const { success } = require("zod");

class ServiciosController {
    constructor(serviciosService) {
        this.serviciosService = serviciosService;
    }

    async crearServicio(req, res) {
        const { nombre, codigo, descripcion,categoriaId, precio } = req.body;

        const servicio = await this.serviciosService.crearServicio({
            opticaId: req.user.optica_id,
            creadoPor: req.user.id,
            nombre, codigo, descripcion, categoriaId, precio,
        });

        res.status(201).json({ success: true, data: servicio });
    }

    async listarServicios(req, res) {
        const { limit, offset, activo, busqueda, categoriaId } = req.query;

        const { data, paginacion } = await this.serviciosService.listarServicios({
            opticaId: req.user.optica_id,
            paginacion: { limit, offset },
            filtros: { activo, busqueda, categoriaId },
        });

        res.status(200).json({ success: true, data, paginacion });
    }

    async obtenerServicioPorId(req, res) {
        const servicio = await this.serviciosService.obtenerServicioPorId({
            servicioId: req.params.servicioId,
            opticaId: req.user.optica_id,
        });

        res.status(200).json({ success: true, data: servicio });
    }

    async actualizarServicio(req, res) {
        const servicio = await this.serviciosService.actualizarServicio({
            servicioId: req.params.servicioId,
            opticaId: req.user.optica_id,
            cambios: req.body,
        });

        res.status(200).json({ success: true, data: servicio });
    }

    async cambiarEstadoServicio(req, res) {
        const { activo } = req.body;

        const servicio = await this.serviciosService.cambiarEstadoServicio({
            servicioId: req.params.servicioId,
            opticaId: req.user.optica_id,
            activo,
        });

        res.status(200).json({
            success: true,
            message: activo ? 'Servicio activado correctamente.' : 'Servicio desactivado correctamente.',
            data: servicio,
        });
    }

    async listarCategoriasServicios(req, res){
        const data = await this.serviciosService.listarCategoriasServicios();

        res.status(200).json({success:true, data});
    }
}

module.exports = ServiciosController;