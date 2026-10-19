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

import useUsers from "./hooks/useUsers";
import useBranches from "../branches/hooks/useBranches";
import { filterUsers } from "./filterUsers";
import UserTable from "./components/UserTable";
import UserDetailPanel from "./components/UserDetailPanel";
import PersonnelFormModal from "./components/PersonnelFormModal";
import EditPersonnelModal from "./components/EditPersonnelModal";
import { OPTICAS_PERSONAL_ROLES } from "./constants";
import ManagerPersonalPage from "./manager/ManagerPersonalPage";


/**
 * El Dueño ve "Personal" de todas las sucursales (UsersPage). El Jefe de
 * sucursal administra solo el personal de SU sucursal, con una vista de
 * tarjetas en vez de tabla (ManagerPersonalPage) - mismo patrón que
 * BranchesPage.jsx.
 */
export default function UsersPage() {

  const { user: currentUser } = useAuth();

  if (currentUser?.role === ROLES.OPTICA_ENCARGADO) {
    return <ManagerPersonalPage />;
  }

  return <UsersList />;

}


function UsersList() {

  const { can } = usePermissions();
  const { users: allUsers, loading: loadingUsers, error: errorUsers, create, update, deactivate, activate } = useUsers();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [branch, setBranch] = useState("");
  const [viewingUserId, setViewingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // El Personal nunca incluye al Dueño (no se administra a si mismo desde
  // aqui) - mismo criterio que la "Personal" de Indigo.
  const personalUsers = useMemo(
    () => allUsers.filter((user) => user.role !== ROLES.OPTICA_DUENO),
    [allUsers]
  );

  const viewingUser = personalUsers.find((user) => user.id === viewingUserId) ?? null;
  const viewingBranch = branches.find((b) => b.id === viewingUser?.branchId) ?? null;

  const branchOptions = useMemo(() => {
    const map = new Map();
    personalUsers.forEach((user) => {
      if (user.branchId != null && !map.has(user.branchId)) {
        map.set(user.branchId, { value: user.branchId, label: user.branchName });
      }
    });
    return [...map.values()];
  }, [personalUsers]);

  const filtered = useMemo(
    () => filterUsers(personalUsers, { query, role, branch }),
    [personalUsers, query, role, branch]
  );

  const kpis = useMemo(() => {
    const managers = personalUsers.filter((u) => u.role === ROLES.OPTICA_ENCARGADO).length;
    const sales = personalUsers.filter((u) => u.role === ROLES.OPTICA_EMPLEADO).length;
    const inactive = personalUsers.filter((u) => u.status === "inactive").length;

    return [
      {
        id: "total", type: "team", title: "Total de personal",
        value: String(personalUsers.length), description: "En todas las sucursales",
      },
      {
        id: "managers", type: "team", title: "Jefes de sucursal", color: "blue",
        value: String(managers), description: "Con sucursal asignada",
      },
      {
        id: "sales", type: "team", title: "Personal de ventas", color: "green",
        value: String(sales), description: "Ventas por sucursal",
      },
      {
        id: "inactive", type: "team", title: "Inactivos", color: "purple",
        value: String(inactive), description: "Dados de baja",
      },
    ];
  }, [personalUsers]);

  const loading = loadingUsers || loadingBranches;
  const error = errorUsers || errorBranches;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  const handleCreate = async (payload) => {
    await create(payload);
  };

  const handleEdit = async (payload) => {
    await update(editingUser.id, payload);
  };

  return (

    <PageContainer
      title="Personal"
      description="Consulta y administra al personal que pertenece a las sucursales de la óptica."
      actions={
        <Can permission="optica.user.create">
          <Button className="inline-flex items-center gap-2 py-2.5 text-sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo personal
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
              placeholder="Buscar por nombre o sucursal"
            />

            <SelectFilter
              label="Rol"
              value={role}
              onChange={setRole}
              placeholder="Todos los roles"
              options={OPTICAS_PERSONAL_ROLES}
            />

            <SelectFilter
              label="Sucursal"
              value={branch}
              onChange={setBranch}
              placeholder="Todas las sucursales"
              options={branchOptions}
            />
          </FilterBar>

          <UserTable
            users={filtered}
            canEdit={can("optica.user.update")}
            canDeactivate={can("optica.user.deactivate")}
            onView={(user) => setViewingUserId(user.id)}
            onEdit={(user) => setEditingUser(user)}
            onDeactivate={(user) => setConfirmAction({ type: "deactivate", user })}
            onActivate={(user) => setConfirmAction({ type: "activate", user })}
          />
        </div>

        <SidePanel
          isOpen={Boolean(viewingUser)}
          onClose={() => setViewingUserId(null)}
          title="Detalle de personal"
        >
          <UserDetailPanel
            user={viewingUser}
            branch={viewingBranch}
            canDeactivate={can("optica.user.deactivate")}
            onDeactivate={(user) => setConfirmAction({ type: "deactivate", user })}
            onActivate={(user) => setConfirmAction({ type: "activate", user })}
          />
        </SidePanel>

      </div>

      <PersonnelFormModal
        open={createOpen}
        branches={branches}
        existingUsers={allUsers}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <EditPersonnelModal
        key={editingUser?.id ?? "none"}
        open={Boolean(editingUser)}
        user={editingUser}
        branches={branches}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEdit}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction?.type === "activate"
            ? "Dar de alta usuario"
            : "Dar de baja usuario"
        }
        description={
          confirmAction &&
          (confirmAction.type === "activate"
            ? `¿Seguro que quieres dar de alta a "${confirmAction.user.name}"?`
            : `¿Seguro que quieres dar de baja a "${confirmAction.user.name}"?`)
        }
        confirmLabel={confirmAction?.type === "activate" ? "Dar de alta" : "Dar de baja"}
        variant={confirmAction?.type === "activate" ? "primary" : "danger"}
        onConfirm={() =>
          confirmAction.type === "activate"
            ? activate(confirmAction.user.id)
            : deactivate(confirmAction.user.id)
        }
        onClose={() => setConfirmAction(null)}
      />

    </PageContainer>
  );
}
