class TransactionManager {
    constructor(pool) {
        this.pool = pool;
    }

    async ejecutar(callback) {
        const client = await this.pool.connect();
        let releaseError; 

        try {
            await client.query('BEGIN');
            const resultado = await callback(client);
            await client.query('COMMIT');
            return resultado;
        } catch (err) {
            try {
                await client.query('ROLLBACK');
            } catch (rollbackErr) {
                releaseError = rollbackErr; 
            }
            throw err; 
        } finally {
            client.release(releaseError); 
        }
    }
}

module.exports = TransactionManager;