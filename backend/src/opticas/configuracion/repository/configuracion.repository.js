
const CAMPOS_CONFIGURACION = new Set([
    // Información de la empresa
    'nombre_comercial',
    'responsable_sanitario',
    'razon_social',
    'telefono',
    'correo',

    // Domicilio fiscal
    'calle',
    'numero_exterior',
    'numero_interior',
    'colonia',
    'codigo_postal',
    'municipio',
    'estado_direccion',
    'pais',

    // Configuración fiscal
    'rfc',
    'regimen_fiscal',
    'correo_fiscal',

    // Identidad visual
    'logo_url',
    'color_principal',
    'color_secundario',
    'eslogan',
]);

class ConfiguracionRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async obtenerPorOpticaId(opticaId) {
        const query = `
            SELECT *
            FROM optica_configuracion
            WHERE optica_id = $1
            LIMIT 1
        `;

        const { rows } = await this.pool.query(query, [opticaId]);

        return rows[0] ?? null;
    }

    async obtenerConfiguracionOperativa(opticaId) {
        const query = `
            SELECT
                nombre_comercial,
                logo_url,
                color_principal,
                color_secundario,
                eslogan
            FROM optica_configuracion
            WHERE optica_id = $1
            LIMIT 1
        `;

        const { rows } = await this.pool.query(query, [opticaId]);

        return rows[0] ?? null;
    }

    async crear(opticaId, datos) {
        const campos = Object.keys(datos);

        for (const campo of campos) {
            if (!CAMPOS_CONFIGURACION.has(campo)) {
                throw new Error(`Campo de configuración no permitido: ${campo}`);
            }
        }

        const columnas = ['optica_id', ...campos];
        const valores = [opticaId, ...campos.map((campo) => datos[campo])];
        const parametros = valores.map((_, indice) => `$${indice + 1}`);

        const query = `
            INSERT INTO optica_configuracion (${columnas.join(', ')})
            VALUES (${parametros.join(', ')})
            RETURNING *
        `;

        const { rows } = await this.pool.query(query, valores);

        return rows[0];
    }

    async actualizarPorOpticaId(opticaId, datos) {
        const campos = Object.keys(datos);

        for (const campo of campos) {
            if (!CAMPOS_CONFIGURACION.has(campo)) {
                throw new Error(`Campo de configuración no permitido: ${campo}`);
            }
        }

        const asignaciones = campos.map(
            (campo, indice) => `${campo} = $${indice + 1}`
        );

        asignaciones.push('updated_at = NOW()');

        const valores = [...campos.map((campo) => datos[campo]), opticaId];

        const query = `
            UPDATE optica_configuracion
            SET ${asignaciones.join(', ')}
            WHERE optica_id = $${valores.length}
            RETURNING *
        `;

        const { rows } = await this.pool.query(query, valores);

        return rows[0] ?? null;
    }
}

module.exports = ConfiguracionRepository;
