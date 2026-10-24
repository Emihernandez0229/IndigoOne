import { httpClient } from "../../../shared/api/httpClient";


function mapProducto(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    displayId: raw.display_id ?? raw.displayId,
    code: raw.codigo ?? raw.code ?? "",
    name: raw.nombre ?? raw.name ?? "",
    category: raw.categoria ?? raw.category ?? "",
    brand: raw.marca ?? raw.brand ?? "",
    description: raw.descripcion ?? raw.description ?? "",
    salePrice: Number(raw.precio_venta ?? raw.salePrice ?? 0),
    stockMin: Number(raw.stock_minimo ?? raw.stockMin ?? 0),
    imageUrl: raw.imagen_url ?? raw.imageUrl ?? "",
    active: raw.active ?? raw.estado !== "inactive",
    stockPorSucursal: Array.isArray(raw.stock_por_sucursal)
      ? raw.stock_por_sucursal.map((row) => ({ branchId: row.sucursal_id, stock: Number(row.stock ?? 0), active: row.active ?? true }))
      : [],
  };
}

function mapServicio(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    displayId: raw.display_id ?? raw.displayId,
    code: raw.codigo ?? raw.code ?? "",
    name: raw.nombre ?? raw.name ?? "",
    category: raw.categoria ?? raw.category ?? "",
    description: raw.descripcion ?? raw.description ?? "",
    price: Number(raw.precio ?? raw.price ?? 0),
    active: raw.active ?? raw.estado !== "inactive",
  };
}


export async function listProductos() {
  const data = await httpClient.get("/api/opticas/productos");
  return (Array.isArray(data) ? data : []).map(mapProducto);
}

export async function createProducto(payload) {
  const created = await httpClient.post("/api/opticas/productos", {
    codigo: payload.code,
    nombre: payload.name,
    categoria: payload.category,
    marca: payload.brand,
    descripcion: payload.description,
    precio_venta: payload.salePrice,
    stock_minimo: payload.stockMin,
    imagen_url: payload.imageUrl || "",
  });
  return mapProducto(created);
}

export async function updateProducto(id, payload) {
  const updated = await httpClient.put(`/api/opticas/productos/${id}`, {
    codigo: payload.code,
    nombre: payload.name,
    categoria: payload.category,
    marca: payload.brand,
    descripcion: payload.description,
    precio_venta: payload.salePrice,
    stock_minimo: payload.stockMin,
    imagen_url: payload.imageUrl || "",
  });
  return mapProducto(updated);
}

export async function deactivateProducto(id) {
  return mapProducto(await httpClient.patch(`/api/opticas/productos/${id}/deactivate`));
}

export async function activateProducto(id) {
  return mapProducto(await httpClient.patch(`/api/opticas/productos/${id}/activate`));
}

// Para el Jefe de sucursal: alta/baja y movimientos de stock que solo
// afectan a SU sucursal, sin tocar el producto global.
export async function deactivateProductoBranch(id, branchId) {
  return mapProducto(await httpClient.patch(`/api/opticas/productos/${id}/sucursal/${branchId}/baja`));
}

export async function activateProductoBranch(id, branchId) {
  return mapProducto(await httpClient.patch(`/api/opticas/productos/${id}/sucursal/${branchId}/alta`));
}

export async function registerProductoMovimiento(id, branchId, payload) {
  return mapProducto(await httpClient.patch(`/api/opticas/productos/${id}/sucursal/${branchId}/movimiento`, {
    tipo: payload.tipo,
    cantidad: payload.cantidad,
    motivo: payload.motivo,
  }));
}


export async function listServicios() {
  const data = await httpClient.get("/api/opticas/servicios");
  return (Array.isArray(data) ? data : []).map(mapServicio);
}

export async function createServicio(payload) {
  const created = await httpClient.post("/api/opticas/servicios", {
    codigo: payload.code,
    nombre: payload.name,
    categoria: payload.category,
    descripcion: payload.description,
    precio: payload.price,
  });
  return mapServicio(created);
}

export async function updateServicio(id, payload) {
  const updated = await httpClient.put(`/api/opticas/servicios/${id}`, {
    codigo: payload.code,
    nombre: payload.name,
    categoria: payload.category,
    descripcion: payload.description,
    precio: payload.price,
  });
  return mapServicio(updated);
}

export async function deactivateServicio(id) {
  return mapServicio(await httpClient.patch(`/api/opticas/servicios/${id}/deactivate`));
}

export async function activateServicio(id) {
  return mapServicio(await httpClient.patch(`/api/opticas/servicios/${id}/activate`));
}
