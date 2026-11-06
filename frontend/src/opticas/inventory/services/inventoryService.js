import { httpClient } from "../../../shared/api/httpClient";

/**
 * El Dueño y el Jefe de sucursal no administran su propio inventario en
 * esta página: consultan el catálogo de Indigo (su proveedor) para ver qué
 * productos hay y cuánto hay disponible. De solo lectura, sin crear,
 * editar ni dar de baja nada desde Ópticas.
 */
export async function listIndigoCatalog() {
  return httpClient.get("/api/indigo/inventario");
}


function mapStockRow(raw) {
  return {
    productId: raw.producto_id ?? raw.productId ?? null,
    stock: Number(raw.cantidad ?? raw.stock ?? 0),
    stockMin: Number(raw.stock_minimo ?? raw.stockMin ?? 0),
  };
}

/**
 * Existencias del stock PROPIO de la óptica para una sucursal. El back no
 * tiene un "todas las sucursales" en una sola llamada: el Dueño tiene que
 * indicar sucursalId explícito; Encargado/Empleado lo resuelven solos
 * desde su token aunque no se les mande nada (lo ignora si lo mandan).
 */
export async function listStock(sucursalId) {
  const query = sucursalId ? `?sucursalId=${sucursalId}&limit=100` : "?limit=100";
  const data = await httpClient.get(`/api/opticas/stock${query}`);
  return (Array.isArray(data) ? data : []).map(mapStockRow);
}

/**
 * Junta el stock de varias sucursales en un mapa productId -> [{branchId, stock}],
 * para reconstruir la vista "stock por sucursal" que antes venía embebida
 * en el producto (el back la da por sucursal, no por producto).
 */
export async function listStockPorSucursales(branchIds) {
  const porSucursal = await Promise.all(branchIds.map((id) => listStock(id)));
  const map = new Map();
  branchIds.forEach((branchId, i) => {
    porSucursal[i].forEach((row) => {
      const entry = map.get(row.productId) ?? [];
      entry.push({ branchId, stock: row.stock });
      map.set(row.productId, entry);
    });
  });
  return map;
}

/**
 * Entrada/salida/ajuste manual de stock de un producto en una sucursal.
 * Regresa { stock, movimiento } (movimiento puede venir null si la
 * cantidad no cambió, p.ej. un ajuste al mismo valor que ya había).
 */
export async function ajustarStock(productId, payload) {
  return httpClient.patch(`/api/opticas/stock/${productId}`, {
    sucursalId: payload.branchId || undefined,
    tipo: payload.tipo,
    cantidad: Number(payload.cantidad),
    motivo: payload.motivo || undefined,
  });
}

function mapMovimiento(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    tipo: raw.tipo ?? "entrada",
    cantidad: Number(raw.cantidad ?? 0),
    cantidadAnterior: Number(raw.cantidad_anterior ?? 0),
    cantidadNueva: Number(raw.cantidad_nueva ?? 0),
    motivo: raw.motivo ?? "",
    createdBy: raw.realizado_por ?? null,
    createdByName: raw.realizado_por_nombre ?? "",
    createdAt: raw.created_at ?? raw.createdAt ?? null,
  };
}

/**
 * Historial de movimientos de UN producto en una sucursal (el back no
 * tiene un listado plano de "todos los movimientos de todo"). Se usa para
 * el selector de producto en Reportes > Inventario.
 */
export async function listMovimientosProducto(productId, sucursalId) {
  const query = sucursalId ? `?sucursalId=${sucursalId}&limit=100` : "?limit=100";
  const data = await httpClient.get(`/api/opticas/stock/${productId}/movimientos${query}`);
  return (Array.isArray(data) ? data : []).map(mapMovimiento);
}
