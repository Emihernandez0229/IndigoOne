

/**
 * 
 */
class PacienteRepository {

    constructor(pool) {
        this.pool = pool;
    }

    // Create Paciente
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
                updated_at;
        `;

        const values = [
            sucursalId,
            nombre,
            telefono ?? null,
            email ?? null,
            fechaNacimiento ?? null
        ];

        const { rows } = await this.pool.query(query, values);

        return rows[0];
    }


    // Obtener todos los pacientes
    async obtenerPacientes(sucursalId){
        const query = `
            SELECT
                id,
                sucursal_id,
                nombre,
                telefono,
                email,
                fecha_nacimiento,
                activo,
                created_at,
                updated_at
            FROM clientes_finales
            WHERE sucursal_id = $1
            ORDER BY nombre ASC;
        `;
        const { rows } = await this.pool.query(query,[sucursalId]);

       
        return rows;
    } 
    // READ - obtener un paciente
    async obtenerPacientePorId(id) {

        const query = `
            SELECT
                id,
                sucursal_id,
                nombre,
                telefono,
                email,
                fecha_nacimiento,
                activo,
                created_at,
                updated_at
            FROM clientes_finales
            WHERE id = $1;
        `;

        const { rows } = await this.pool.query(query, [id]);

        return rows[0];
    }


    // update
    async actualizarPaciente(
        id,
        {
            nombre,
            telefono,
            email,
            fechaNacimiento
        }
    ) {

        const query = `
            UPDATE clientes_finales
            SET
                nombre = $1,
                telefono = $2,
                email = $3,
                fecha_nacimiento = $4,
                updated_at = now()
            WHERE id = $5
            RETURNING
                id,
                sucursal_id,
                nombre,
                telefono,
                email,
                fecha_nacimiento,
                activo,
                created_at,
                updated_at;
        `;

        const values = [
            nombre,
            telefono ?? null,
            email ?? null,
            fechaNacimiento ?? null,
            id
        ];

        const { rows } = await this.pool.query(query, values);

        return rows[0];
    }
}

module.exports = PacienteRepository;