/**
 * Filtra sucursales por texto (ID exacto o nombre) y por estado.
 */
export function filterBranches(branches = [], { query = "", status = "" } = {}) {

  const q = query.trim().toLowerCase();

  return branches.filter((branch) => {
    const matchesQuery =
      !q ||
      String(branch.id) === q ||
      branch.name.toLowerCase().includes(q);

    const matchesStatus = !status || branch.status === status;

    return matchesQuery && matchesStatus;
  });

}
