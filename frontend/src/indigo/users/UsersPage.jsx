import { useMemo, useState } from "react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import SearchInput from "../../shared/components/SearchInput";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import SidePanel from "../../shared/components/SidePanel";
import usePermissions from "../../shared/hooks/usePermissions";
import { ROLES } from "../../shared/security/roles";

import useUsers from "./hooks/useUsers";
import useBranches from "../branches/hooks/useBranches";
import { filterUsers } from "./filterUsers";
import UserTable from "./components/UserTable";
import UserDetailPanel from "./components/UserDetailPanel";
import { INDIGO_PERSONAL_ROLES } from "./constants";


export default function UsersPage() {

  const { can } = usePermissions();
  const { users: allUsers, loading, error, deactivate, activate } = useUsers();
  const { branches } = useBranches();

  const [confirmAction, setConfirmAction] = useState(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [branch, setBranch] = useState("");
  const [viewingUserId, setViewingUserId] = useState(null);

  const personalUsers = useMemo(
    () => allUsers.filter(
      (user) => user.role !== ROLES.INDIGO_SUPER_USUARIO && user.role !== ROLES.INDIGO_DUENO
    ),
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
    const managers = personalUsers.filter((u) => u.role === ROLES.INDIGO_GERENTE_SUCURSAL).length;
    const operational = personalUsers.filter(
      (u) =>
        u.role === ROLES.INDIGO_SUBGERENTE ||
        u.role === ROLES.INDIGO_EMPLEADO_VENTAS ||
        u.role === ROLES.INDIGO_EMPLEADO_LABORATORIO
    ).length;
    const inactive = personalUsers.filter((u) => u.status === "inactive").length;

    return [
      {
        id: "total", type: "team", title: "Total de personal",
        value: String(personalUsers.length), description: "En todas las sucursales",
      },
      {
        id: "managers", type: "team", title: "Gerentes de sucursal", color: "blue",
        value: String(managers), description: "Con sucursal asignada",
      },
      {
        id: "operational", type: "team", title: "Personal operativo", color: "green",
        value: String(operational), description: "Subgerentes, ventas y laboratorio",
      },
      {
        id: "inactive", type: "team", title: "Inactivos", color: "purple",
        value: String(inactive), description: "Dados de baja",
      },
    ];
  }, [personalUsers]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer
      title="Personal"
      description="Consulta al personal que pertenece a las sucursales de Indigo."
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
              options={INDIGO_PERSONAL_ROLES}
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
            canDeactivate={can("user.deactivate")}
            onView={(user) => setViewingUserId(user.id)}
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
            canDeactivate={can("user.deactivate")}
            onDeactivate={(user) => setConfirmAction({ type: "deactivate", user })}
            onActivate={(user) => setConfirmAction({ type: "activate", user })}
          />
        </SidePanel>

      </div>

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
