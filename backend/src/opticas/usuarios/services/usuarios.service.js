const bcrypt = require('bcrypt');

const {
    NotFoundError,
    ForbiddenError,
    ConflictError
} = require('../../../core/utils/errors');

const {
    generarCredencialUnica
} = require('../../../core/utils/credenciales');

const {
    existeUsuarioGlobal,
    registrarCredencialGlobal
} = require('../../../core/services/credenciales.service');

const SALT_ROUNDS = 10;

class UsuarioService {

    constructor(usuariosRepository, transactionManager) {
        this.usuariosRepository = usuariosRepository;
        this.transactionManager = transactionManager;
    }

    /**
     * Traduce la violación de unicidad del email (PostgreSQL 23505)
     * a un ConflictError. Cualquier otro error se relanza tal cual.
     *
     * @param {Error} error - Error capturado.
     * @throws {ConflictError|Error}
     */
    _manejarErrorUnico(error) {
        if (error && error.code === '23505' && /email/i.test(error.constraint || '')) {
            throw new ConflictError('Ya existe un usuario con ese correo electrónico');
        }
        throw error;
    }

    /**
     * Crea un gerente (encargado) con credencial provisional.
     *
     * @param {Object} data - Datos necesarios para crear el encargado.
     * @param {string} data.opticaId - ID de la óptica.
     * @param {string} data.nombre - Nombre del usuario.
     * @param {string|null} [data.telefono] - Teléfono del usuario.
     * @param {string|null} [data.email] - Correo electrónico del usuario.
     * @param {string} data.creadoPorId - ID del usuario que realiza el alta.
     * @returns {Promise<Object>} Usuario creado con su credencial provisional.
     */
    async crearGerente({ opticaId, nombre, telefono, email, creadoPorId }) {

        const credencial = await generarCredencialUnica(
            'GTE',
            existeUsuarioGlobal
        );

        const passwordHash = await bcrypt.hash(
            credencial,
            SALT_ROUNDS
        );

        try {
            return await this.transactionManager.ejecutar(async (client) => {

                const nuevoUsuario = await this.usuariosRepository.crearUsuarioOptica(
                    {
                        opticaId,
                        sucursalId: null,
                        nombre,
                        telefono,
                        email,
                        usuario: credencial,
                        passwordHash,
                        rol: 'encargado',
                        creadoPorId
                    },
                    client
                );

                await registrarCredencialGlobal(client, {
                    usuario: credencial,
                    tipo: 'optica',
                    referenciaId: nuevoUsuario.id
                });

                return {
                    ...nuevoUsuario,
                    credencial_provisional: credencial
                };
            });
        } catch (error) {
            this._manejarErrorUnico(error);
        }
    }

    /**
     * Crea un empleado en una sucursal.
     * Un dueño puede crear empleados en cualquier sucursal de su óptica.
     * Un encargado únicamente puede crear empleados en la sucursal que gerencia.
     *
     * @param {Object} data - Datos necesarios para crear el empleado.
     * @param {string} data.opticaId - ID de la óptica.
     * @param {string} data.sucursalId - ID de la sucursal.
     * @param {string} data.nombre - Nombre del empleado.
     * @param {string|null} [data.telefono] - Teléfono del empleado.
     * @param {string|null} [data.email] - Correo electrónico del empleado.
     * @param {Object} data.creador - Usuario autenticado que realiza el alta.
     * @returns {Promise<Object>} Empleado creado con su credencial provisional.
     */
    async crearEmpleado({ opticaId, sucursalId, nombre, telefono, email, creador }) {

        try {
            return await this.transactionManager.ejecutar(async (client) => {

                const sucursal = await this.usuariosRepository.buscarSucursalActivaPorOptica(
                    sucursalId,
                    opticaId,
                    client
                );

                if (!sucursal) {
                    throw new NotFoundError('La sucursal no existe en tu óptica');
                }

                if (creador.rol === 'encargado') {
                    const asignacion = await this.usuariosRepository.buscarAsignacionesDeGerente(
                        sucursalId,
                        creador.id,
                        client
                    );

                    if (!asignacion) {
                        throw new ForbiddenError('Solo puedes dar de alta empleados de la sucursal que gerencias');
                    }
                }

                const credencial = await generarCredencialUnica(
                    'EMP',
                    existeUsuarioGlobal
                );

                const passwordHash = await bcrypt.hash(
                    credencial,
                    SALT_ROUNDS
                );

                const nuevoUsuario = await this.usuariosRepository.crearUsuarioOptica(
                    {
                        opticaId,
                        sucursalId,
                        nombre,
                        telefono,
                        email,
                        usuario: credencial,
                        passwordHash,
                        rol: 'empleado',
                        creadoPorId: creador.id
                    },
                    client
                );

                await registrarCredencialGlobal(client, {
                    usuario: credencial,
                    tipo: 'optica',
                    referenciaId: nuevoUsuario.id
                });

                return {
                    ...nuevoUsuario,
                    credencial_provisional: credencial
                };
            });
        } catch (error) {
            this._manejarErrorUnico(error);
        }
    }

