const {
    BadRequestError,
    NotFoundError,
    ForbiddenError
} = require('../../../core/utils/errors');

class PacienteService {
    constructor(pacienteRepository) {
        this.pacienteRepository = pacienteRepository;
    }


    /**
     * Verifica que el usuario tenga permiso para acceder a una sucursal.
     * @param {Object} usuario - Usuario autenticado.
     * @param {string} sucursalId - ID de la sucursal solicitada.
     * @returns {Promise<string>} ID de la sucursal permitida.
     * @throws {BadRequestError} Si no se proporciona una sucursal.
     * @throws {ForbiddenError} Si el usuario no tiene permisos sobre la sucursal.
     * @throws {NotFoundError} Si la sucursal no pertenece a la óptica del dueño.
     */
    async obtenerSucursalPermitida(usuario, sucursalId) {
        if (!sucursalId) {
            throw new BadRequestError(
                'La sucursal es obligatoria'
            );
        }

        if (usuario.rol === 'empleado') {
            if (usuario.sucursal_id !== sucursalId) {
                throw new ForbiddenError(
                    'No tienes permisos para acceder a esta sucursal'
                );
            }

            return sucursalId;
        }

        if (usuario.rol === 'encargado') {
            const sucursal =
                await this.pacienteRepository.buscarSucursalAdministrada(
                    usuario.optica_id,
                    usuario.id
                );

            if (!sucursal) {
                throw new ForbiddenError(
                    'No tienes una sucursal asignada'
                );
            }

            if (sucursal.id !== sucursalId) {
                throw new ForbiddenError(
                    'No tienes permisos para acceder a esta sucursal'
                );
            }

            return sucursal.id;
        }

        if (usuario.rol === 'dueno') {
            const sucursal =
                await this.pacienteRepository.buscarSucursalPorOptica(
                    sucursalId,
                    usuario.optica_id
                );

            if (!sucursal) {
                throw new NotFoundError('Sucursal');
            }

            return sucursal.id;
        }

        throw new ForbiddenError(
            'No tienes permisos para acceder a pacientes'
        );
    }


    /**
     * Crea un paciente dentro de la sucursal permitida para el usuario.
     * @param {Object} datos - Datos necesarios para crear el paciente.
     * @param {Object} datos.usuario - Usuario autenticado.
     * @param {string} datos.sucursalId - ID de la sucursal.
     * @param {string} datos.nombre - Nombre del paciente.
     * @param {string|null} datos.telefono - Teléfono del paciente.
     * @param {string|null} datos.email - Correo electrónico del paciente.
     * @param {Date|null} datos.fechaNacimiento - Fecha de nacimiento del paciente.
     * @returns {Promise<Object>} Paciente creado.
     * @throws {ForbiddenError} Si el usuario no tiene permisos para crear pacientes.
     */
    async crearPaciente({
        usuario,
        sucursalId,
        nombre,
        telefono,
        email,
        fechaNacimiento
    }) {
        if (usuario.rol === 'empleado') {
            if (!usuario.sucursal_id) {
                throw new ForbiddenError( 'No tienes una sucursal asignada');
            }

            return this.pacienteRepository.crearPaciente({
                sucursalId: usuario.sucursal_id,
                nombre,
                telefono,
                email,
                fechaNacimiento
            });
        }

        if (usuario.rol === 'encargado') {
            const sucursal = await this.pacienteRepository.buscarSucursalAdministrada(
                    usuario.optica_id,
                    usuario.id
                );

            if (!sucursal) {
                throw new ForbiddenError( 'No tienes una sucursal asignada');
            }

            return this.pacienteRepository.crearPaciente({
                sucursalId: sucursal.id,
                nombre,
                telefono,
                email,
                fechaNacimiento
            });
        }

        if (usuario.rol === 'dueno') {
            const sucursalPermitida = await this.obtenerSucursalPermitida(
                    usuario,
                    sucursalId
                );

            return this.pacienteRepository.crearPaciente({
                sucursalId: sucursalPermitida,
                nombre,
                telefono,
                email,
                fechaNacimiento
            });
        }

        throw new ForbiddenError( 'No tienes permisos para crear pacientes');
    }


