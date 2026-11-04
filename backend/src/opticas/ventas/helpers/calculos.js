const aCentavos = (valor) => Math.round(Number(valor) * 100);
const deCentavos = (centavos) => (centavos / 100).toFixed(2);

/**
 * Precios SIN IVA: el IVA se suma al final.
 * Todo en centavos enteros; se redondea una sola vez (en el IVA).
 *
 * @param {{ precioCentavos: number, cantidad: number }[]} lineas
 * @param {number} tasaIva - Porcentaje, ej. 16
 */
function calcularTotales(lineas, tasaIva) {
    const subtotal = lineas.reduce((acc, l) => acc + l.precioCentavos * l.cantidad, 0);
    const puntosBase = Math.round(Number(tasaIva) * 100);       // 16.00 -> 1600
    const iva = Math.round((subtotal * puntosBase) / 10000);
    return { subtotal, iva, total: subtotal + iva };
}

module.exports = { aCentavos, deCentavos, calcularTotales };