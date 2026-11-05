const { BadRequestError, NotFoundError, ForbiddenError } = require('../../../core/utils/errors');
const { ROL } = require('../../constants/roles.constants');

class ReportesService {
    constructor(reportesRepository, sucursalesRepository) {
        this.reportesRepository = reportesRepository;
        this.sucursalesRepository = sucursalesRepository;
    }

    /**
     * Resuelve a qué sucursales puede acceder el usuario en este reporte.
     * Dueño: una (sucursalId) o todas (todas=true). Resto: solo la de su token.
     * @returns {Promise<string[]>} ids de sucursal autorizados
     */
    async #resolverSucursales(usuario, { sucursalId, todas }) {
        const opticaId = usuario.optica_id;
        if (!opticaId) throw new BadRequestError('La óptica es obligatoria');

        if (usuario.rol !== ROL.DUENO) {
            if (!usuario.sucursal_id) throw new BadRequestError('Tu usuario no tiene una sucursal asignada.');
            return [usuario.sucursal_id];
        }

        if (todas) {
            const ids = await this.reportesRepository.idsSucursalesDeOptica(opticaId);
            if (ids.length === 0) throw new NotFoundError('La óptica no tiene sucursales.');
            return ids;
        }

        if (!sucursalId) {
            throw new BadRequestError('Indica la sucursal (sucursalId) o usa todas=true.');
        }

        const sucursal = await this.sucursalesRepository.buscarPorId(sucursalId);
        if (!sucursal) throw new NotFoundError('La sucursal no fue encontrada.');
        if (String(sucursal.optica_id) !== String(opticaId)) {
            throw new ForbiddenError('La sucursal no pertenece a la óptica del usuario.');
        }
        return [sucursalId];
    }

    #periodo(f) {
        return f.desde || f.hasta ? 'personalizado' : f.periodo;
    }

    async reporteVentas({ usuario, filtros }) {
        const sucursalIds = await this.#resolverSucursales(usuario, filtros);
        const esEmpleado = usuario.rol === ROL.EMPLEADO;

        // El empleado solo puede ver sus propias ventas, ignore lo que mande
        const vendedorId = esEmpleado ? usuario.id : (filtros.vendedorId ?? null);

        // El empleado no puede agrupar por otros empleados ni por sucursal
        if (esEmpleado && ['sucursal', 'empleado'].includes(filtros.agrupar)) {
            throw new ForbiddenError('No tienes acceso a este desglose.');
        }

        const consulta = {
            sucursalIds,
            vendedorId,
            productoId: filtros.productoId ?? null,
            servicioId: filtros.servicioId ?? null,
            desde: filtros.desde, hasta: filtros.hasta, periodo: filtros.periodo,
        };

        const [resumen, desglose] = await Promise.all([
            this.reportesRepository.ventasResumen(consulta),
            filtros.agrupar
                ? this.reportesRepository.ventasDesglose({ ...consulta, agrupar: filtros.agrupar, limit: filtros.limit })
                : Promise.resolve(null),
        ]);

        return {
            periodo: filtros.desde || filtros.hasta ? 'personalizado' : filtros.periodo,
            sucursales: sucursalIds.length,
            ...resumen,
            agrupar: filtros.agrupar ?? null,
            desglose,
        };
    }


    async reporteServicios({ usuario, filtros }) {
        const sucursalIds = await this.#resolverSucursales(usuario, filtros);
        const consulta = {
            sucursalIds, vendedorId: null,
            servicioId: filtros.servicioId ?? null, limit: filtros.limit,
            desde: filtros.desde, hasta: filtros.hasta, periodo: filtros.periodo,
        };
        const { resumen, ranking } = await this.reportesRepository.servicios(consulta);
        return { periodo: this.#periodo(filtros), sucursales: sucursalIds.length, ...resumen, ranking };
    }

    async reporteClientes({ usuario, filtros }) {
        const sucursalIds = await this.#resolverSucursales(usuario, filtros);
        const datos = await this.reportesRepository.clientes({
            sucursalIds, desde: filtros.desde, hasta: filtros.hasta, periodo: filtros.periodo,
        });
        return { periodo: this.#periodo(filtros), sucursales: sucursalIds.length, ...datos };
    }

    async reporteCitas({ usuario, filtros }) {
        const sucursalIds = await this.#resolverSucursales(usuario, filtros);
        const datos = await this.reportesRepository.citas({
            sucursalIds, estado: filtros.estado ?? null, agrupar: filtros.agrupar ?? null,
            desde: filtros.desde, hasta: filtros.hasta, periodo: filtros.periodo,
        });
        return {
            periodo: this.#periodo(filtros), sucursales: sucursalIds.length,
            agrupar: filtros.agrupar ?? null, ...datos,
        };
    }

    async reporteInventario({ usuario, filtros }) {
        const sucursalIds = await this.#resolverSucursales(usuario, filtros);
        const limit = Math.min(filtros.limit ?? 20, 100);
        const offset = filtros.offset ?? 0;
        
        const { items, total, resumen } = await this.reportesRepository.inventario({
            sucursalIds, opticaId: usuario.optica_id,
            productoId: filtros.productoId ?? null, busqueda: filtros.busqueda ?? null,
            bajoMinimo: filtros.bajoMinimo === true, agotados: filtros.agotados === true,
            limit, offset,
        });
    
        return {
            items, resumen,
            paginacion: { total, limit, offset, hasMore: offset + items.length < total },
        };
    }
    
    async reporteMovimientos({ usuario, filtros }) {
        const sucursalIds = await this.#resolverSucursales(usuario, filtros);
        const datos = await this.reportesRepository.movimientos({
            sucursalIds, opticaId: usuario.optica_id,
            productoId: filtros.productoId ?? null, tipo: filtros.tipo ?? null,
            agrupar: filtros.agrupar ?? null,
            desde: filtros.desde, hasta: filtros.hasta, periodo: filtros.periodo,
            limit: filtros.limit, offset: filtros.offset,
        });
        return { periodo: this.#periodo(filtros), sucursales: sucursalIds.length, agrupar: filtros.agrupar ?? null, ...datos };
    }

    async reporteResumen({ usuario, filtros }) {
        const sucursalIds = await this.#resolverSucursales(usuario, filtros);
        const esEmpleado = usuario.rol === ROL.EMPLEADO;

        const ventas = await this.reportesRepository.ventasResumen({
            sucursalIds,
            vendedorId: esEmpleado ? usuario.id : null,
            productoId: null, servicioId: null,
            desde: filtros.desde, hasta: filtros.hasta, periodo: filtros.periodo,
        });

        const base = { periodo: this.#periodo(filtros), sucursales: sucursalIds.length, ventas };
        if (esEmpleado) return { ...base, citas: null, clientes: null, inventario: null };

        const rango = { desde: filtros.desde, hasta: filtros.hasta, periodo: filtros.periodo };
        const [citas, clientes, inventario] = await Promise.all([
            this.reportesRepository.citas({ sucursalIds, estado: null, agrupar: null, ...rango }),
            this.reportesRepository.clientes({ sucursalIds, ...rango }),
            this.reportesRepository.inventario({
                sucursalIds, opticaId: usuario.optica_id, productoId: null, busqueda: null,
                bajoMinimo: false, agotados: false, limit: 1, offset: 0,
            }),
        ]);

        return { ...base, citas, clientes, inventario: inventario.resumen };
    }
}

module.exports = ReportesService;