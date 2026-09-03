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
import Can from "../../shared/security/Can";
import usePermissions from "../../shared/hooks/usePermissions";
import { ROLES } from "../../shared/security/roles";

import useUsers from "./hooks/useUsers";
import { filterUsers } from "./filterUsers";
import UserTable from "./components/UserTable";
import UserFormModal from "./components/UserFormModal";
import { INDIGO_USER_ROLES } from "./constants";


export default function UsersPage() {

  const { can } = usePermissions();
  const { users, loading, error, create, update, deactivate } = useUsers();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [branch, setBranch] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", user: null });


  // Sucursales visibles, derivadas de los usuarios en alcance.
  const branchOptions = useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      if (u.branchId != null && !map.has(u.branchId)) {
        map.set(u.branchId, { value: u.branchId, label: u.branchName });
      }
    });
    return [...map.values()];
  }, [users]);


  const filtered = useMemo(
    () => filterUsers(users, { query, role, branch }),
    [users, query, role, branch]
  );


  const kpis = useMemo(() => [
    {
      id: "total", type: "team", title: "Total de usuarios",
      value: String(users.length), description: "En tu alcance",
    },
    {
      id: "managers", type: "team", title: "Jefes de sucursal",
      value: String(users.filter((u) => u.role === ROLES.INDIGO_BRANCH_MANAGER).length),
      description: "Con sucursal a cargo",
    },
    {
      id: "staff", type: "team", title: "Personal de sucursal",
      value: String(users.filter(
        (u) => u.role === ROLES.INDIGO_SALES || u.role === ROLES.INDIGO_LAB
      ).length),
      description: "Ventas y laboratorio",
    },
    {
      id: "inactive", type: "team", title: "Inactivos",
      value: String(users.filter((u) => u.status === "inactive").length),
      description: "Dados de baja",
    },
  ], [users]);


  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleSubmit = async (payload) => {
    if (modal.mode === "edit" && modal.user) {
      await update(modal.user.id, payload);
    } else {
      await create(payload);
    }
  };


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;


  return (

    <PageContainer
      title="Usuarios"
      description="Gestión de los usuarios de Indigo."
      actions={
        <Can permission="user.create">
          <Button
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => setModal({ open: true, mode: "create", user: null })}
          >
            <Plus className="h-4 w-4" />
            Nuevo usuario
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
            placeholder="Buscar por nombre o sucursal"
          />
          <SelectFilter
            label="Rol"
            value={role}
            onChange={setRole}
            placeholder="Todos los roles"
            options={INDIGO_USER_ROLES}
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
          canEdit={can("user.update")}
          canDeactivate={can("user.deactivate")}
          onEdit={(u) => setModal({ open: true, mode: "edit", user: u })}
          onDeactivate={(u) => deactivate(u.id)}
        />

      </div>

      <UserFormModal
        key={`${modal.mode}-${modal.user?.id ?? "new"}-${modal.open}`}
        open={modal.open}
        mode={modal.mode}
        user={modal.user}
        branchOptions={branchOptions}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

    </PageContainer>

  );

}
