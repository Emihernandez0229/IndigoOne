export const QUICK_RANGES = [
  { value: "today", label: "Hoy", days: 1 },
  { value: "7d", label: "7 días", days: 7 },
  { value: "30d", label: "30 días", days: 30 },
  { value: "90d", label: "90 días", days: 90 },
  { value: "365d", label: "Anual", days: 365 },
];


function toISODate(date) {
  return date.toISOString().slice(0, 10);
}


export function quickRangeDates(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - (days - 1));
  return { from: toISODate(from), to: toISODate(to) };
}


export function inDateRange(dateStr, from, to) {
  if (!dateStr) return false;
  const day = dateStr.slice(0, 10);
  return (!from || day >= from) && (!to || day <= to);
}


// Unidades vendidas solo cuenta productos (los servicios no tienen
// existencias ni "unidades" como tal).
export function unidadesDeVenta(venta) {
  return (venta.items ?? [])
    .filter((item) => item.itemType === "producto")
    .reduce((sum, item) => sum + Number(item.quantity ?? 0), 0);
}


export function buildDailyBuckets(ventas, from, to) {
  if (!from || !to) return [];

  const byDay = new Map();
  ventas.forEach((venta) => {
    const day = (venta.createdAt ?? "").slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + venta.total);
  });

  const buckets = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  while (cursor <= end) {
    const day = toISODate(cursor);
    buckets.push({
      day,
      label: cursor.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }).replace(".", ""),
      total: Math.round((byDay.get(day) ?? 0) * 100) / 100,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}


export function groupByBranch(ventas, branchesById) {
  const map = new Map();
  ventas.forEach((venta) => {
    if (!map.has(venta.branchId)) {
      map.set(venta.branchId, {
        id: venta.branchId,
        name: branchesById.get(venta.branchId) ?? "Sin sucursal",
        operaciones: 0,
        unidades: 0,
        total: 0,
      });
    }
    const entry = map.get(venta.branchId);
    entry.operaciones += 1;
    entry.unidades += unidadesDeVenta(venta);
    entry.total += venta.total;
  });
  return [...map.values()];
}


export function groupBySeller(ventas) {
  const map = new Map();
  ventas.forEach((venta) => {
    const key = venta.sellerName || "Sin vendedor";
    if (!map.has(key)) {
      map.set(key, { id: key, name: key, operaciones: 0, unidades: 0, total: 0 });
    }
    const entry = map.get(key);
    entry.operaciones += 1;
    entry.unidades += unidadesDeVenta(venta);
    entry.total += venta.total;
  });
  return [...map.values()];
}


// El IVA se calcula a nivel de venta, no por renglón - para que la suma
// de los renglones de una venta cuadre con su total (y, de ahí, con el
// total de la sucursal en groupByBranch), se reparte proporcionalmente
// entre sus renglones según el subtotal de cada uno.
export function itemTotalConIva(venta, item) {
  const itemSubtotal = Number(item.quantity ?? 0) * Number(item.unitPrice ?? 0);
  const taxFactor = venta.subtotal > 0 ? venta.total / venta.subtotal : 1;
  return itemSubtotal * taxFactor;
}


export function groupByItem(ventas, itemType, filterId) {
  const map = new Map();
  ventas.forEach((venta) => {
    (venta.items ?? [])
      .filter((item) => item.itemType === itemType && (!filterId || item.productId === filterId))
      .forEach((item) => {
        const key = item.model || item.code || "Sin nombre";
        if (!map.has(key)) {
          map.set(key, { id: key, name: key, operaciones: 0, unidades: 0, total: 0 });
        }
        const entry = map.get(key);
        entry.operaciones += 1;
        entry.unidades += Number(item.quantity ?? 0);
        entry.total += itemTotalConIva(venta, item);
      });
  });
  return [...map.values()];
}


// Igual que buildDailyBuckets, pero cuenta servicios realizados (unidades
// de items tipo "servicio") en vez de sumar el total de la venta - para la
// gráfica "Servicios realizados por día".
export function buildServiceDailyBuckets(ventas, from, to, filterId) {
  if (!from || !to) return [];

  const byDay = new Map();
  ventas.forEach((venta) => {
    const day = (venta.createdAt ?? "").slice(0, 10);
    (venta.items ?? [])
      .filter((item) => item.itemType === "servicio" && (!filterId || item.productId === filterId))
      .forEach((item) => {
        byDay.set(day, (byDay.get(day) ?? 0) + Number(item.quantity ?? 0));
      });
  });

  const buckets = [];
  const cursor = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T00:00:00`);

  while (cursor <= end) {
    const day = toISODate(cursor);
    buckets.push({
      day,
      label: cursor.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }).replace(".", ""),
      total: byDay.get(day) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return buckets;
}


// Agrupa cualquier lista por una llave (sucursal, estado, etc.) y cuenta
// cuántos elementos cayeron en cada una - para listas comparativas que
// muestran conteos en vez de montos (clientes, citas).
export function groupByCount(items, keyFn, nameFn) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyFn(item);
    if (key === null || key === undefined) return;
    if (!map.has(key)) {
      map.set(key, { id: key, name: nameFn ? nameFn(item, key) : key, total: 0 });
    }
    map.get(key).total += 1;
  });
  return [...map.values()];
}


