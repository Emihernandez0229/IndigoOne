import { Eye } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import IconButton from "../../../shared/components/IconButton";
import PriorityBadge from "../../laboratory/components/PriorityBadge";


function formatLossAt(merma) {
  if (!merma.lossAt) return "—";
  return new Date(merma.lossAt).toLocaleString("es-MX", { day: "2-digit", month: "2-digit", year: "numeric", hour: "numeric", minute: "2-digit" });
}


export default function MermaTable({ mermas = [], showBranchColumn = true, onView }) {

  const columns = [
    { key: "displayId", label: "ID" },
    ...(showBranchColumn ? [{ key: "branchName", label: "Sucursal" }] : []),
    { key: "clientName", label: "Cliente" },
    { key: "seller", label: "Vendedor" },
    { key: "biselType", label: "Bisel" },
    { key: "quantity", label: "Cant." },
    { key: "priority", label: "Prioridad", render: (row) => <PriorityBadge urgent={row.urgent} /> },
    { key: "labPerson", label: "Laboratorio" },
    { key: "lossAt", label: "Merma registrada", render: formatLossAt },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <div className="flex items-center gap-1">
          <IconButton icon={Eye} label="Ver" onClick={() => onView(row)} />
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={mermas}
      emptyMessage="No hay mermas que coincidan con la búsqueda."
      pageSize={10}
      rowClassName={(row) => (row.urgent ? "bg-[#FF6666]/5" : "")}
    />
  );
}
