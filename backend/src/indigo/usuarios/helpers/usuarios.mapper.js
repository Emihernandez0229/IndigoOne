function aUsuarioFront(user) {
  return {
    id: user.id,
    displayId: Number(user.numero),
    name: user.nombre,
    username: user.usuario,
    role: `indigo:${user.rol}`,
    branchId: user.sucursal_id,
    branchName: user.sucursal_nombre ?? "Sin sucursal",
    status: user.activo ? "active" : "inactive",
  };
}

module.exports = { aUsuarioFront };