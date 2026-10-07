import { httpClient } from "../../../shared/api/httpClient";


function mapReceta(raw) {
  if (!raw) return null;
  return {
    odEsfera: raw.od_esfera ?? raw.odEsfera ?? "",
    odCilindro: raw.od_cilindro ?? raw.odCilindro ?? "",
    odEje: raw.od_eje ?? raw.odEje ?? "",
    oiEsfera: raw.oi_esfera ?? raw.oiEsfera ?? "",
    oiCilindro: raw.oi_cilindro ?? raw.oiCilindro ?? "",
    oiEje: raw.oi_eje ?? raw.oiEje ?? "",
    adicion: raw.adicion ?? "",
    dp: raw.dp ?? "",
  };
}


function mapOrder(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    branchId: raw.sucursal_id ?? raw.branchId ?? null,
    patientId: raw.paciente_id ?? raw.patientId ?? null,
    saleId: raw.venta_id ?? raw.saleId ?? null,
    items: Array.isArray(raw.items)
      ? raw.items.map((item) => ({
          productId: item.producto_id ?? item.productId,
          code: item.codigo ?? item.code ?? "",
          model: item.modelo ?? item.model ?? "",
        }))
      : [],
    receta: mapReceta(raw.receta),
    notes: raw.observaciones ?? raw.notes ?? "",
    status: raw.estado ?? raw.status ?? "pendiente",
    createdBy: raw.creado_por ?? raw.createdBy ?? null,
    createdAt: raw.created_at ?? raw.createdAt ?? null,
  };
}


export async function listOrders(branchId) {
  const { ordenes } = await httpClient.get(
    `/api/opticas/laboratorio?sucursalId=${branchId}`
  );
  return (ordenes ?? []).map(mapOrder);
}


export async function getOrder(id) {
  const { orden } = await httpClient.get(`/api/opticas/laboratorio/${id}`);
  return mapOrder(orden);
}


export async function createOrder(payload) {
  const { orden } = await httpClient.post("/api/opticas/laboratorio", {
    sucursalId: payload.branchId,
    pacienteId: payload.patientId,
    ventaId: payload.saleId,
    items: payload.items.map((item) => ({
      productoId: item.productId,
      codigo: item.code,
      modelo: item.model,
    })),
    receta: {
      odEsfera: payload.receta.odEsfera || null,
      odCilindro: payload.receta.odCilindro || null,
      odEje: payload.receta.odEje || null,
      oiEsfera: payload.receta.oiEsfera || null,
      oiCilindro: payload.receta.oiCilindro || null,
      oiEje: payload.receta.oiEje || null,
      adicion: payload.receta.adicion || null,
      dp: payload.receta.dp || null,
    },
    observaciones: payload.notes || null,
  });
  return mapOrder(orden);
}


export async function updateOrderStatus(id, status) {
  const { orden } = await httpClient.patch(`/api/opticas/laboratorio/${id}/estado`, {
    estado: status,
  });
  return mapOrder(orden);
}
