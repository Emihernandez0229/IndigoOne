const {
    BadRequestError,
    NotFoundError,
    ForbiddenError,
} = require('../../../core/utils/errors');
const { validarAccesoRecurso } = require('../../helpers/autorizacion.helper');

const LIMITE_CONSULTAS_DEFECTO = 20;
const LIMITE_CONSULTAS_MAXIMO = 100;



class ConsultaService {
    constructor(consultaRepository, sucursalesRepository, pacienteRepository, transactionManager) {
        this.consultasRepository = consultaRepository;
        this.sucursalesRepository = sucursalesRepository;
        this.pacienteRepository = pacienteRepository;
        this.transactionManager = transactionManager;
    }

    async #validarSucursal(sucursalId, opticaId, { validarActiva = true } = {}, client) {
        const sucursal = await this.sucursalesRepository.buscarPorId(sucursalId, client);

        if (!sucursal) throw new NotFoundError('La sucursal no fue encontrada.');
        if (validarActiva && !sucursal.activo) throw new BadRequestError('La sucursal no está activa.');
        if (String(sucursal.optica_id) !== String(opticaId)) {
            throw new ForbiddenError('La sucursal no pertenece a la óptica del usuario.');
        }

        return sucursal;
    }

    async crearConsulta({ sucursalId, opticaId, clienteId, fechaExamen, od = {}, oi = {}, dip, observaciones, registradoPor }) {
        return await this.transactionManager.ejecutar(async (client) => {
            await this.#validarSucursal(sucursalId, opticaId, { validarActiva: true }, client);

            const cliente = await this.pacienteRepository.obtenerPacientePorId(clienteId, sucursalId, client);
            if (!cliente) throw new NotFoundError('El cliente no existe o no pertenece a la sucursal.');

            const consulta = await this.consultasRepository.crearConsulta({
                sucursalId, clienteId, fechaExamen, od, oi, dip, observaciones, registradoPor,
            }, client);

            if (!consulta) throw new InternalServerError('No fue posible registrar la consulta.');

            return consulta;
        });
    }

    async listarConsultasPorSucursal({ sucursalId, opticaId, paginacion = {}, filtros = {} }) {
        const limit = Math.min(paginacion.limit ?? LIMITE_CONSULTAS_DEFECTO, LIMITE_CONSULTAS_MAXIMO);
        const offset = paginacion.offset ?? 0;

        await this.#validarSucursal(sucursalId, opticaId, { validarActiva: false });

        const { consultas, total } = await this.consultasRepository.listarPorSucursal({
            sucursalId, filtros, limit, offset,
        });

        return {
            data: consultas,
            paginacion: { total, limit, offset, hasMore: offset + consultas.length < total },
        };
    }

    async obtenerConsultaPorId({ consultaId, opticaId, sucursalId, esDueno }) {
        const consulta = await this.consultasRepository.obtenerPorId(consultaId);

        if (!consulta) throw new NotFoundError('La consulta no fue encontrada.');

        validarAccesoRecurso(consulta, { opticaId, sucursalId, esDueno }, 'No tienes acceso a esta consulta.');

        return consulta;
    }
}

module.exports = ConsultaService;