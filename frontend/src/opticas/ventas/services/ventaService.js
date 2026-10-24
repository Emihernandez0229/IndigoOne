import { httpClient } from "../../../shared/api/httpClient";


function mapItem(raw) {
  return {
    productId: raw.producto_id ?? raw.productId ?? null,
    itemType: raw.item_type ?? raw.itemType ?? "producto",
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
    folio: raw.folio ?? "",
    branchId: raw.sucursal_id ?? raw.branchId ?? null,
    patientId: raw.paciente_id ?? raw.patientId ?? null,
    createdBy: raw.creado_por ?? raw.createdBy ?? null,
    sellerName: raw.vendedor_nombre ?? raw.sellerName ?? "",
    workType: raw.tipo_trabajo ?? raw.workType ?? "venta_directa",
    priority: raw.prioridad ?? raw.priority ?? "normal",
    paymentMethod: raw.metodo_pago ?? raw.paymentMethod ?? "",
    subtotal: Number(raw.subtotal ?? 0),
    iva: Number(raw.iva ?? 0),
    total: Number(raw.total ?? 0),
    montoPagado: Number(raw.monto_pagado ?? raw.montoPagado ?? raw.total ?? 0),
    saldoPendiente: Number(raw.saldo_pendiente ?? raw.saldoPendiente ?? 0),
    status: raw.estado ?? raw.status ?? "pendiente",
    // "pago" no se guarda como estado, se deriva del saldo pendiente.
    paymentStatus: Number(raw.saldo_pendiente ?? raw.saldoPendiente ?? 0) > 0 ? "en_adeudo" : "liquidada",
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    paidAt: raw.pagada_at ?? raw.paidAt ?? null,
    enProcesoAt: raw.en_proceso_at ?? raw.enProcesoAt ?? null,
    completedAt: raw.completada_at ?? raw.completedAt ?? null,
    cancelledAt: raw.cancelada_at ?? raw.cancelledAt ?? null,
    items: Array.isArray(raw.items) ? raw.items.map(mapItem) : [],
  };
}


export async function listVentas(branchId) {
  const { ventas } = await httpClient.get(
    `/api/opticas/ventas?sucursalId=${branchId ?? ""}`
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
    creadoPor: payload.createdBy,
    tipoTrabajo: payload.workType,
    prioridad: payload.priority,
    metodoPago: payload.paymentMethod,
    subtotal: payload.subtotal,
    iva: payload.iva,
    total: payload.total,
    montoPagado: payload.montoPagado,
    saldoPendiente: payload.saldoPendiente,
    items: payload.items.map((item) => ({
      productoId: item.productId,
      itemType: item.itemType,
      cantidad: item.quantity,
      precioUnitario: item.unitPrice,
    })),
  });
  return mapVenta(venta);
}


export async function liquidarVenta(id, monto) {
  const { venta } = await httpClient.patch(`/api/opticas/ventas/${id}/liquidar`, { monto });
  return mapVenta(venta);
}


export async function changeVentaStatus(id, estado) {
  const { venta } = await httpClient.patch(`/api/opticas/ventas/${id}/estado`, { estado });
  return mapVenta(venta);
}


export async function cancelVenta(id) {
  const { venta } = await httpClient.patch(`/api/opticas/ventas/${id}/cancelar`);
  return mapVenta(venta);
}
