const { success } = require('zod');

class ProductosController {
    constructor(productosService) {
        this.productosService = productosService;
    }

    /**
     * Crea un producto en el catálogo de la óptica.
     *
     * @param {import('express').Request} req
     * @param {import('express').Response} res
     * @returns {Promise<void>}
     */
    async crearProducto(req, res) {
        const { nombre, sku,marca, descripcion,categoriaId, precioVenta, stockMinimo } = req.body;

        const producto = await this.productosService.crearProducto({
            opticaId: req.user.optica_id,
            creadoPor: req.user.id,
            nombre,
            sku,
            marca,
            descripcion,
            categoriaId,
            precioVenta,
            stockMinimo
        });

        res.status(201).json({ success: true, data: producto });
    }


    async listarProductos(req, res) {
        const { limit, offset, activo, busqueda, marca, categoriaId } = req.query;

        const { data, paginacion } = await this.productosService.listarProductos({
            opticaId: req.user.optica_id,
            paginacion: { limit, offset },
            filtros: { activo, busqueda, marca, categoriaId },
        });

        res.status(200).json({ success: true, data, paginacion });
    }

    async obtenerProductoPorId(req, res) {
        const { productoId } = req.params;

        const producto = await this.productosService.obtenerProductoPorId({
            productoId,
            opticaId: req.user.optica_id,
        });

        res.status(200).json({ success:true , data:producto});
    }


    async actualizarProducto(req, res) {
        const { productoId } = req.params;

        const producto = await this.productosService.actualizarProducto({
            productoId,
            opticaId:req.user.optica_id,
            cambios:req.body,
        });

        res.status(200).json({ success:true, data:producto});
    }

    async cambiarEstadoProducto(req, res) {

        const { productoId } = req.params;
        const { activo } = req.body;

        const producto = await this.productosService.cambiarEstadoProducto({
            productoId,
            opticaId: req.user.optica_id,
            activo
        });

        res.status(200).json({
            success:true,
            message:activo ? 'Producto activado correctamente.' : 'Producto desactivado correctamente.',
            data:producto
        })
    }


    async listarCategoriasProductos(req, res) {
        const data = await this.productosService.listarCategoriasProductos();
        res.status(200).json({success:true, data});
    }
}

module.exports = ProductosController;