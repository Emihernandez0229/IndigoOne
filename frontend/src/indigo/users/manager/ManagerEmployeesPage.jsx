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
import { getEmployeeRoleOptions } from "../constants";
import UserDetailPanel from "../components/UserDetailPanel";
import ManagerEmployeeTable from "./components/ManagerEmployeeTable";
import EmployeeFormModal from "./components/EmployeeFormModal";
import EditEmployeeModal from "./components/EditEmployeeModal";


export default function ManagerEmployeesPage() {

  const { user: currentUser } = useAuth();
  const { users, loading: loadingUsers, error: errorUsers, createEmployee, updateEmployee, deactivate, activate } = useUsers();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [viewingUserId, setViewingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  // El Subgerente no administra su propio puesto: sin opcion "Subgerente"
  // al crear, editar ni filtrar. El Gerente de sucursal conserva las 3.
  const roleOptions = useMemo(
    () => getEmployeeRoleOptions(currentUser?.role),
    [currentUser?.role]
  );

  // El roster de "Empleados" nunca incluye al Gerente de sucursal (ni a
  // quien esta viendo la pagina): el Gerente ve al Subgerente, pero el
  // Subgerente no se ve a si mismo ni al Gerente.
  const employees = useMemo(() => {
    return users.filter(
      (u) =>
        u.branchId === myBranch?.id &&
        u.role !== ROLES.INDIGO_GERENTE_SUCURSAL &&
        u.id !== currentUser?.id
    );
  }, [users, myBranch, currentUser?.id]);

  const viewingUser = employees.find((u) => u.id === viewingUserId) ?? null;

  const filtered = useMemo(
    () => filterUsers(employees, { query, role, status }),
    [employees, query, role, status]
  );

  const kpis = useMemo(() => {
    const sales = employees.filter((u) => u.role === ROLES.INDIGO_EMPLEADO_VENTAS).length;
    const lab = employees.filter((u) => u.role === ROLES.INDIGO_EMPLEADO_LABORATORIO).length;

    return [
      {
        id: "total", type: "team", title: "Total de personal en mi sucursal",
        value: String(employees.length), description: "Personal a tu cargo",
      },
      {
        id: "sales", type: "team", title: "Personal de ventas", color: "blue",
        value: String(sales), description: "Equipo de ventas",
      },
      {
        id: "lab", type: "team", title: "Personal de laboratorio", color: "pink",
        value: String(lab), description: "Equipo de laboratorio",
      },
    ];
  }, [employees]);

  const loading = loadingUsers || loadingBranches;
  const error = errorUsers || errorBranches;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  const handleCreate = async (payload) => {
    await createEmployee(payload);
  };

  const handleEdit = async (payload) => {
    await updateEmployee(editingUser.id, payload);
  };

  return (

    <PageContainer
      title="Empleados"
      description="Consulta y administra al personal de tu sucursal."
      actions={
        <Button className="inline-flex items-center gap-2 py-2.5 text-sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo empleado
        </Button>
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
              placeholder="Buscar por nombre o usuario"
            />
            <SelectFilter
              label="Rol"
              value={role}
              onChange={setRole}
              placeholder="Todos los roles"
              options={roleOptions}
            />
            <SelectFilter
              label="Estado"
              value={status}
              onChange={setStatus}
              placeholder="Todos los estados"
              options={[{ value: "active", label: "Activo" }, { value: "inactive", label: "Inactivo" }]}
            />
          </FilterBar>

          <ManagerEmployeeTable
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
          title="Detalle de empleado"
        >
          <UserDetailPanel
            user={viewingUser}
            branch={myBranch}
            canDeactivate
            allowDeactivateAll
            onDeactivate={(user) => setConfirmAction({ type: "deactivate", user })}
            onActivate={(user) => setConfirmAction({ type: "activate", user })}
          />
        </SidePanel>

      </div>

      <EmployeeFormModal
        open={createOpen}
        branch={myBranch}
        existingUsers={users}
        roleOptions={roleOptions}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <EditEmployeeModal
        key={editingUser?.id ?? "none"}
        open={Boolean(editingUser)}
        user={editingUser}
        branch={myBranch}
        roleOptions={roleOptions}
        onClose={() => setEditingUser(null)}
        onSubmit={handleEdit}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.type === "activate" ? "Dar de alta empleado" : "Dar de baja empleado"}
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
