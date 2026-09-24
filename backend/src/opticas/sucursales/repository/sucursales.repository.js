
class SucursalesRepository {
    constructor(pool) {
        this.pool = pool;
    }


    _exec(client) {
        return client || this.pool;
    }

    /**
     * Crea una sucursal.
     *
     * @param {Object} data - Datos de la sucursal.
     * @param {string} data.opticaId - ID de la óptica.
     * @param {string} data.nombre - Nombre de la sucursal.
     * @param {string|null} data.direccion - Dirección de la sucursal.
     * @param {string|null} data.telefono - Teléfono de la sucursal.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object>} Sucursal creada.
     */
    async crear({ opticaId, nombre, direccion, telefono }, client) {
        const query = `
            INSERT INTO sucursales (
                optica_id,
                nombre,
                direccion,
                telefono
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;

        const { rows } = await this._exec(client).query(query, [
            opticaId,
            nombre,
            direccion || null,
            telefono || null
        ]);

        return rows[0];
    }

    /**
     * Busca una sucursal por ID.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object|null>} Sucursal encontrada o null.
     */
    async buscarPorId(sucursalId, client) {
        const query = `
            SELECT
                id,
                optica_id,
                nombre,
                direccion,
                telefono,
                activo
            FROM sucursales
            WHERE id = $1
        `;

        const { rows } = await this._exec(client).query(query, [
            sucursalId
        ]);

        return rows[0] || null;
    }

    /**
     * Busca un usuario perteneciente a una óptica.
     *
     * @param {string} opticaUsuarioId - ID del usuario.
     * @param {string} opticaId - ID de la óptica.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object|null>} Usuario encontrado o null.
     */
    async buscarUsuarioPorId(opticaUsuarioId, opticaId, client) {
        const query = `
            SELECT
                id,
                optica_id,
                nombre,
                usuario,
                rol,
                activo
            FROM optica_usuarios
            WHERE id = $1
              AND optica_id = $2
        `;

        const { rows } = await this._exec(client).query(query, [
            opticaUsuarioId,
            opticaId
        ]);

        return rows[0] || null;
    }

    /**
     * Busca el gerente asignado a una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object|null>} Asignación encontrada o null.
     */
    async buscarGerentePorSucursal(sucursalId, client) {
        const query = `
            SELECT
                id,
                sucursal_id,
                optica_usuario_id
            FROM sucursal_gerentes
            WHERE sucursal_id = $1
        `;

        const { rows } = await this._exec(client).query(query, [
            sucursalId
        ]);

        return rows[0] || null;
    }

    /**
     * Busca la sucursal administrada por un gerente.
     *
     * @param {string} opticaUsuarioId - ID del usuario.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object|null>} Asignación encontrada o null.
     */
    async buscarSucursalGerente(opticaUsuarioId, client) {
        const query = `
            SELECT
                id,
                sucursal_id,
                optica_usuario_id
            FROM sucursal_gerentes
            WHERE optica_usuario_id = $1
        `;

        const { rows } = await this._exec(client).query(query, [
            opticaUsuarioId
        ]);

        return rows[0] || null;
    }

    /**
     * Asigna un gerente a una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} opticaUsuarioId - ID del usuario.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object>} Relación creada.
     */
    async asignarGerente(sucursalId, opticaUsuarioId, client) {
        const query = `
            INSERT INTO sucursal_gerentes (
                sucursal_id,
                optica_usuario_id
            )
            VALUES ($1, $2)
            RETURNING id, sucursal_id, optica_usuario_id, created_at
        `;

        const { rows } = await this._exec(client).query(query, [
            sucursalId,
            opticaUsuarioId
        ]);

        return rows[0];
    }

    /**
     * Obtiene los usuarios encargados disponibles para ser gerentes.
     *
     * @param {string} opticaId - ID de la óptica.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Array>} Lista de usuarios disponibles.
     */
    async listarGerentesDisponibles(opticaId, client) {
        const query = `
            SELECT
                ou.id,
                ou.nombre,
                ou.usuario,
                ou.rol
            FROM optica_usuarios ou
            WHERE ou.optica_id = $1
              AND ou.rol = 'encargado'
              AND ou.activo = TRUE
              AND NOT EXISTS (
                  SELECT 1
                  FROM sucursal_gerentes sg
                  WHERE sg.optica_usuario_id = ou.id
              )
            ORDER BY ou.nombre
        `;

        const { rows } = await this._exec(client).query(query, [
            opticaId
        ]);

        return rows;
    }
    /**
     * Obtiene las sucursales de una óptica.
     *
     * @param {string} opticaId - ID de la óptica.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Array>} Lista de sucursales.
     */
    async listarSucursales(opticaId, client) {
        const query = `
            SELECT
                id,
                optica_id,
                nombre,
                direccion,
                telefono,
                activo,
                created_at
            FROM sucursales
            WHERE optica_id = $1
            ORDER BY created_at DESC
        `;

        const { rows } = await this._exec(client).query(query, [
            opticaId
        ]);

        return rows;
    }


    /**
     * Busca una sucursal por nombre dentro de una óptica.
     *
     * @param {string} nombre - Nombre de la sucursal.
     * @param {string} opticaId - ID de la óptica.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object|null>} Sucursal encontrada o null.
     */
    async buscarPorNombre(nombre, opticaId, client) {
        const query = `
            SELECT
                id,
                optica_id,
                nombre,
                direccion,
                telefono,
                activo,
                created_at
            FROM sucursales
            WHERE nombre = $1
              AND optica_id = $2
            LIMIT 1
        `;
    
        const { rows } = await this._exec(client).query(query, [
            nombre,
            opticaId
        ]);
    
        return rows[0] || null;
    }

    /**
     * Actualiza los datos de una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {Object} data - Datos actualizados de la sucursal.
     * @param {string} data.nombre - Nombre de la sucursal.
     * @param {string|null} data.direccion - Dirección de la sucursal.
     * @param {string|null} data.telefono - Teléfono de la sucursal.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object>} Sucursal actualizada.
    */
    async actualizar( sucursalId,{ nombre, direccion, telefono },client) {
        const query = `
            UPDATE sucursales
            SET
                nombre = $1,
                direccion = $2,
                telefono = $3
            WHERE id = $4
            RETURNING
                id,
                optica_id,
                nombre,
                direccion,
                telefono,
                activo,
                created_at
        `;

        const { rows } = await this._exec(client).query(query, [
            nombre,
            direccion,
            telefono,
            sucursalId
        ]);

        return rows[0] || null;
    }


    /**
    * Desactiva una sucursal.
    *
    * @param {string} sucursalId - ID de la sucursal.
    * @param {string} opticaId - ID de la óptica.
    * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
    * @returns {Promise<Object|null>} Sucursal desactivada o null.
    */
    async desactivarSucursal(sucursalId, opticaId, client) {
        const query = `
            UPDATE sucursales
            SET activo = FALSE
            WHERE id=$1
            AND optica_id=$2
            RETURNING
                id,
                optica_id,
                nombre,
                direccion,
                telefono,
                activo,
                created_at
        `;

        const { rows } = await this._exec(client).query(query, [
            sucursalId,
            opticaId
        ]);

        return rows[0] || null;
    }

    /**
     * Activa una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} opticaId - ID de la óptica.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object|null>} Sucursal activada o null.
    */
    async activar(sucursalId, opticaId, client) {
        const query = `
            UPDATE sucursales
            SET activo = TRUE
            WHERE id = $1
              AND optica_id = $2
            RETURNING
                id,
                optica_id,
                nombre,
                direccion,
                telefono,
                activo,
                created_at
        `;

        const { rows } = await this._exec(client).query(query, [
            sucursalId,
            opticaId
        ]);

        return rows[0] || null;
    }

    /**
     * Cambia el gerente asignado a una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} opticaUsuarioId - ID del nuevo gerente.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object|null>} Nueva asignación de gerente o null.
    */
    async cambiarGerente(sucursalId, opticaUsuarioId, client) {
        const query = `
            UPDATE sucursal_gerentes
            SET optica_usuario_id = $1
            WHERE sucursal_id = $2
            RETURNING
                id,
                sucursal_id,
                optica_usuario_id,
                created_at
        `;

        const { rows } = await this._exec(client).query(query, [
            opticaUsuarioId,
            sucursalId
        ]);

        return rows[0] || null;
    }


    /**
     * Asigna una sucursal a un usuario.
     * @param {string} opticaUsuarioId - ID del usuario.
     * @param {string} sucursalId - ID de la sucursal.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object|null>} Usuario actualizado o null.
     */
    async asignarSucursalAUsuario(
        opticaUsuarioId,
        sucursalId,
        client
    ) {
        const query = `
            UPDATE optica_usuarios
            SET sucursal_id = $1
            WHERE id = $2
            RETURNING
                id,
                optica_id,
                sucursal_id,
                nombre,
                usuario,
                rol,
                activo
        `;

        const { rows } = await this._exec(client).query(query, [
            sucursalId,
            opticaUsuarioId
        ]);

        return rows[0] || null;
    }    



    /**
     * Quita la sucursal asignada a un usuario.
     * @param {string} opticaUsuarioId - ID del usuario.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object|null>} Usuario actualizado o null.
     */
    async quitarSucursalAUsuario(opticaUsuarioId, client) {
        const query = `
            UPDATE optica_usuarios
            SET sucursal_id = NULL
            WHERE id = $1
            RETURNING
                id,
                optica_id,
                sucursal_id,
                nombre,
                usuario,
                rol,
                activo
        `;
    
        const { rows } = await this._exec(client).query(query, [
            opticaUsuarioId
        ]);
    
        return rows[0] || null;
    }
}

module.exports = SucursalesRepository;