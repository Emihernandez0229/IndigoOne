const ESTADO_A_FRONT = {
  pendiente: "pending",
  en_proceso: "processing",
  terminado: "completed",
  merma: "loss",
  garantia: "warranty",
};

function aTrabajoFront(row) {
  const esMerma = row.estado === "merma";

  return {
    id: row.id,
    folio: row.folio,
    branchId: row.indigo_sucursal_id,
    branchName: row.sucursal_nombre,
    clientId: row.optica_id,
    clientName: row.optica_nombre,
    seller: row.vendedor_nombre,
    sellerId: row.vendedor_id,
    registeredBy: row.creado_por_nombre,
    registeredById: row.creado_por,
    serviceType: row.tipo_servicio,
    biselType: row.tipo_bisel,
    quantity: row.cantidad,
    urgent: row.urgente,
    entryAt: row.created_at,
    requestedDeliveryAt: row.fecha_entrega,
    status: ESTADO_A_FRONT[row.estado] ?? row.estado,
    acceptedBy: row.aceptado_por_nombre ?? null,
    acceptedAt: row.aceptado_at ?? null,
    labPerson: row.realizado_por_nombre ?? row.aceptado_por_nombre ?? null,
    completedAt: row.finalizado_at ?? null,
    deliveredAt: null,
    lossReason: row.motivo_merma ?? null,
    lossBy: esMerma ? row.realizado_por_nombre ?? null : null,
    workItems: row.detalles ?? [],
  };
}

module.exports = { aTrabajoFront };