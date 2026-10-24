const {
    BadRequestError, NotFoundError, ConflictError, InternalServerError,
} = require('../../../core/utils/errors');

const PG_UNIQUE_VIOLATION = '23505';
const PG_FK_VIOLATION = '23503';
const LIMITE_DEFECTO = 20;
const LIMITE_MAXIMO = 100;

const MENSAJES_UNICIDAD = Object.freeze({
    uq_productos_optica_sku: 'Ya existe un producto con ese SKU en tu óptica.',
});

class ProductosService {
    constructor(productosRepository) {
        this.productosRepository = productosRepository;
    }

    #exigirOptica(opticaId) {
        if (!opticaId) throw new BadRequestError('La óptica es obligatoria');
    }

    #traducirErrorBD(error) {
        if (error.code === PG_UNIQUE_VIOLATION) {
            return new ConflictError(MENSAJES_UNICIDAD[error.constraint] ?? 'El producto ya existe.');
        }
        if (error.code === PG_FK_VIOLATION) {
            return new BadRequestError('La categoría seleccionada no existe.');
        }
        return error;
    }

    async crearProducto({ opticaId, creadoPor, nombre, sku, marca, descripcion, categoriaId, precioVenta, stockMinimo }) {
        if (!opticaId || !creadoPor) {
            throw new BadRequestError('La óptica y el usuario creador son obligatorios');
        }

        try {
            const producto = await this.productosRepository.crear({
                opticaId, creadoPor, nombre, sku, marca, descripcion, categoriaId, precioVenta, stockMinimo,
            });
            if (!producto) throw new InternalServerError('No fue posible crear el producto.');
            return producto;
        } catch (error) {
            throw this.#traducirErrorBD(error);
        }
    }

    async listarProductos({ opticaId, paginacion = {}, filtros = {} }) {
        this.#exigirOptica(opticaId);

        const limit = Math.min(paginacion.limit ?? LIMITE_DEFECTO, LIMITE_MAXIMO);
        const offset = paginacion.offset ?? 0;

        const { productos, total } = await this.productosRepository.listar({
            opticaId, filtros, limit, offset,
        });

        return {
            data: productos,
            paginacion: { total, limit, offset, hasMore: offset + productos.length < total },
        };
    }

    async obtenerProductoPorId({ productoId, opticaId }) {
        this.#exigirOptica(opticaId);

        const producto = await this.productosRepository.obtenerPorId(productoId, opticaId);
        if (!producto) throw new NotFoundError('El producto no fue encontrado.');
        return producto;
    }

    async actualizarProducto({ productoId, opticaId, cambios }) {
        this.#exigirOptica(opticaId);

        try {
            const producto = await this.productosRepository.actualizarProducto(productoId, opticaId, cambios);
            if (!producto) throw new NotFoundError('El producto no fue encontrado.');
            return producto;
        } catch (error) {
            throw this.#traducirErrorBD(error);
        }
    }

    async cambiarEstadoProducto({ productoId, opticaId, activo }) {
        this.#exigirOptica(opticaId);

        const producto = await this.productosRepository.cambiarEstado(productoId, opticaId, activo);
        if (!producto) throw new NotFoundError('El producto no fue encontrado.');
        return producto;
    }

    async listarCategoriasProductos() {
        return this.productosRepository.listarCategorias();
    }
}

module.exports = ProductosService;