import {Eye, Pencil, Ban, RotateCcw} from "lucide-react";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import IconButton from "../../../shared/components/IconButton";


export default function BranchTable({
  branches = [],
  canEdit = false,
  canDeactivate = false,
  onView,
  onEdit,
  onDeactivate,
  onActivate,
}) {

  const columns = [

    {
      key: "displayId",
      label: "ID"
    },
    {
      key: "name",
      label: "Sucursal"
    },
    {
      key: "address",
      label: "Dirección"
    },
    {
      key: "manager",
      label: "Responsable"
    },
    {
      key: "phone",
      label: "Teléfono"
    },
    {
      key: "products",
      label: "Productos"
    },
    {
      key: "staff",
      label: "Personal"
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => (
        <StatusBadge
          status={row.status}
        />
      ),
    },

    {
      key: "actions",
      label: "Acciones",

      render: (row) => (

        <div
          className="
            flex
            items-center
            gap-1
          "
        >
          <IconButton
            icon={Eye}
            label="Ver"
            onClick={() =>
              onView(row)
            }
          />

          {canEdit && (

            <IconButton
              icon={Pencil}
              label="Editar"
              onClick={() =>
                onEdit(row)
              }
            />

          )}


          {canDeactivate &&
            (row.status === "active" ? (

              <IconButton
                icon={Ban}
                label="Dar de baja"
                variant="danger"
                onClick={() =>
                  onDeactivate(row)
                }
              />

            ) : (

              <IconButton
                icon={RotateCcw}
                label="Dar de alta"
                onClick={() =>
                  onActivate(row)
                }
              />

            ))}
        </div>
      ),
    },
  ];


  return (
    <DataTable
      columns={columns}
      data={branches}
      emptyMessage="No hay sucursales que coincidan con la busqueda"
    />
  );

}