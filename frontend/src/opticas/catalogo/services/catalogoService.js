import { httpClient } from "../../../shared/api/httpClient";


function mapProducto(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    displayId: raw.display_id ?? raw.displayId,
    code: raw.codigo ?? raw.code ?? "",
    barcode: raw.codigo_barras ?? raw.barcode ?? "",
    name: raw.nombre ?? raw.name ?? "",
    category: raw.categoria ?? raw.category ?? "",
    brand: raw.marca ?? raw.brand ?? "",
    description: raw.descripcion ?? raw.description ?? "",
    salePrice: Number(raw.precio_venta ?? raw.salePrice ?? 0),
    cost: Number(raw.costo ?? raw.cost ?? 0),
    tax: Number(raw.impuesto ?? raw.tax ?? 0),
    unit: raw.unidad_medida ?? raw.unit ?? "pieza",
    active: raw.active ?? raw.estado !== "inactive",
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
    tax: Number(raw.impuesto ?? raw.tax ?? 0),
    duration: Number(raw.duracion_estimada ?? raw.duration ?? 0),
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
    codigo_barras: payload.barcode || null,
    nombre: payload.name,
    categoria: payload.category,
    marca: payload.brand,
    descripcion: payload.description,
    precio_venta: payload.salePrice,
    costo: payload.cost,
    impuesto: payload.tax,
    unidad_medida: payload.unit,
  });
  return mapProducto(created);
}

export async function updateProducto(id, payload) {
  const updated = await httpClient.put(`/api/opticas/productos/${id}`, {
    codigo: payload.code,
    codigo_barras: payload.barcode || null,
    nombre: payload.name,
    categoria: payload.category,
    marca: payload.brand,
    descripcion: payload.description,
    precio_venta: payload.salePrice,
    costo: payload.cost,
    impuesto: payload.tax,
    unidad_medida: payload.unit,
  });
  return mapProducto(updated);
}

export async function deactivateProducto(id) {
  return mapProducto(await httpClient.patch(`/api/opticas/productos/${id}/deactivate`));
}

export async function activateProducto(id) {
  return mapProducto(await httpClient.patch(`/api/opticas/productos/${id}/activate`));
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
    impuesto: payload.tax,
    duracion_estimada: payload.duration,
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
    impuesto: payload.tax,
    duracion_estimada: payload.duration,
  });
  return mapServicio(updated);
}

export async function deactivateServicio(id) {
  return mapServicio(await httpClient.patch(`/api/opticas/servicios/${id}/deactivate`));
}

export async function activateServicio(id) {
  return mapServicio(await httpClient.patch(`/api/opticas/servicios/${id}/activate`));
}
