import { useMemo, useState } from "react";
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
import { useAuth } from "../../../shared/context/AuthContext";
import { ROLES } from "../../../shared/security/roles";

import useUsers from "../hooks/useUsers";
import useBranches from "../../branches/hooks/useBranches";
import { filterUsers } from "../filterUsers";
import { SUPERUSER_PERSONAL_ROLES } from "../constants";
import UserDetailPanel from "../components/UserDetailPanel";
import PersonalTable from "./components/PersonalTable";
import PersonalFormModal from "./components/PersonalFormModal";
import EditPersonalModal from "./components/EditPersonalModal";
import ResetPasswordModal from "./components/ResetPasswordModal";


export default function SuperUserPersonalPage() {

  const { user: currentUser } = useAuth();
  const {
    users, loading: loadingUsers, error: errorUsers,
    createPersonal, updatePersonal, deactivatePersonal, activatePersonal, resetPersonalPassword,
  } = useUsers();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [branch, setBranch] = useState("");
  const [status, setStatus] = useState("");
  const [viewingUserId, setViewingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);

  // Todo el personal menos el propio Super usuario (no se administra a si
  // mismo desde aqui).
  const personal = useMemo(
    () => users.filter((u) => u.role !== ROLES.INDIGO_SUPER_USUARIO),
    [users]
  );

  const viewingUser = personal.find((u) => u.id === viewingUserId) ?? null;
  const viewingBranch = branches.find((b) => b.id === viewingUser?.branchId) ?? null;

  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.name })),
    [branches]
  );

  const filtered = useMemo(
    () => filterUsers(personal, { query, role, branch, status }),
    [personal, query, role, branch, status]
  );

  const kpis = useMemo(() => {
    const duenos = personal.filter((u) => u.role === ROLES.INDIGO_DUENO).length;
    const managers = personal.filter((u) => u.role === ROLES.INDIGO_GERENTE_SUCURSAL).length;
    const operational = personal.filter(
      (u) =>
        u.role === ROLES.INDIGO_SUBGERENTE ||
        u.role === ROLES.INDIGO_EMPLEADO_VENTAS ||
        u.role === ROLES.INDIGO_EMPLEADO_LABORATORIO
    ).length;
    const inactive = personal.filter((u) => u.status === "inactive").length;

    return [
      { id: "total", type: "team", title: "Total de personal", color: "blue", value: String(personal.length), description: "En todas las sucursales" },
      { id: "duenos", type: "team", title: "Dueños", color: "purple", value: String(duenos), description: "Cuentas de dueño" },
      { id: "managers", type: "team", title: "Gerentes de sucursal", color: "orange", value: String(managers), description: "Con sucursal asignada" },
      { id: "operational", type: "team", title: "Personal operativo", color: "green", value: String(operational), description: "Subgerentes, ventas y laboratorio" },
      { id: "inactive", type: "team", title: "Inactivos", color: "red", value: String(inactive), description: "Dados de baja" },
    ];
  }, [personal]);

  const loading = loadingUsers || loadingBranches;
  const error = errorUsers || errorBranches;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  // En la Bitacora, las acciones del Super usuario se registran con la
  // etiqueta generica del rol, no con el nombre propio de quien tenga la
  // sesion abierta.
  const actor = { name: "Super usuario", role: currentUser?.role, branchName: null };

  const handleCreate = async (payload) => {
    await createPersonal(payload, actor);
  };

  const handleEdit = async (payload) => {
    await updatePersonal(editingUser.id, payload, actor);
  };

  const handleResetPassword = async (user) => {
    await resetPersonalPassword(user.id, actor);
  };

  return (

    <PageContainer
      title="Personal"
      description="Administra al personal de todas las sucursales de Indigo, incluidos gerentes y dueños."
      actions={
        <Button className="inline-flex items-center gap-2 py-2.5 text-sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo personal
        </Button>
      }
    >

      <div className="flex items-start gap-6">

        <div className="min-w-0 flex-1 space-y-6 transition-all duration-300 ease-in-out">

          <KpiRow items={kpis} columns={5} />

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
              options={SUPERUSER_PERSONAL_ROLES}
            />
            <SelectFilter
              label="Sucursal"
              value={branch}
              onChange={setBranch}
              placeholder="Todas las sucursales"
              options={branchOptions}
            />
            <SelectFilter
              label="Estado"
              value={status}
              onChange={setStatus}
              placeholder="Todos los estados"
              options={[{ value: "active", label: "Activo" }, { value: "inactive", label: "Inactivo" }]}
            />
          </FilterBar>

          <PersonalTable
            users={filtered}
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
            canDeactivate
            allowDeactivateAll
            canResetPassword
            onDeactivate={(user) => setConfirmAction({ type: "deactivate", user })}
            onActivate={(user) => setConfirmAction({ type: "activate", user })}
            onResetPassword={(user) => setResettingUser(user)}
          />
        </SidePanel>

      </div>

      <PersonalFormModal
        open={createOpen}
        branches={branches}
        existingUsers={users}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <EditPersonalModal
        key={editingUser?.id ?? "none"}
        open={Boolean(editingUser)}
        user={editingUser}
        branches={branches}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEdit}
      />

      <ResetPasswordModal
        open={Boolean(resettingUser)}
        user={resettingUser}
        onClose={() => setResettingUser(null)}
        onConfirm={handleResetPassword}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.type === "activate" ? "Dar de alta cuenta" : "Dar de baja cuenta"}
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
            ? activatePersonal(confirmAction.user.id, actor)
            : deactivatePersonal(confirmAction.user.id, actor)
        }
        onClose={() => setConfirmAction(null)}
      />

    </PageContainer>
  );
}
