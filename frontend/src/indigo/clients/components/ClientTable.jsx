import { Eye } from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";

export default function ClientTable({ clients = [], onView }) {

  const columns = [
    { key: "code", label: "ID" },
    { key: "name", label: "Cliente" },
    { key: "type", label: "Tipo" },
    { key: "rfc", label: "RFC" },
    { key: "phone", label: "Teléfono" },
    { key: "email", label: "Correo" },
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
      key: "branches",
      label: "Sucursales",
      render: (row) => (row.branches ?? []).length,
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
      pageSize={10}
    />
  );
}
