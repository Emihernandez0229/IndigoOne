import { httpClient } from "../../../shared/api/httpClient";


function mapProducto(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    displayId: raw.display_id ?? raw.displayId,
    code: raw.sku ?? raw.code ?? "",
    name: raw.nombre ?? raw.name ?? "",
    categoryId: raw.categoria_id ?? raw.categoryId ?? null,
    categoryName: raw.categoria_nombre ?? raw.categoryName ?? "",
    brand: raw.marca ?? raw.brand ?? "",
    description: raw.descripcion ?? raw.description ?? "",
    salePrice: Number(raw.precio_venta ?? raw.salePrice ?? 0),
    stockMin: Number(raw.stock_minimo ?? raw.stockMin ?? 0),
    active: raw.activo ?? raw.active ?? true,
  };
}

function mapServicio(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    displayId: raw.display_id ?? raw.displayId,
    code: raw.codigo ?? raw.code ?? "",
    name: raw.nombre ?? raw.name ?? "",
    categoryId: raw.categoria_id ?? raw.categoryId ?? null,
    categoryName: raw.categoria_nombre ?? raw.categoryName ?? "",
    description: raw.descripcion ?? raw.description ?? "",
    price: Number(raw.precio ?? raw.price ?? 0),
    active: raw.activo ?? raw.active ?? true,
  };
}

function mapCategoria(raw) {
  return { value: raw.id, label: raw.nombre };
}


export async function listCategoriasProductos() {
  const data = await httpClient.get("/api/opticas/productos/categorias");
  return (Array.isArray(data) ? data : []).map(mapCategoria);
}

export async function listCategoriasServicios() {
  const data = await httpClient.get("/api/opticas/servicios/categorias");
  return (Array.isArray(data) ? data : []).map(mapCategoria);
}


export async function listProductos() {
  const data = await httpClient.get("/api/opticas/productos?limit=100");
  return (Array.isArray(data) ? data : []).map(mapProducto);
}

export async function createProducto(payload) {
  const created = await httpClient.post("/api/opticas/productos", {
    nombre: payload.name,
    sku: payload.code || undefined,
    marca: payload.brand || undefined,
    descripcion: payload.description || undefined,
    categoriaId: Number(payload.categoryId),
    precioVenta: Number(payload.salePrice),
    stockMinimo: payload.stockMin === "" || payload.stockMin == null ? undefined : Number(payload.stockMin),
  });
  return mapProducto(created);
}

export async function updateProducto(id, payload) {
  const updated = await httpClient.patch(`/api/opticas/productos/${id}`, {
    nombre: payload.name,
    sku: payload.code || undefined,
    marca: payload.brand || undefined,
    descripcion: payload.description || undefined,
    categoriaId: Number(payload.categoryId),
    precioVenta: Number(payload.salePrice),
    stockMinimo: payload.stockMin === "" || payload.stockMin == null ? undefined : Number(payload.stockMin),
  });
  return mapProducto(updated);
}

export async function deactivateProducto(id) {
  return mapProducto(await httpClient.patch(`/api/opticas/productos/${id}/estado`, { activo: false }));
}

export async function activateProducto(id) {
  return mapProducto(await httpClient.patch(`/api/opticas/productos/${id}/estado`, { activo: true }));
}


export async function listServicios() {
  const data = await httpClient.get("/api/opticas/servicios?limit=100");
  return (Array.isArray(data) ? data : []).map(mapServicio);
}

export async function createServicio(payload) {
  const created = await httpClient.post("/api/opticas/servicios", {
    nombre: payload.name,
    codigo: payload.code || undefined,
    descripcion: payload.description || undefined,
    categoriaId: Number(payload.categoryId),
    precio: Number(payload.price),
  });
  return mapServicio(created);
}

export async function updateServicio(id, payload) {
  const updated = await httpClient.patch(`/api/opticas/servicios/${id}`, {
    nombre: payload.name,
    codigo: payload.code || undefined,
    descripcion: payload.description || undefined,
    categoriaId: Number(payload.categoryId),
    precio: Number(payload.price),
  });
  return mapServicio(updated);
}

export async function deactivateServicio(id) {
  return mapServicio(await httpClient.patch(`/api/opticas/servicios/${id}/estado`, { activo: false }));
}

export async function activateServicio(id) {
  return mapServicio(await httpClient.patch(`/api/opticas/servicios/${id}/estado`, { activo: true }));
}
