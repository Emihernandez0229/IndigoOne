import { Eye } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";

export default function ClientTable({ clients = [], onView }) {

  const columns = [
    { key: "code", label: "Código" },
    { key: "name", label: "Cliente" },
    { key: "businessName", label: "Razón social" },
    { key: "branchName", label: "Sucursal" },
    { key: "phone", label: "Teléfono" },
    {
      key: "status",
      label: "Estado",
      render: (row) => (
        <StatusBadge
          status={row.status}
          label={row.status === "active" ? "Activo" : "Inactivo"}
        />
      ),
    },
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
      data={clients}
      emptyMessage="No hay clientes que coincidan con la búsqueda."
    />
  );
}
