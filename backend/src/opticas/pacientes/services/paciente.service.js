const {
    BadRequestError,
    NotFoundError,
    ForbiddenError,
} = require('../../../core/utils/errors');
const { ROL } = require('../../constants/roles.constants');

class PacienteService {
    constructor(pacienteRepository) {
        this.pacienteRepository = pacienteRepository;
    }

    /**
     * Resuelve y valida la sucursal a la que el usuario tiene acceso,
     * según su rol. Centraliza la lógica que antes estaba repetida en
     * obtenerSucursalPermitida, crearPaciente y obtenerPacientePorId.
     *
     * - Empleado: su propia sucursal (del token).
     * - Encargado: la sucursal que administra (consulta a BD).
     * - Dueño: debe indicar sucursalId; se valida que pertenezca a su óptica.
     * - Cualquier otro rol: rechazado explícitamente (fail-closed).
     *
     * @param {Object} usuario
     * @param {string} [sucursalId] - Requerido solo para el rol dueño.
     * @returns {Promise<string>} ID de la sucursal permitida.
     * @throws {BadRequestError} Si el dueño no indicó sucursalId.
     * @throws {ForbiddenError} Si el usuario no tiene sucursal asignada/administrada,
     * o si pidió una sucursal distinta a la suya (empleado), o su rol no está contemplado.
     * @throws {NotFoundError} Si la sucursal indicada no pertenece a la óptica del dueño.
     */
    async #resolverSucursalPermitida(usuario, sucursalId) {
        if (usuario.rol === ROL.EMPLEADO) {
            if (!usuario.sucursal_id) {
                throw new ForbiddenError('No tienes una sucursal asignada.');
            }

            // Se mantiene el comportamiento original: si el empleado indica
            // una sucursal distinta a la suya, se rechaza explícitamente.
            if (sucursalId && usuario.sucursal_id !== sucursalId) {
                throw new ForbiddenError('No tienes permisos para acceder a esta sucursal.');
            }

            return usuario.sucursal_id;
        }

        if (usuario.rol === ROL.ENCARGADO) {
            const sucursal = await this.pacienteRepository.buscarSucursalAdministrada(
                usuario.optica_id,
                usuario.id
            );

            if (!sucursal) {
                throw new ForbiddenError('No tienes una sucursal asignada.');
            }

            if (sucursalId && sucursal.id !== sucursalId) {
                throw new ForbiddenError('No tienes permisos para acceder a esta sucursal.');
            }

            return sucursal.id;
        }

        if (usuario.rol === ROL.DUENO) {
            if (!sucursalId) {
                throw new BadRequestError('La sucursal es obligatoria.');
            }

            const sucursal = await this.pacienteRepository.buscarSucursalPorOptica(
                sucursalId,
                usuario.optica_id
            );

            if (!sucursal) {
                throw new NotFoundError('Sucursal no encontrada.');
            }

            return sucursal.id;
        }

        // Fail-closed: cualquier rol no contemplado se rechaza explícitamente.
        // (En el código original, este caso podía colarse sin error en obtenerPacientePorId.)
        throw new ForbiddenError('No tienes permisos para acceder a pacientes.');
    }

    /**
     * Crea un paciente dentro de la sucursal permitida para el usuario.
     *
     * @param {Object} data
     * @param {Object} data.usuario
     * @param {string} [data.sucursalId] - Requerido solo para el rol dueño.
     * @param {string} data.nombre
     * @param {string|null} [data.telefono]
     * @param {string|null} [data.email]
     * @param {Date|null} [data.fechaNacimiento]
     * @returns {Promise<Object>} Paciente creado.
     */
    async crearPaciente({ usuario, sucursalId, nombre, telefono, email, fechaNacimiento }) {
        const sucursalPermitida = await this.#resolverSucursalPermitida(usuario, sucursalId);

        return this.pacienteRepository.crearPaciente({
            sucursalId: sucursalPermitida,
            nombre,
            telefono,
            email,
            fechaNacimiento,
        });
    }

    /**
     * Obtiene los pacientes de una sucursal a la que el usuario tiene acceso.
     *
     * @param {Object} data
     * @param {Object} data.usuario
     * @param {string} data.sucursalId
     * @returns {Promise<Object[]>}
     */
    async obtenerPacientes({ usuario, sucursalId }) {
        const sucursalPermitida = await this.#resolverSucursalPermitida(usuario, sucursalId);

        return this.pacienteRepository.obtenerPacientes(sucursalPermitida);
    }

    /**
     * Obtiene un paciente verificando el alcance de acceso del usuario.
     * Fail-closed: cualquier rol fuera de los tres contemplados es rechazado
     * dentro de #resolverSucursalPermitida, sin llegar a consultar la BD
     * con un valor de sucursal nulo o indefinido.
     *
     * @param {Object} data
     * @param {string} data.id
     * @param {Object} data.usuario
     * @returns {Promise<Object>}
     * @throws {BadRequestError} Si no se proporciona el ID del paciente.
     * @throws {ForbiddenError} Si el usuario no tiene una sucursal asignada o su rol no está contemplado.
     * @throws {NotFoundError} Si el paciente no existe o no pertenece al alcance del usuario.
     */
    async obtenerPacientePorId({ id, usuario }) {
        if (!id) {
            throw new BadRequestError('El ID del paciente es obligatorio.');
        }

        let paciente;

        if (usuario.rol === ROL.DUENO) {
            paciente = await this.pacienteRepository.obtenerPacientePorIdYOptica(id, usuario.optica_id);
        } else {
            const sucursalPermitida = await this.#resolverSucursalPermitida(usuario);
            paciente = await this.pacienteRepository.obtenerPacientePorId(id, sucursalPermitida);
        }

        if (!paciente) {
            throw new NotFoundError('Paciente no encontrado.');
        }

        return paciente;
    }


    /**
     * Actualiza los datos permitidos de un paciente.
     *
     * @param {Object} data
     * @param {string} data.id
     * @param {Object} data.usuario
     * @param {Object} data.cambios
     * @returns {Promise<Object>}
     * @throws {BadRequestError} Si no se proporciona el ID del paciente (vía obtenerPacientePorId).
     * @throws {NotFoundError} Si el paciente no existe o no pertenece al alcance del usuario.
     */
    async actualizarPaciente({ id, usuario, cambios }) {
        const paciente = await this.obtenerPacientePorId({ id, usuario });

        const pacienteActualizado = await this.pacienteRepository.actualizarPaciente(
            id,
            paciente.sucursal_id,
            cambios
        );

        if (!pacienteActualizado) {
            throw new NotFoundError('Paciente no encontrado.');
        }

        return pacienteActualizado;
    }
}

module.exports = PacienteService;