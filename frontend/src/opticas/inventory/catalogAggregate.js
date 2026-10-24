/**
 * Indigo guarda el inventario por sucursal (una fila por sucursal con
 * existencias de ese producto). Al catálogo de Ópticas no le importa en
 * qué sucursal de Indigo está cada pieza, así que se agrupa por código en
 * un solo producto con el stock sumado entre todas las sucursales.
 */
export function buildCatalog(items = []) {
  const byCode = new Map();

  items.forEach((item) => {
    const existing = byCode.get(item.code);

    if (!existing) {
      byCode.set(item.code, {
        ...item,
        id: item.code,
        stockAvailable: Number(item.stockAvailable ?? 0),
        active: Boolean(item.active),
        photos: Array.isArray(item.photos) ? item.photos : [],
      });
      return;
    }

    existing.stockAvailable += Number(item.stockAvailable ?? 0);
    existing.active = existing.active || Boolean(item.active);
    if (existing.photos.length === 0 && Array.isArray(item.photos) && item.photos.length > 0) {
      existing.photos = item.photos;
    }
  });

  return [...byCode.values()];
}
