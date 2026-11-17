// function aSucursalFront(row) {
//   return {
//     id: row.id,
//     displayId: Number(row.numero),
//     name: row.nombre,
//     address: row.direccion,
//     phone: row.telefono,
//     manager: row.gerente_nombre ?? null,
//     managerId: row.gerente_id ?? null,
//     staff: row.staff,
//     products: row.products,
//     status: row.activo ? "active" : "inactive",
//   };
// }

// module.exports = { aSucursalFront };

function aSucursalFront(row) {
  return {
    id: row.id,
    displayId: Number(row.numero),
    name: row.nombre,
    address: row.direccion,
    phone: row.telefono,
    country: row.pais,
    state: row.estado,
    municipality: row.municipio,
    manager: row.gerente_nombre ?? null,
    managerId: row.gerente_id ?? null,
    managerPhone: row.gerente_telefono ?? null,
    subManager: row.subgerente_nombre ?? null,
    subManagerPhone: row.subgerente_telefono ?? null,
    staff: row.staff,
    products: row.products,
    customers: row.customers,
    labJobs: row.lab_jobs,
    staffList: row.staff_list ?? [],
    status: row.activo ? "active" : "inactive",
  };
}

module.exports = { aSucursalFront };