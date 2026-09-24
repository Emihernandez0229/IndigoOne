class PacienteRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async buscarSucursalPorOptica(sucursalId, opticaId) {
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

        const { rows } = await this.pool.query(query, [
                sucursalId,
                opticaId
            ]);

        return rows[0] || null;
    }

    async buscarSucursalAdministrada(opticaId, opticaUsuarioId) {
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

        const { rows } = await this.pool.query(query, [
                opticaId,
                opticaUsuarioId
            ]);

        return rows[0] || null;
    }

    async crearPaciente({
        sucursalId,
        nombre,
        telefono,
        email,
        fechaNacimiento
    }) {
        const query = `
            INSERT INTO clientes_finales (
                sucursal_id,
                nombre,
                telefono,
                email,
                fecha_nacimiento
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING
                id,
                sucursal_id,
                nombre,
                telefono,
                email,
                fecha_nacimiento,
                created_at,
                updated_at
        `;

        const values = [
            sucursalId,
            nombre,
            telefono ?? null,
            email ?? null,
            fechaNacimiento ?? null
        ];

        const { rows } =  await this.pool.query(query, values);

        return rows[0];
    }

    async obtenerPacientes(sucursalId) {
        const query = `
            SELECT
                id,
                sucursal_id,
                nombre,
                telefono,
                email,
                fecha_nacimiento,
                created_at,
                updated_at
            FROM clientes_finales
            WHERE sucursal_id = $1
            ORDER BY nombre ASC
        `;

        const { rows } = await this.pool.query(query, [sucursalId]);

        return rows;
    }

    async obtenerPacientePorId(id, sucursalId) {
        const query = `
            SELECT
                id,
                sucursal_id,
                nombre,
                telefono,
                email,
                fecha_nacimiento,
                created_at,
                updated_at
            FROM clientes_finales
            WHERE id = $1
              AND sucursal_id = $2
        `;

        const { rows } = await this.pool.query(query, [
                id,
                sucursalId
            ]);

        return rows[0] || null;
    }

    async actualizarPaciente(id, sucursalId, cambios) {
        const campos = [];
        const valores = [];
        let indice = 1;

        if (cambios.nombre !== undefined) {
            campos.push(`nombre = $${indice++}`);
            valores.push(cambios.nombre);
        }

        if (cambios.telefono !== undefined) {
            campos.push(`telefono = $${indice++}`);
            valores.push(cambios.telefono);
        }

        if (cambios.email !== undefined) {
            campos.push(`email = $${indice++}`);
            valores.push(cambios.email);
        }

        if (cambios.fechaNacimiento !== undefined) {
            campos.push(
                `fecha_nacimiento = $${indice++}`
            );
            valores.push(cambios.fechaNacimiento);
        }

        campos.push('updated_at = NOW()');

        valores.push(id);
        valores.push(sucursalId);

        const query = `
            UPDATE clientes_finales
            SET ${campos.join(', ')}
            WHERE id = $${indice++}
              AND sucursal_id = $${indice}
            RETURNING
                id,
                sucursal_id,
                nombre,
                telefono,
                email,
                fecha_nacimiento,
                created_at,
                updated_at
        `;

        const { rows } = await this.pool.query(query, valores);

        return rows[0] || null;
    }

    async obtenerPacientePorIdYOptica(id, opticaId) {
        const query = `
            SELECT
                cf.id,
                cf.sucursal_id,
                cf.nombre,
                cf.telefono,
                cf.email,
                cf.fecha_nacimiento,
                cf.created_at,
                cf.updated_at
            FROM clientes_finales cf
            INNER JOIN sucursales s
                ON s.id = cf.sucursal_id
            WHERE cf.id = $1
              AND s.optica_id = $2
        `;
        const { rows } = await this.pool.query(query, [
            id,
            opticaId
        ]);
        return rows[0] || null;
    }
}

module.exports = PacienteRepository;