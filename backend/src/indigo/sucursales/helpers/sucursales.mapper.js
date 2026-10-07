function aSucursalFront(row) {
  return {
    id: row.id,
    displayId: Number(row.numero),
    name: row.nombre,
    address: row.direccion,
    phone: row.telefono,
    manager: row.gerente_nombre ?? null,
    managerId: row.gerente_id ?? null,
    staff: row.staff,
    products: row.products,
    status: row.activo ? "active" : "inactive",
  };
}

module.exports = { aSucursalFront };