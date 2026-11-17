function aClienteFront(row) {
  const fiscalAddress = [
    row.direccion,
    row.municipio,
    row.estado,
    row.codigo_postal && `C.P. ${row.codigo_postal}`,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: row.id,
    displayId: Number(row.numero),
    code: row.codigo,
    name: row.razon_social, // nombre de la óptica
    rfc: row.rfc,
    phone: row.telefono, // los configura la óptica en su perfil
    email: row.correo,
    country: row.pais,
    state: row.estado,
    municipality: row.municipio,
    address: row.direccion,
    postalCode: row.codigo_postal,
    fiscalAddress,
    status: row.activo ? "active" : "inactive",
    // Cada sucursal de la óptica con la sucursal de Indigo de la que es cliente
    branches: row.sucursales ?? [],
  };
}

module.exports = { aClienteFront };