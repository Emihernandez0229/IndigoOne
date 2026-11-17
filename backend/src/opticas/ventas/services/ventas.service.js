const {
    BadRequestError,
    NotFoundError,
    ForbiddenError,
} = require('../../../core/utils/errors');

const { validarAccesoRecurso } = require('../../helpers/autorizacion.helper');
const { 
    aCentavos,
    deCentavos,
    calcularTotales 
} = require('../helpers/calculos');

const LIMITE_DEFECTO = 20;
const LIMITE_MAXIMO = 100;

const TRANSICIONES_ESTADO = Object.freeze({
    pendiente: ['en_proceso'],
    en_proceso: ['completada'],
});

class VentasService {
    constructor(ventasRepository, sucursalesRepository, pacienteRepository, stockService, transactionManager) {
        this.ventasRepository = ventasRepository;
        this.sucursalesRepository = sucursalesRepository;
        this.pacienteRepository = pacienteRepository;
        this.stockService = stockService;
        this.transactionManager = transactionManager;
    }

    async #validarSucursal(sucursalId, opticaId, { validarActiva }, client) {
        const sucursal = await this.sucursalesRepository.buscarPorId(sucursalId, client);
        if (!sucursal) throw new NotFoundError('La sucursal no fue encontrada.');
        if (validarActiva && !sucursal.activo) throw new BadRequestError('La sucursal no está activa.');
        if (String(sucursal.optica_id) !== String(opticaId)) {
            throw new ForbiddenError('La sucursal no pertenece a la óptica del usuario.');
        }
    }

    /** Precios y existencias SIEMPRE desde la BD; nunca del cliente. */
    async #prepararLineas({ items, sucursalId, opticaId, client }) {
        const idsProductos = items.filter((i) => i.itemType === 'producto').map((i) => i.productoId);
        const idsServicios = items.filter((i) => i.itemType === 'servicio').map((i) => i.productoId);

        const productos = idsProductos.length
            ? await this.ventasRepository.obtenerProductosParaVenta(idsProductos, opticaId, sucursalId, client) : [];
        const servicios = idsServicios.length
            ? await this.ventasRepository.obtenerServiciosParaVenta(idsServicios, opticaId, client) : [];

        const pPorId = new Map(productos.map((p) => [p.id, p]));
        const sPorId = new Map(servicios.map((s) => [s.id, s]));

        return items.map((item) => {
            if (item.itemType === 'producto') {
                const p = pPorId.get(item.productoId);
                if (!p) throw new NotFoundError('Uno de los productos no existe en tu catálogo.');
                if (!p.activo) throw new BadRequestError(`"${p.nombre}" está desactivado y no puede venderse.`);
                if (Number(p.existencias) < item.cantidad) {
                    throw new BadRequestError(
                        `Existencias insuficientes de "${p.nombre}": hay ${p.existencias} y se piden ${item.cantidad}.`
                    );
                }
                return {
                    tipo: 'producto', productoId: p.id, servicioId: null, codigo: p.sku,
                    descripcion: p.nombre, cantidad: item.cantidad, precioCentavos: aCentavos(p.precio_venta),
                };
            }

            const s = sPorId.get(item.productoId);
            if (!s) throw new NotFoundError('Uno de los servicios no existe en tu catálogo.');
            if (!s.activo) throw new BadRequestError(`"${s.nombre}" está desactivado y no puede venderse.`);
            return {
                tipo: 'servicio', productoId: null, servicioId: s.id, codigo: s.codigo,
                descripcion: s.nombre, cantidad: item.cantidad, precioCentavos: aCentavos(s.precio),
            };
        });
    }

    async crearVenta({ sucursalId, opticaId, vendedorId, clienteId, tipoTrabajo, prioridad,
                       metodoPago, tasaIva, montoPagado, items }) {
        if (!opticaId || !vendedorId) {
            throw new BadRequestError('La óptica y el vendedor son obligatorios');
        }

        const ventaId = await this.transactionManager.ejecutar(async (client) => {
            await this.#validarSucursal(sucursalId, opticaId, { validarActiva: true }, client);

            if (clienteId) {
                const cliente = await this.pacienteRepository.obtenerPacientePorId(clienteId, sucursalId, client);
                if (!cliente) throw new NotFoundError('El paciente no existe o no pertenece a la sucursal.');
            }

            const lineas = await this.#prepararLineas({ items, sucursalId, opticaId, client });
            const totales = calcularTotales(lineas, tasaIva);

            const pagadoCentavos = aCentavos(montoPagado);
            if (pagadoCentavos > totales.total) {
                throw new BadRequestError(
                    `El monto pagado (${deCentavos(pagadoCentavos)}) no puede superar el total (${deCentavos(totales.total)}).`
                );
            }

            const venta = await this.ventasRepository.crearVenta({
                sucursalId, clienteId, vendedorId, tipoTrabajo, prioridad, metodoPago, tasaIva,
                subtotal: deCentavos(totales.subtotal),
                iva: deCentavos(totales.iva),
                total: deCentavos(totales.total),
                montoPagado: deCentavos(pagadoCentavos),
                liquidada: pagadoCentavos === totales.total,
                estadoInicial: tipoTrabajo === 'venta_directa' ? 'completada' : 'pendiente',
            }, client);

            await this.ventasRepository.crearDetalle(venta.id, lineas.map((l) => ({
                productoId: l.productoId, servicioId: l.servicioId, codigo: l.codigo,
                descripcion: l.descripcion, cantidad: l.cantidad,
                precioUnitario: deCentavos(l.precioCentavos),
                subtotal: deCentavos(l.precioCentavos * l.cantidad),
            })), client);

            // Stock: solo productos, ordenados por id para evitar interbloqueos
            const productos = lineas.filter((l) => l.tipo === 'producto')
                .sort((a, b) => a.productoId.localeCompare(b.productoId));

            for (const l of productos) {
                await this.stockService.aplicarMovimiento({
                    productoId: l.productoId, sucursalId, tipo: 'venta', cantidad: l.cantidad,
                    motivo: `Venta ${venta.folio}`, realizadoPor: vendedorId, ventaId: venta.id,
                }, client);
            }

            return venta.id;
        });

        return this.ventasRepository.obtenerDetalle(ventaId);
    }

    async listarVentas({ sucursalId, opticaId, paginacion = {}, filtros = {} }) {
        const limit = Math.min(paginacion.limit ?? LIMITE_DEFECTO, LIMITE_MAXIMO);
        const offset = paginacion.offset ?? 0;

        await this.#validarSucursal(sucursalId, opticaId, { validarActiva: false });

        const { ventas, total } = await this.ventasRepository.listar({ sucursalId, filtros, limit, offset });

        return {
            data: ventas,
            paginacion: { total, limit, offset, hasMore: offset + ventas.length < total },
        };
    }

    async obtenerVenta({ ventaId, opticaId, sucursalId, esDueno }) {
        const alcance = await this.ventasRepository.obtenerAlcance(ventaId);
        if (!alcance) throw new NotFoundError('La venta no fue encontrada.');

        validarAccesoRecurso(alcance, { opticaId, sucursalId, esDueno }, 'No tienes acceso a esta venta.');
        return this.ventasRepository.obtenerDetalle(ventaId);
    }

    /** Paga todo o parte del saldo. Bloquea la venta para que dos pagos no se pisen. */
    async liquidar({ ventaId, monto, opticaId, sucursalId, esDueno }) {
        await this.transactionManager.ejecutar(async (client) => {
            const venta = await this.ventasRepository.bloquearVenta(ventaId, client);
            if (!venta) throw new NotFoundError('La venta no fue encontrada.');

            validarAccesoRecurso(venta, { opticaId, sucursalId, esDueno }, 'No tienes acceso a esta venta.');

            if (venta.estado === 'cancelada') {
                throw new BadRequestError('No se puede registrar un pago en una venta cancelada.');
            }

            const saldo = aCentavos(venta.total) - aCentavos(venta.monto_pagado);
            if (saldo <= 0) throw new BadRequestError('La venta ya está pagada por completo.');

            const montoCentavos = aCentavos(monto);
            if (montoCentavos > saldo) {
                throw new BadRequestError(
                    `El pago (${deCentavos(montoCentavos)}) supera el saldo pendiente (${deCentavos(saldo)}).`
                );
            }

            await this.ventasRepository.registrarPago({
                ventaId,
                nuevoMontoPagado: deCentavos(aCentavos(venta.monto_pagado) + montoCentavos),
                liquidada: montoCentavos === saldo,
            }, client);
        });

        return this.ventasRepository.obtenerDetalle(ventaId);
    }

    /** Avance del trabajo: pendiente → en_proceso → completada. No aplica a venta directa. */
    async cambiarEstado({ ventaId, nuevoEstado, opticaId, sucursalId, esDueno }) {
        await this.transactionManager.ejecutar(async (client) => {
            const venta = await this.ventasRepository.bloquearVenta(ventaId, client);
            if (!venta) throw new NotFoundError('La venta no fue encontrada.');

            validarAccesoRecurso(venta, { opticaId, sucursalId, esDueno }, 'No tienes acceso a esta venta.');

            if (venta.tipo_trabajo === 'venta_directa') {
                throw new BadRequestError('Una venta directa no tiene seguimiento de trabajo.');
            }
            if (venta.estado === nuevoEstado) {
                throw new BadRequestError(`La venta ya se encuentra en estado "${nuevoEstado}".`);
            }
            if (!(TRANSICIONES_ESTADO[venta.estado] ?? []).includes(nuevoEstado)) {
                throw new BadRequestError(`No se puede cambiar de "${venta.estado}" a "${nuevoEstado}".`);
            }

            
            await this.ventasRepository.actualizarEstado(ventaId, nuevoEstado, client);
        });

        return this.ventasRepository.obtenerDetalle(ventaId);
    }

    /** Cancela y repone stock. Los pagos no se tocan: monto_pagado indica lo que hay que devolver. */
    async cancelarVenta({ ventaId, usuarioId, opticaId, sucursalId, esDueno }) {
        await this.transactionManager.ejecutar(async (client) => {
            const venta = await this.ventasRepository.bloquearVenta(ventaId, client);
            if (!venta) throw new NotFoundError('La venta no fue encontrada.');

            validarAccesoRecurso(venta, { opticaId, sucursalId, esDueno }, 'No tienes acceso a esta venta.');

            if (venta.estado === 'cancelada') throw new BadRequestError('La venta ya está cancelada.');

            const productos = await this.ventasRepository.obtenerProductosVendidos(ventaId, client);
            for (const p of productos) {
                await this.stockService.aplicarMovimiento({
                    productoId: p.producto_id, sucursalId: venta.sucursal_id, tipo: 'devolucion',
                    cantidad: p.cantidad, motivo: `Cancelación de venta ${venta.folio}`,
                    realizadoPor: usuarioId, ventaId,
                }, client);
            }

            await this.ventasRepository.marcarCancelada(ventaId, client);
        });

        return this.ventasRepository.obtenerDetalle(ventaId);
    }
}

module.exports = VentasService;