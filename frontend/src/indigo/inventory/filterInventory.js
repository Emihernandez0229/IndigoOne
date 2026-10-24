import { getStockStatus } from "./stockStatus";

/**
 * Filtra productos por texto (código o modelo), tipo, material, estado y sucursal.
 */
export function filterInventory(
  items = [],
  {
    query = "",
    type = "",
    material = "",
    status = "",
    branch = "",
  } = {}
) {

  const q =
    query.trim().toLowerCase();

  return items.filter((item) => {

    const matchesQuery =
      !q ||
      (item.code ?? "").toLowerCase().includes(q) ||
      (item.model ?? "").toLowerCase().includes(q);

    const matchesType =
      !type ||
      item.type === type;

    const matchesMaterial =
      !material ||
      item.material === material;

    const matchesStatus =
      !status ||
      getStockStatus(item) === status;

    const matchesBranch =
      !branch ||
      String(item.branchId) === String(branch);

    return (
      matchesQuery &&
      matchesType &&
      matchesMaterial &&
      matchesStatus &&
      matchesBranch
    );

  });

}
