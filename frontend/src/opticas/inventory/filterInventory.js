/**
 * Filtra el catálogo por texto (código o modelo) y por categoría.
 */
export function filterInventory(items = [], { query = "", type = "" } = {}) {

  const q = query.trim().toLowerCase();

  return items.filter((item) => {

    const matchesQuery =
      !q ||
      (item.code ?? "").toLowerCase().includes(q) ||
      (item.model ?? "").toLowerCase().includes(q);

    const matchesType = !type || item.type === type;

    return matchesQuery && matchesType;

  });

}
