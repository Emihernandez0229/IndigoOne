import { Eye } from "lucide-react";

import DataTable from "../../../shared/components/DataTable";
import IconButton from "../../../shared/components/IconButton";

const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;


/**
 * Tabla de desglose por grupo (sucursal, servicio, etc.), ordenada por el
 * total descendente, con una columna de % sobre el gran total. `metrics`
 * agrega columnas numéricas intermedias (operaciones, unidades...) antes
 * de la columna de total. Con `onView`, agrega una columna de Acciones con
 * un ojito para desplegar el detalle de esa fila en otra parte (ver
 * VentasReportTab); `viewedId` resalta la fila actualmente desplegada.
 */
export default function SalesDetailTable({
  rows = [],
  nameLabel = "Sucursal",
  metrics = [
    { key: "operaciones", label: "Operaciones" },
    { key: "unidades", label: "Unidades" },
  ],
  totalLabel = "Total",
  formatTotal = currency,
  pctLabel = "% del total",
  emptyMessage = "No hay datos que coincidan con los filtros.",
  onView,
  viewedId,
}) {

  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);
  const sorted = [...rows].sort((a, b) => b.total - a.total);

  const columns = [
    { key: "name", label: nameLabel, render: (row) => <span className="font-medium text-text-primary">{row.name}</span> },
    ...metrics.map((m) => ({ key: m.key, label: m.label, render: m.render ?? ((row) => row[m.key]) })),
    { key: "total", label: totalLabel, render: (row) => <span className="font-bold text-text-primary">{formatTotal(row.total)}</span> },
    {
      key: "pct",
      label: pctLabel,
      render: (row) => `${grandTotal ? Math.round((row.total / grandTotal) * 1000) / 10 : 0}%`,
    },
    ...(onView ? [{
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <IconButton
          icon={Eye}
          label={row.id === viewedId ? "Ocultar detalle" : "Ver detalle"}
          onClick={() => onView(row)}
        />
      ),
    }] : []),
  ];

  return (
    <DataTable
      columns={columns}
      data={sorted}
      emptyMessage={emptyMessage}
    />
  );

}
