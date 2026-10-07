import { httpClient } from "../../../shared/api/httpClient";


function mapItem(raw) {
  return {
    productId: raw.producto_id ?? raw.productId ?? null,
    code: raw.codigo ?? raw.code ?? "",
    model: raw.modelo ?? raw.model ?? "",
    quantity: Number(raw.cantidad ?? raw.quantity ?? 0),
    unitPrice: Number(raw.precio_unitario ?? raw.unitPrice ?? 0),
    subtotal: Number(raw.subtotal ?? 0),
  };
}


function mapVenta(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    branchId: raw.sucursal_id ?? raw.branchId ?? null,
    patientId: raw.paciente_id ?? raw.patientId ?? null,
    paymentMethod: raw.metodo_pago ?? raw.paymentMethod ?? "",
    subtotal: Number(raw.subtotal ?? 0),
    iva: Number(raw.iva ?? 0),
    total: Number(raw.total ?? 0),
    montoPagado: Number(raw.monto_pagado ?? raw.montoPagado ?? raw.total ?? 0),
    saldoPendiente: Number(raw.saldo_pendiente ?? raw.saldoPendiente ?? 0),
    status: raw.estado ?? raw.status ?? "completada",
    createdBy: raw.creado_por ?? raw.createdBy ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    items: Array.isArray(raw.items) ? raw.items.map(mapItem) : [],
  };
}


export async function listVentas(branchId) {
  const { ventas } = await httpClient.get(
    `/api/opticas/ventas?sucursalId=${branchId}`
  );
  return (ventas ?? []).map(mapVenta);
}


export async function getVenta(id) {
  const { venta } = await httpClient.get(`/api/opticas/ventas/${id}`);
  return mapVenta(venta);
}


export async function createVenta(payload) {
  const { venta } = await httpClient.post("/api/opticas/ventas", {
    sucursalId: payload.branchId,
    pacienteId: payload.patientId,
    metodoPago: payload.paymentMethod,
    subtotal: payload.subtotal,
    iva: payload.iva,
    total: payload.total,
    montoPagado: payload.montoPagado,
    saldoPendiente: payload.saldoPendiente,
    items: payload.items.map((item) => ({
      productoId: item.productId,
      cantidad: item.quantity,
      precioUnitario: item.unitPrice,
    })),
  });
  return mapVenta(venta);
}


export async function cancelVenta(id) {
  const { venta } = await httpClient.patch(`/api/opticas/ventas/${id}/cancelar`);
  return mapVenta(venta);
}
