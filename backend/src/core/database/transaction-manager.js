/**
 * Gestiona la ejecución de transacciones de PostgreSQL.
 *
 * Se encarga de iniciar, confirmar y revertir transacciones,
 * garantizando además la liberación del cliente de PostgreSQL
 * al finalizar la operación.
 */
class TransactionManager {

    constructor(pool) {
        this.pool = pool;
    }

    /**
     * Ejecuta una operación dentro de una transacción.
     *
     * La operación recibida mediante el callback se ejecuta utilizando
     * el mismo cliente de PostgreSQL durante toda la transacción.
     * Si la operación finaliza correctamente, la transacción se confirma
     * mediante COMMIT. Si ocurre un error, se ejecuta ROLLBACK y el error
     * original se propaga.
     *
     * @param {Function} callback - Función que contiene las operaciones
     * de base de datos que deben ejecutarse dentro de la transacción.
     * Recibe como argumento el cliente de PostgreSQL asociado a la transacción.
     * @returns {Promise<*>} Resultado retornado por el callback.
     * @throws {Error} Propaga cualquier error ocurrido durante la transacción.
     */
    async ejecutar(callback) {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');

            const resultado = await callback(client);

            await client.query('COMMIT');

            return resultado;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    }
}

module.exports = TransactionManager;