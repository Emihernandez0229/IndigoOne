import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import { LAB_STATUS_LABELS, SERVICE_TYPE_LABELS } from "../../laboratory/constants";


function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
}


/**
 * Tabla compacta de trabajos individuales (folio/cliente/fecha/servicio y,
 * opcionalmente, estado) - usada en los "Ver más" de Reportes para mostrar
 * el detalle real detrás de un numero agregado.
 */
export default function JobDetailTable({ jobs = [], showStatus = true }) {

  const columns = [
    { key: "folio", label: "Folio" },
    { key: "clientName", label: "Cliente" },
    { key: "entryAt", label: "Fecha registrado", render: (row) => formatDateTime(row.entryAt) },
    {
      key: "service",
      label: "Producto / servicio",
      render: (row) => `${SERVICE_TYPE_LABELS[row.serviceType] ?? row.serviceType} · ${row.biselType} · ${row.quantity} ${row.quantity > 1 ? "pzas" : "pza"}`,
    },
    ...(showStatus
      ? [{ key: "status", label: "Estado", render: (row) => <StatusBadge status={row.status} label={LAB_STATUS_LABELS[row.status]} /> }]
      : []),
  ];

  return <DataTable columns={columns} data={jobs} pageSize={5} emptyMessage="Sin trabajos." />;

}
