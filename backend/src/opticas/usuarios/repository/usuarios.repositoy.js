
class UsuarioRepository {
    constructor(pool) {
        this.pool = pool;
    }

    _exec(client) {
        return client || this.pool;
    }

    /**
     * Busca una sucursal activa perteneciente a una óptica.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} opticaId - ID de la óptica.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object|null>} Sucursal encontrada o null.
     */
    async buscarSucursalActivaPorOptica(sucursalId, opticaId, client) {
        const query = `
            SELECT
                id,
                optica_id,
                nombre,
                activo
            FROM sucursales
            WHERE id = $1
              AND optica_id = $2
              AND activo = TRUE
        `;

        const { rows } = await this._exec(client).query(query, [
            sucursalId,
            opticaId
        ]);

        return rows[0] || null;
    }

    /**
     * Busca la asignación de un usuario como gerente de una sucursal.
     *
     * @param {string} sucursalId - ID de la sucursal.
     * @param {string} opticaUsuarioId - ID del usuario de la óptica.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object|null>} Asignación encontrada o null.
     */
    async buscarAsignacionesDeGerente(
        sucursalId,
        opticaUsuarioId,
        client
    ) {
        const query = `
            SELECT
                id,
                sucursal_id,
                optica_usuario_id
            FROM sucursal_gerentes
            WHERE sucursal_id = $1
              AND optica_usuario_id = $2
        `;

        const { rows } = await this._exec(client).query(query, [
            sucursalId,
            opticaUsuarioId
        ]);

        return rows[0] || null;
    }

    /**
     * Crea un usuario perteneciente a una óptica.
     *
     * @param {Object} data - Datos del usuario.
     * @param {string} data.opticaId - ID de la óptica.
     * @param {string|null} data.sucursalId - ID de la sucursal.
     * @param {string} data.nombre - Nombre del usuario.
     * @param {string} data.usuario - Credencial de acceso.
     * @param {string} data.passwordHash - Contraseña cifrada.
     * @param {string} data.rol - Rol del usuario.
     * @param {string} data.creadoPorId - ID del usuario que realiza el alta.
     * @param {Object} [client] - Cliente de PostgreSQL para transacciones.
     * @returns {Promise<Object>} Usuario creado.
     */
    async crearUsuarioOptica(
        {
            opticaId,
            sucursalId,
            nombre,
            usuario,
            passwordHash,
            rol,
            creadoPorId
        },
        client
    ) {
        const query = `
            INSERT INTO optica_usuarios (
                optica_id,
                sucursal_id,
                nombre,
                usuario,
                password_hash,
                rol,
                dado_de_alta_por
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;

        const { rows } = await this._exec(client).query(query, [
            opticaId,
            sucursalId || null,
            nombre,
            usuario,
            passwordHash,
            rol,
            creadoPorId
        ]);

        return rows[0];
    }



    /**
    * Obtiene todos los usuarios de una óptica.
    *
    * @param {string} opticaId - ID de la óptica.
    * @param {Object} client - Cliente de PostgreSQL opcional.
    * @returns {Promise<Array>} Usuarios encontrados.
    */
    async listarUsuariosPorOptica(opticaId,client) {

        const query = `
            SELECT
                id,
                optica_id,
                sucursal_id,
                nombre,
                usuario,
                rol,
                activo,
                dado_de_alta_por,
                created_at
            FROM optica_usuarios
            WHERE optica_id = $1
            ORDER BY nombre ASC, created_at ASC
        `;

        const { rows } = await this._exec(client).query(query, [
            opticaId
        ]);

        return rows;
        
    }

    /**
     * Obtiene los usuarios de una sucursal perteneciente a una óptica.
     *
     * @param {string} opticaId - ID de la óptica.
     * @param {string} sucursalId - ID de la sucursal.
     * @param {Object} client - Cliente de PostgreSQL opcional.
     * @returns {Promise<Array>} Usuarios encontrados.
    */
    async listarUsuariosPorSucursal(opticaId, sucursalId, client) {
        const query = `
            SELECT
                id,
                optica_id,
                sucursal_id,
                nombre,
                usuario,
                rol,
                activo,
                dado_de_alta_por,
                created_at
            FROM optica_usuarios
            WHERE optica_id = $1
            AND sucursal_id = $2
            ORDER BY nombre ASC, created_at ASC
        `;

        const { rows } = await this._exec(client).query(query, [
            opticaId,
            sucursalId
        ]);

        return rows;
    }




    /**
     * Obtiene la sucursal administrada por un encargado.
     *
     * @param {string} opticaId - ID de la óptica.
     * @param {string} opticaUsuarioId - ID del encargado.
     * @param {Object} client - Cliente de PostgreSQL opcional.
     * @returns {Promise<Object|null>} Sucursal administrada o null.
    */
    async buscarSucursalAdministrada(opticaId, opticaUsuarioId, client) {
        const query = `
            SELECT
                s.id,
                s.optica_id,
                s.nombre,
                s.activo
            FROM sucursales s
            INNER JOIN sucursal_gerentes sg
                ON sg.sucursal_id = s.id
            WHERE s.optica_id = $1
            AND sg.optica_usuario_id = $2
            AND s.activo = TRUE
        `;

        const { rows } = await this._exec(client).query(query, [
            opticaId,
            opticaUsuarioId
        ]);
        console.log('buscarSucursalAdministrada:', rows[0]);

        return rows[0] || null;
    }



    /**
    * Obtiene un usuario por su ID dentro de una óptica.
    *
    * @param {string} usuarioId - ID del usuario.
    * @param {string} opticaId - ID de la óptica.
    * @param {Object} client - Cliente de PostgreSQL opcional.
    * @returns {Promise<Object|null>} Usuario encontrado o null.
    */
    async buscarUsuarioPorIdYOptica(usuarioId,opticaId, client){

        const query = `
                SELECT
                    id,
                    optica_id,
                    sucursal_id,
                    nombre,
                    usuario,
                    rol,
                    activo,
                    dado_de_alta_por,
                    created_at
                FROM optica_usuarios
                WHERE id=$1
                AND optica_id = $2 
            `;

            const { rows } = await this._exec(client).query(query,[
                usuarioId,
                opticaId
            ]);

            return rows[0] || null;
        
    }


    async actualizarUsuario(usuarioId, opticaId, datos, client){

        const campos = [];
        const valores = [];
        let indice = 1;

        if (datos.nombre !== undefined){
            campos.push(`nombre = $${indice++}`);
            valores.push(datos.nombre);
        }

        if(datos.activo !== undefined){
            campos.push(`activo = $${indice++}`);
            valores.push(datos.activo);
        }

        valores.push(usuarioId);
        valores.push(opticaId);

        const query = `
            UPDATE optica_usuarios
            SET ${campos.join(', ')}
            WHERE id = $${indice++}
            AND optica_id = $${indice}
            RETURNING
                id,
                optica_id,
                sucursal_id,
                nombre,
                usuario,
                rol,
                activo,
                dado_de_alta_por,
                created_at        
        `;

        const { rows } = await this._exec(client).query(query,valores);

        return rows[0] || null;

    }
}
module.exports = UsuarioRepository;