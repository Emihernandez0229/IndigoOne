const {
    BadRequestError,
    NotFoundError,
    ForbiddenError,
} = require('../../../core/utils/errors');

const LIMITE_DEFECTO = 20;
const LIMITE_MAXIMO = 100;

class StockService {
    constructor(stockRepository, productosRepository, sucursalesRepository, transactionManager) {
        this.stockRepository = stockRepository;
        this.productosRepository = productosRepository;
        this.sucursalesRepository = sucursalesRepository;
        this.transactionManager = transactionManager;
    }

    async #validarSucursal(sucursalId, opticaId, { validarActiva }, client) {
        const sucursal = await this.sucursalesRepository.buscarPorId(sucursalId, client);

        if (!sucursal) throw new NotFoundError('La sucursal no fue encontrada.');
        if (validarActiva && !sucursal.activo) throw new BadRequestError('La sucursal no está activa.');
        if (String(sucursal.optica_id) !== String(opticaId)) {
            throw new ForbiddenError('La sucursal no pertenece a la óptica del usuario.');
        }
        return sucursal;
    }

    async #obtenerProducto(productoId, opticaId, client) {
        const producto = await this.productosRepository.obtenerPorId(productoId, opticaId, client);
        if (!producto) throw new NotFoundError('El producto no fue encontrado.');
        return producto;
    }

    async listarStock({ sucursalId, opticaId, paginacion = {}, filtros = {} }) {
        const limit = Math.min(paginacion.limit ?? LIMITE_DEFECTO, LIMITE_MAXIMO);
        const offset = paginacion.offset ?? 0;

        await this.#validarSucursal(sucursalId, opticaId, { validarActiva: false });

        const { items, total } = await this.stockRepository.listar({
            opticaId, sucursalId, filtros, limit, offset,
        });

        return {
            data: items,
            paginacion: { total, limit, offset, hasMore: offset + items.length < total },
        };
    }

    /**
     * Ajusta las existencias de un producto en una sucursal en una sola transacción.
     * Bloquea la fila (FOR UPDATE) para que dos ajustes simultáneos
     * no lean la misma cantidad anterior.
     */
    async ajustarStock({ productoId, sucursalId, opticaId, realizadoPor, tipo, cantidad, motivo }) {
        if (!opticaId || !realizadoPor) {
            throw new BadRequestError('La óptica y el usuario son obligatorios');
        }

        return await this.transactionManager.ejecutar(async (client) => {
            await this.#validarSucursal(sucursalId, opticaId, { validarActiva: true }, client);
            await this.#obtenerProducto(productoId, opticaId, client);

            await this.stockRepository.asegurarFila(productoId, sucursalId, client);
            const actual = await this.stockRepository.bloquearFila(productoId, sucursalId, client);

            let cantidadNueva;
            if (tipo === 'entrada') cantidadNueva = actual.cantidad + cantidad;
            else if (tipo === 'salida') cantidadNueva = actual.cantidad - cantidad;
            else cantidadNueva = cantidad; // ajuste: valor absoluto

            if (cantidadNueva < 0) {
                throw new BadRequestError(
                    `Existencias insuficientes: hay ${actual.cantidad} y se intenta sacar ${cantidad}.`
                );
            }

            const diferencia = Math.abs(cantidadNueva - actual.cantidad);
            let movimiento = null;

            if (diferencia > 0) {
                movimiento = await this.stockRepository.registrarMovimiento({
                    productoId, sucursalId, tipo,
                    cantidad: diferencia,
                    cantidadAnterior: actual.cantidad,
                    cantidadNueva,
                    motivo, realizadoPor,
                }, client);
            }

            const stock = await this.stockRepository.actualizar(
                { productoId, sucursalId, cantidad: cantidadNueva }, client
            );

            return { stock, movimiento };
        });
    }

    async listarMovimientos({ productoId, sucursalId, opticaId, paginacion = {} }) {
        const limit = Math.min(paginacion.limit ?? LIMITE_DEFECTO, LIMITE_MAXIMO);
        const offset = paginacion.offset ?? 0;

        await this.#validarSucursal(sucursalId, opticaId, { validarActiva: false });
        await this.#obtenerProducto(productoId, opticaId);

        const { movimientos, total } = await this.stockRepository.listarMovimientos({
            productoId, sucursalId, limit, offset,
        });

        return {
            data: movimientos,
            paginacion: { total, limit, offset, hasMore: offset + movimientos.length < total },
        };
    }
}

module.exports = StockService;