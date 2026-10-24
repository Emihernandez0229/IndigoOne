const {
    BadRequestError,
    NotFoundError,
    ConflictError,
    InternalServerError,
} = require('../../../core/utils/errors');

const PG_UNIQUE_VIOLATION = '23505';
const PG_FK_VIOLATION = '23503';
const LIMITE_SERVICIOS_DEFECTO = 20;
const LIMITE_SERVICIOS_MAXIMO = 100;

const MENSAJES_UNICIDAD = Object.freeze({
    uq_servicios_optica_codigo: 'Ya existe un servicio con ese código en tu óptica.',
});

class ServiciosService {
    constructor(serviciosRepository) {
        this.serviciosRepository = serviciosRepository;
    }

    #exigirOptica(opticaId) {
        if (!opticaId) {
            throw new BadRequestError('La óptica es obligatoria');
        }
    }

    #traducirErrorBD(error) {
        if (error.code === PG_UNIQUE_VIOLATION) {
            return new ConflictError(MENSAJES_UNICIDAD[error.constraint] ?? 'El servicio ya existe.');
        }
        if (error.code === PG_FK_VIOLATION) {
            return new BadRequestError('La categoría seleccionada no existe.');
        }
        return error;
    }

    async crearServicio({ opticaId, creadoPor, nombre, codigo, descripcion, categoriaId,  precio }) {
        if (!opticaId || !creadoPor) {
            throw new BadRequestError('La óptica y el usuario creador son obligatorios');
        }

        try {
            const servicio = await this.serviciosRepository.crear({
                opticaId, creadoPor, nombre, codigo, descripcion, categoriaId, precio,
            });

            if (!servicio) {
                throw new InternalServerError('No fue posible crear el servicio.');
            }

            return servicio;
        } catch (error) {
            throw this.#traducirErrorBD(error);
        }
    }

    async listarServicios({ opticaId, paginacion = {}, filtros = {} }) {
        this.#exigirOptica(opticaId);

        const limit = Math.min(paginacion.limit ?? LIMITE_SERVICIOS_DEFECTO, LIMITE_SERVICIOS_MAXIMO);
        const offset = paginacion.offset ?? 0;

        const { servicios, total } = await this.serviciosRepository.listar({
            opticaId, filtros, limit, offset,
        });

        return {
            data: servicios,
            paginacion: { total, limit, offset, hasMore: offset + servicios.length < total },
        };
    }

    async obtenerServicioPorId({ servicioId, opticaId }) {
        this.#exigirOptica(opticaId);

        const servicio = await this.serviciosRepository.obtenerPorId(servicioId, opticaId);

        if (!servicio) {
            throw new NotFoundError('El servicio no fue encontrado.');
        }

        return servicio;
    }

    async actualizarServicio({ servicioId, opticaId, cambios }) {
        this.#exigirOptica(opticaId);

        try {
            const servicio = await this.serviciosRepository.actualizar(servicioId, opticaId, cambios);

            if (!servicio) {
                throw new NotFoundError('El servicio no fue encontrado.');
            }

            return servicio;
        } catch (error) {
            throw this.#traducirErrorBD(error);
        }
    }

    async cambiarEstadoServicio({ servicioId, opticaId, activo }) {
        this.#exigirOptica(opticaId);

        const servicio = await this.serviciosRepository.cambiarEstado(servicioId, opticaId, activo);

        if (!servicio) {
            throw new NotFoundError('El servicio no fue encontrado.');
        }

        return servicio;
    }


    async listarCategoriasServicios(){
        return await this.serviciosRepository.listarCategorias();
    }
}

module.exports = ServiciosService;