    /**
     * Obtiene los usuarios que el usuario autenticado tiene permitido consultar.
     *
     * @param {Object} usuarioAutenticado - Datos del usuario autenticado.
     * @param {string} usuarioAutenticado.id - ID del usuario autenticado.
     * @param {string} usuarioAutenticado.optica_id - ID de la óptica.
     * @param {string} usuarioAutenticado.rol - Rol del usuario autenticado.
     * @returns {Promise<Array>} Usuarios disponibles para consulta.
     */
    async listarUsuarios({ id, optica_id: opticaId, rol }) {
        if (rol === 'dueno') {
            return this.usuariosRepository.listarUsuariosPorOptica(opticaId);
        }

        if (rol === 'encargado') {
            const sucursal = await this.usuariosRepository.buscarSucursalAdministrada(
                opticaId,
                id
            );

            if (!sucursal) {
                throw new ForbiddenError('No tienes una sucursal asignada');
            }

            return this.usuariosRepository.listarUsuariosPorSucursal(
                opticaId,
                sucursal.id
            );
        }

        throw new ForbiddenError('No tienes permisos para consultar usuarios');
    }

    /**
     * Obtiene un usuario por su ID, validando permisos según el rol.
     *
     * @param {Object} datos - Datos de la consulta.
     * @param {string} datos.usuarioId - ID del usuario a consultar.
     * @param {string} datos.id - ID del usuario autenticado.
     * @param {string} datos.optica_id - ID de la óptica.
     * @param {string} datos.rol - Rol del usuario autenticado.
     * @returns {Promise<Object>} Usuario encontrado.
     */
    async buscarUsuarioPorId({ usuarioId, id, optica_id: opticaId, rol }) {

        const usuario = await this.usuariosRepository.buscarUsuarioPorIdYOptica(
            usuarioId,
            opticaId
        );

        if (!usuario) {
            throw new NotFoundError('Usuario');
        }

        if (rol === 'dueno') {
            return usuario;
        }

        if (rol === 'encargado') {
            const sucursal = await this.usuariosRepository.buscarSucursalAdministrada(
                opticaId,
                id
            );

            if (!sucursal) {
                throw new ForbiddenError('No tienes una sucursal asignada');
            }

            if (usuario.sucursal_id !== sucursal.id) {
                throw new ForbiddenError('No tienes permiso para consultar este usuario');
            }

            return usuario;
        }

        throw new ForbiddenError('No tienes permiso para consultar usuarios');
    }

    /**
     * Actualiza los datos permitidos de un usuario
     * (nombre, teléfono, email y estado activo).
     *
     * @param {Object} datos - Datos de la actualización.
     * @param {string} datos.usuarioId - ID del usuario a modificar.
     * @param {string} datos.id - ID del usuario autenticado.
     * @param {string} datos.optica_id - ID de la óptica.
     * @param {string} datos.rol - Rol del usuario autenticado.
     * @param {Object} datos.cambios - Datos que se actualizarán.
     * @returns {Promise<Object>} Usuario actualizado.
     */
    async actualizarUsuario({ usuarioId, id, optica_id: opticaId, rol, cambios }) {

        if (rol !== 'dueno' && rol !== 'encargado') {
            throw new ForbiddenError('No tienes permisos para modificar usuarios');
        }

        const usuario = await this.usuariosRepository.buscarUsuarioPorIdYOptica(
            usuarioId,
            opticaId
        );

        if (!usuario) {
            throw new NotFoundError('Usuario');
        }

        if (rol === 'encargado') {
            const sucursal = await this.usuariosRepository.buscarSucursalAdministrada(
                opticaId,
                id
            );

            if (!sucursal) {
                throw new ForbiddenError('No tienes una sucursal asignada');
            }

            if (usuario.sucursal_id !== sucursal.id) {
                throw new ForbiddenError('No tienes permisos para modificar este usuario');
            }
        }

        try {
            return await this.usuariosRepository.actualizarUsuario(
                usuarioId,
                opticaId,
                cambios
            );
        } catch (error) {
            this._manejarErrorUnico(error);
        }
    }
}

module.exports = UsuarioService;