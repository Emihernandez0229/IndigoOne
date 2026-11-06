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
import SidePanel from "../../shared/components/SidePanel";
import Can from "../../shared/security/Can";
import usePermissions from "../../shared/hooks/usePermissions";

import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import useBranches from "./hooks/useBranches";
import useUsers from "../users/hooks/useUsers";
import usePatients from "../pacientes/hooks/usePatients";
import useProductos from "../catalogo/hooks/useProductos";
import { withManagerInfo, withBranchCounts } from "./services/branchService";
import { filterBranches } from "./filterBranches";
import BranchTable from "./components/BranchTable";
import BranchFormModal from "./components/BranchFormModal";
import BranchDetailPanel from "./components/BranchDetailPanel";
import AssignManagerModal from "./components/AssignManagerModal";
import MyBranchPage from "./MyBranchPage";
import { BRANCH_STATUSES } from "./constants";


export default function BranchesPage() {

  const { user: currentUser } = useAuth();

  if (currentUser?.role === ROLES.OPTICA_ENCARGADO) {
    return <MyBranchPage />;
  }

  return <BranchesList />;

}


function BranchesList() {

  const { can } = usePermissions();
  const { branches: rawBranches, loading, error, create, update, deactivate, activate, assignManager, changeManager } = useBranches();
  const { users, reload: reloadUsers } = useUsers();
  const { patients } = usePatients("", { scopeToAll: true });
  const { productos } = useProductos();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", branch: null });
  const [viewingBranchId, setViewingBranchId] = useState(null);
  const [managerModalBranch, setManagerModalBranch] = useState(null);
  const [branchToDeactivate, setBranchToDeactivate] = useState(null);
  const [branchToActivate, setBranchToActivate] = useState(null);


  // El back no manda gerente/personal/pacientes/productos pegados a la
  // sucursal - se resuelven aquí cruzando con lo que ya cargan los demás
  // módulos (ver withManagerInfo/withBranchCounts).
  const branches = useMemo(
    () => withBranchCounts(withManagerInfo(rawBranches, users), { users, patients, productos }),
    [rawBranches, users, patients, productos]
  );

  const filtered = useMemo(
    () => filterBranches(branches, { query, status }),
    [branches, query, status]
  );

  const viewingBranch = branches.find((b) => b.id === viewingBranchId) ?? null;


  const kpis = useMemo(() => {
    const activeStaff = users.filter((u) => u.status === "active").length;
    const inactiveStaff = users.filter((u) => u.status === "inactive").length;
    const activeBranches = branches.filter((b) => b.status === "active").length;
    const inactiveBranches = branches.filter((b) => b.status !== "active").length;
    const conGerente = branches.filter((b) => b.managerId).length;
    const sinGerente = branches.length - conGerente;

    return [
      {
        id: "total", type: "branches", title: "Total de sucursales", color: "blue",
        value: String(branches.length),
        description: `Activas: ${activeBranches}  ·  Inactivas: ${inactiveBranches}`,
      },
      {
        id: "staff", type: "team", title: "Total de personal", color: "pink",
        value: String(activeStaff + inactiveStaff),
        description: `Activos: ${activeStaff}  ·  Inactivos: ${inactiveStaff}`,
      },
      {
        id: "withManager", type: "cities", title: "Con gerente asignado", color: "purple",
        value: String(conGerente),
        description: "De todas las sucursales",
      },
      {
        id: "withoutManager", type: "cities", title: "Sin gerente asignado", color: "orange",
        value: String(sinGerente),
        description: "Pendientes de asignar",
      },
    ];
  }, [branches, users]);


  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleSubmit = async (payload) => {
    if (modal.mode === "edit" && modal.branch) {
      await update(modal.branch.id, payload);
    } else {
      await create(payload);
      reloadUsers();
    }
  };

  const handleAssignManager = async (managerId) => {
    if (managerModalBranch.managerId) {
      await changeManager(managerModalBranch.id, managerId);
    } else {
      await assignManager(managerModalBranch.id, managerId);
    }
    reloadUsers();
  };


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;


  return (

    <PageContainer
      title="Sucursales"
      description="Gestión de las sucursales de la óptica."
      actions={
        <Can permission="optica.branch.create">
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

      <div className="flex items-start gap-6">

        <div className="min-w-0 flex-1 space-y-6 transition-all duration-300 ease-in-out">

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
            canEdit={can("optica.branch.update")}
            canDeactivate={can("optica.branch.deactivate")}
            onView={(branch) => setViewingBranchId(branch.id)}
            onEdit={(branch) => setModal({ open: true, mode: "edit", branch })}
            onDeactivate={(branch) => setBranchToDeactivate(branch)}
            onActivate={(branch) => setBranchToActivate(branch)}
          />

        </div>

        <SidePanel
          isOpen={Boolean(viewingBranch)}
          onClose={() => setViewingBranchId(null)}
          title="Detalle de sucursal"
        >
          <BranchDetailPanel
            branch={viewingBranch}
            canManage={can("optica.branch.update")}
            onAssignManager={() => setManagerModalBranch(viewingBranch)}
          />
        </SidePanel>

      </div>

      <BranchFormModal
        key={`${modal.mode}-${modal.branch?.id ?? "new"}-${modal.open}`}
        open={modal.open}
        mode={modal.mode}
        branch={modal.branch}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <AssignManagerModal
        open={Boolean(managerModalBranch)}
        branch={managerModalBranch}
        onClose={() => setManagerModalBranch(null)}
        onSubmit={handleAssignManager}
      />

      <ConfirmDialog
        open={Boolean(branchToDeactivate)}
        title="Dar de baja sucursal"
        description={branchToDeactivate && `¿Dar de baja "${branchToDeactivate.name}"?`}
        confirmLabel="Dar de baja"
        variant="danger"
        onConfirm={() => deactivate(branchToDeactivate.id)}
        onClose={() => setBranchToDeactivate(null)}
      />

      <ConfirmDialog
        open={Boolean(branchToActivate)}
        title="Dar de alta sucursal"
        description={branchToActivate && `¿Dar de alta "${branchToActivate.name}"?`}
        confirmLabel="Dar de alta"
        variant="primary"
        onConfirm={() => activate(branchToActivate.id)}
        onClose={() => setBranchToActivate(null)}
      />

    </PageContainer>

  );

}
