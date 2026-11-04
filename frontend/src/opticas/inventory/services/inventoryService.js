import { httpClient } from "../../../shared/api/httpClient";

/**
 * Inventario propio de la óptica (por sucursal) - lo siguen usando Ventas
 * (para elegir qué vender) y Reportes (para ver existencias), aunque la
 * página de Inventario ya no lo administra aquí (ver listIndigoCatalog).
 */
export async function listInventory() {
  return httpClient.get("/api/opticas/inventario");
}

/**
 * El Dueño y el Jefe de sucursal no administran su propio inventario en
 * esta página: consultan el catálogo de Indigo (su proveedor) para ver qué
 * productos hay y cuánto hay disponible. De solo lectura, sin crear,
 * editar ni dar de baja nada desde Ópticas.
 */
export async function listIndigoCatalog() {
  return httpClient.get("/api/indigo/inventario");
}

function mapMovimiento(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    productId: raw.producto_id ?? raw.productId ?? null,
    branchId: raw.sucursal_id ?? raw.branchId ?? null,
    tipo: raw.tipo ?? "entrada",
    cantidad: Number(raw.cantidad ?? 0),
    motivo: raw.motivo ?? "",
    createdBy: raw.creado_por ?? raw.createdBy ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? null,
  };
}

/**
 * Historial de entradas/salidas de stock, para el reporte de Inventario
 * del Dueño (ver Reportes). Se alimenta de cada movimiento que registra el
 * Jefe de sucursal desde el catálogo.
 */
export async function listMovimientos() {
  const data = await httpClient.get("/api/opticas/inventario/movimientos");
  return (Array.isArray(data) ? data : []).map(mapMovimiento);
}
