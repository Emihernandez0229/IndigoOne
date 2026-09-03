/**
 * Filtra usuarios por texto (nombre o sucursal), rol y sucursal.
 * Pura: sin React, facil de testear.
 */
export function filterUsers(users = [], { query = "", role = "", branch = "" } = {}) {

  const q = query.trim().toLowerCase();

  return users.filter((user) => {
    const matchesQuery =
      !q ||
      user.name.toLowerCase().includes(q) ||
      (user.branchName ?? "").toLowerCase().includes(q);

    const matchesRole = !role || user.role === role;
    const matchesBranch = !branch || String(user.branchId) === String(branch);

    return matchesQuery && matchesRole && matchesBranch;
  });

}