    /**
     * Obtiene los pacientes de una sucursal a la que el usuario tiene acceso.
     * @param {Object} datos - Datos necesarios para obtener los pacientes.
     * @param {Object} datos.usuario - Usuario autenticado.
     * @param {string} datos.sucursalId - ID de la sucursal.
     * @returns {Promise<Object[]>} Lista de pacientes de la sucursal.
     * @throws {BadRequestError} Si no se proporciona una sucursal.
     * @throws {ForbiddenError} Si el usuario no tiene permisos sobre la sucursal.
     * @throws {NotFoundError} Si la sucursal no pertenece a la óptica del dueño.
     */
    async obtenerPacientes({ usuario, sucursalId }) {
        const sucursalPermitida = await this.obtenerSucursalPermitida(
                usuario,
                sucursalId
            );

        return this.pacienteRepository.obtenerPacientes(
            sucursalPermitida
        );
    }



    /**
     * Obtiene un paciente verificando el alcance de acceso del usuario.
     * @param {Object} datos - Datos necesarios para obtener el paciente.
     * @param {string} datos.id - ID del paciente.
     * @param {Object} datos.usuario - Usuario autenticado.
     * @returns {Promise<Object>} Paciente encontrado.
     * @throws {BadRequestError} Si no se proporciona el ID del paciente.
     * @throws {ForbiddenError} Si el usuario no tiene una sucursal asignada.
     * @throws {NotFoundError} Si el paciente no existe o no pertenece al alcance del usuario.
     */
    async obtenerPacientePorId({ id, usuario }) {
        if (!id) {
            throw new BadRequestError('El ID del paciente es obligatorio');
        }

        const sucursalPermitida =
            usuario.rol === 'empleado'
                ? usuario.sucursal_id
                : usuario.rol === 'encargado'
                    ? (
                        await this.pacienteRepository
                            .buscarSucursalAdministrada(
                                usuario.optica_id,
                                usuario.id
                            )
                    )?.id
                    : null;

        if (usuario.rol === 'empleado' && !sucursalPermitida) {
            throw new ForbiddenError(
                'No tienes una sucursal asignada'
            );
        }

        if (usuario.rol === 'encargado' && !sucursalPermitida) {
            throw new ForbiddenError(
                'No tienes una sucursal asignada'
            );
        }

        if (usuario.rol === 'dueno') {
            const paciente = await this.pacienteRepository.obtenerPacientePorIdYOptica(
                id,
                usuario.optica_id
            );

            if (!paciente) {
                throw new NotFoundError('Paciente');
            }

            return paciente;
        }

        const paciente = await this.pacienteRepository.obtenerPacientePorId(
            id,
            sucursalPermitida
        );

        if (!paciente) {
            throw new NotFoundError('Paciente');
        }

        return paciente;
    }


    /**
     * Actualiza los datos permitidos de un paciente.
     * @param {Object} datos - Datos necesarios para actualizar el paciente.
     * @param {string} datos.id - ID del paciente.
     * @param {Object} datos.usuario - Usuario autenticado.
     * @param {Object} datos.cambios - Campos que serán actualizados.
     * @returns {Promise<Object>} Paciente actualizado.
     * @throws {BadRequestError} Si no se proporciona el ID del paciente.
     * @throws {NotFoundError} Si el paciente no existe o no pertenece al alcance del usuario.
     */
    async actualizarPaciente({  id, usuario, cambios}) {
        if (!id) {
            throw new BadRequestError('El ID del paciente es obligatorio');
        }

        const paciente = await this.obtenerPacientePorId({
                id,
                usuario
            });

        const sucursalId =
            paciente.sucursal_id;

        const pacienteActualizado = await this.pacienteRepository.actualizarPaciente(
                id,
                sucursalId,
                cambios
            );

        if (!pacienteActualizado) {
            throw new NotFoundError('Paciente');
        }

        return pacienteActualizado;
    }
}

module.exports = PacienteService;