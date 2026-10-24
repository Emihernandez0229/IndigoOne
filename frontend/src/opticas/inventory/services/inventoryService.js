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
