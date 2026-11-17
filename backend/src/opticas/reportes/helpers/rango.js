const TZ = `'America/Mexico_City'`;

const INICIO_PERIODO = Object.freeze({
    day:   `(date_trunc('day',   now() AT TIME ZONE ${TZ}) AT TIME ZONE ${TZ})`,
    week:  `(now() - interval '7 days')`,
    month: `(date_trunc('month', now() AT TIME ZONE ${TZ}) AT TIME ZONE ${TZ})`,
    year:  `(date_trunc('year',  now() AT TIME ZONE ${TZ}) AT TIME ZONE ${TZ})`,
});

/**
 * Devuelve las expresiones SQL del rango y los valores a agregar.
 * Si viene desde/hasta mandan sobre periodo. Las expresiones salen de una lista
 * fija del código; los valores del cliente siempre van como parámetros.
 *
 * @param {{ desde?: string, hasta?: string, periodo: string }} filtro
 * @param {number} posInicial - siguiente número de parámetro ($n) disponible
 * @returns {{ inicioSql: string, finSql: string, valores: any[] }}
 */
function resolverRango({ desde, hasta, periodo }, posInicial) {
    if (desde || hasta) {
        const valores = [];
        let inicioSql = `'-infinity'::timestamptz`;
        let finSql = `'infinity'::timestamptz`;
        let pos = posInicial;

        if (desde) { valores.push(desde); inicioSql = `$${pos++}::timestamptz`; }
        if (hasta) { valores.push(hasta); finSql = `$${pos++}::timestamptz`; }
        return { inicioSql, finSql, valores };
    }

    return { inicioSql: INICIO_PERIODO[periodo], finSql: 'now()', valores: [] };
}

module.exports = { resolverRango };