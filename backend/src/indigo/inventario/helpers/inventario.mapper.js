function aProductoFront(row) {
  return {
    id: row.id,
    displayId: Number(row.numero),
    code: row.codigo,
    model: row.modelo,
    description: row.descripcion ?? "",
    color: row.color,
    type: row.tipo,
    material: row.material ?? "",
    gender: row.genero,
    measurements: row.medidas,
    stockAvailable: row.stock_disponible,
    stockMin: row.stock_minimo,
    cost: Number(row.costo),
    branchId: row.indigo_sucursal_id,
    branchName: row.sucursal_nombre,
    active: row.activo,
  };
}

module.exports = { aProductoFront };