import { useMemo, useState } from "react";

import { Plus } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import Button from "../../shared/components/Button";
import SearchInput from "../../shared/components/SearchInput";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import Can from "../../shared/security/Can";
import usePermissions from "../../shared/hooks/usePermissions";

import useBranches from "./hooks/useBranches";
import { filterBranches } from "./filterBranches";
import BranchTable from "./components/BranchTable";
import BranchFormModal from "./components/BranchFormModal";
import { BRANCH_STATUSES } from "./constants";


export default function BranchesPage() {

  const { can } = usePermissions();
  const { branches, loading, error, create, update, deactivate, activate } = useBranches();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", branch: null });
  const [branchToDeactivate, setBranchToDeactivate] = useState(null);


  const filtered = useMemo(
    () => filterBranches(branches, { query, status }),
    [branches, query, status]
  );


  const kpis = useMemo(() => [
    {
      id: "total", type: "branches", title: "Sucursales",
      value: String(branches.length), description: "En tu alcance",
    },
    {
      id: "active", type: "branches", title: "Sucursales activas",
      value: String(branches.filter((b) => b.status === "active").length),
      description: "Operando",
    },
    {
      id: "staff", type: "team", title: "Total de personal",
      value: String(branches.reduce((sum, b) => sum + (b.staff || 0), 0)),
      description: "En todas las sucursales",
    },
    {
      id: "products", type: "products", title: "Total de productos",
      value: String(branches.reduce((sum, b) => sum + (b.products || 0), 0)),
      description: "Inventario acumulado",
    },
  ], [branches]);


  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleSubmit = async (payload) => {
    if (modal.mode === "edit" && modal.branch) {
      await update(modal.branch.id, payload);
    } else {
      await create(payload);
    }
  };


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;


  return (

    <PageContainer
      title="Sucursales"
      description="Gestión de las sucursales de Indigo."
      actions={
        <Can permission="branch.create">
          <Button
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => setModal({ open: true, mode: "create", branch: null })}
          >
            <Plus className="h-4 w-4" />
            Nueva sucursal
          </Button>
        </Can>
      }
    >

      <div className="space-y-6">

        <KpiRow items={kpis} />

        <FilterBar>
          <SearchInput
            className="w-full sm:max-w-xs"
            value={query}
            onChange={setQuery}
            placeholder="Buscar por ID o nombre"
          />
          <SelectFilter
            label="Estado"
            value={status}
            onChange={setStatus}
            placeholder="Todos los estados"
            options={BRANCH_STATUSES}
          />
        </FilterBar>

        <BranchTable
          branches={filtered}
          canEdit={can("branch.update")}
          canDeactivate={can("branch.deactivate")}
          onView={(branch) => setModal({ open: true, mode: "view", branch })}
          onEdit={(branch) => setModal({ open: true, mode: "edit", branch })}
          onDeactivate={(branch) => setBranchToDeactivate(branch)}
          onActivate={(branch) => activate(branch.id)}
        />

      </div>

      <BranchFormModal
        key={`${modal.mode}-${modal.branch?.id ?? "new"}-${modal.open}`}
        open={modal.open}
        mode={modal.mode}
        branch={modal.branch}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(branchToDeactivate)}
        title="Dar de baja sucursal"
        description={
          branchToDeactivate &&
          `¿Seguro que quieres dar de baja "${branchToDeactivate.name}"? Podrás volver a activarla después.`
        }
        confirmLabel="Dar de baja"
        variant="danger"
        onConfirm={() => deactivate(branchToDeactivate.id)}
        onClose={() => setBranchToDeactivate(null)}
      />

    </PageContainer>

  );

}
