/**
 * El estado de una pieza se deriva de su stock, salvo que este
 * dada de baja (active: false), en cuyo caso siempre es "inactive".
 */
export function getStockStatus(item) {

  if (!item.active) {
    return "inactive";
  }

  if (Number(item.stockAvailable) <= 0) {
    return "out_of_stock";
  }

  if (Number(item.stockAvailable) <= Number(item.stockMin)) {
    return "low_stock";
  }

  return "available";

}
