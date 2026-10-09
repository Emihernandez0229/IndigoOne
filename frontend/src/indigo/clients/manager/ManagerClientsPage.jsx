import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import PageContainer from "../../../shared/layouts/PageContainer";
import KpiRow from "../../../shared/components/KpiRow";
import Button from "../../../shared/components/Button";
import SearchInput from "../../../shared/components/SearchInput";
import FilterBar from "../../../shared/filters/FilterBar";
import SelectFilter from "../../../shared/filters/SelectFilter";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import ErrorState from "../../../shared/components/ErrorState";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";
import SidePanel from "../../../shared/components/SidePanel";
import Can from "../../../shared/security/Can";
import { useAuth } from "../../../shared/context/AuthContext";
import usePermissions from "../../../shared/hooks/usePermissions";

import useClients from "../hooks/useClients";
import useBranches from "../../branches/hooks/useBranches";
import { filterClients } from "../filterClients";
import { CLIENT_STATUSES } from "../constants";
import ManagerClientTable from "./components/ManagerClientTable";
import ClientDetailPanel from "../components/ClientDetailPanel";


export default function ManagerClientsPage() {

  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { can } = usePermissions();
  const { clients, loading: loadingClients, error: errorClients, deactivate, activate } = useClients();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [viewingClientId, setViewingClientId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  const branchClients = useMemo(
    () => clients.filter((c) => (c.branches ?? []).some((b) => b.indigoBranchId === myBranch?.id)),
    [clients, myBranch]
  );

  const viewingClient = branchClients.find((c) => c.id === viewingClientId) ?? null;

  const filtered = useMemo(
    () => filterClients(branchClients, { query, status }),
    [branchClients, query, status]
  );

  const kpis = useMemo(() => {
    const active = branchClients.filter((c) => c.status === "active").length;
    const inactive = branchClients.filter((c) => c.status === "inactive").length;

    return [
      {
        id: "total", type: "customers", title: "Total de clientes", color: "blue",
        value: String(branchClients.length), description: "De tu sucursal",
      },
      {
        id: "active", type: "available", title: "Clientes activos", color: "green",
        value: String(active), description: "Con relación comercial vigente",
      },
      {
        id: "inactive", type: "canceled", title: "Clientes inactivos", color: "red",
        value: String(inactive), description: "Sin movimiento actual",
      },
    ];
  }, [branchClients]);

  const loading = loadingClients || loadingBranches;
  const error = errorClients || errorBranches;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer
      title="Clientes"
      description="Registra y administra las ópticas clientes de tu sucursal."
      actions={
        <Can permission="client.create">
          <Button
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => navigate("/indigo/clientes/nuevo")}
          >
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        </Can>
      }
    >

      <div className="flex items-start gap-6">

        <div className="min-w-0 flex-1 space-y-6 transition-all duration-300 ease-in-out">

          <KpiRow items={kpis} />

          <FilterBar>
            <SearchInput
              className="w-full sm:max-w-xs"
              value={query}
              onChange={setQuery}
              placeholder="Buscar por nombre o código"
            />
            <SelectFilter
              label="Estado"
              value={status}
              onChange={setStatus}
              placeholder="Todos los estados"
              options={CLIENT_STATUSES}
            />
          </FilterBar>

          <ManagerClientTable
            clients={filtered}
            canEdit={can("client.update")}
            canDeactivate={can("client.deactivate")}
            onView={(client) => setViewingClientId(client.id)}
            onEdit={(client) => navigate(`/indigo/clientes/${client.id}/editar`)}
            onDeactivate={(client) => setConfirmAction({ type: "deactivate", client })}
            onActivate={(client) => setConfirmAction({ type: "activate", client })}
          />

        </div>

        <SidePanel
          isOpen={Boolean(viewingClient)}
          onClose={() => setViewingClientId(null)}
          title="Detalle de cliente"
        >
          <ClientDetailPanel client={viewingClient} showBranches={false} />
        </SidePanel>

      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.type === "activate" ? "Dar de alta cliente" : "Dar de baja cliente"}
        description={
          confirmAction &&
          (confirmAction.type === "activate"
            ? `¿Seguro que quieres dar de alta a "${confirmAction.client.name}"?`
            : `¿Seguro que quieres dar de baja a "${confirmAction.client.name}"?`)
        }
        confirmLabel={confirmAction?.type === "activate" ? "Dar de alta" : "Dar de baja"}
        variant={confirmAction?.type === "activate" ? "primary" : "danger"}
        onConfirm={() =>
          confirmAction.type === "activate"
            ? activate(confirmAction.client.id)
            : deactivate(confirmAction.client.id)
        }
        onClose={() => setConfirmAction(null)}
      />

    </PageContainer>
  );
}
