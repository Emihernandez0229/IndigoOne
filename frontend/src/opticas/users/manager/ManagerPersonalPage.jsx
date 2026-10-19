import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import PageContainer from "../../../shared/layouts/PageContainer";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import ErrorState from "../../../shared/components/ErrorState";
import ConfirmDialog from "../../../shared/components/ConfirmDialog";
import SidePanel from "../../../shared/components/SidePanel";
import { useAuth } from "../../../shared/context/AuthContext";

import useUsers from "../hooks/useUsers";
import useBranches from "../../branches/hooks/useBranches";
import { MANAGER_PERSONAL_ROLES } from "../constants";
import UserDetailPanel from "../components/UserDetailPanel";
import PersonnelFormModal from "../components/PersonnelFormModal";
import EditPersonnelModal from "../components/EditPersonnelModal";
import PersonalCard from "./components/PersonalCard";


/**
 * "Personal" para el Jefe de sucursal (Encargado) de Óptica - no es un
 * CRUD de tabla, es una vista de tarjetas por integrante del equipo de su
 * propia sucursal. Alta y edición usan los mismos PersonnelFormModal /
 * EditPersonnelModal del Dueño, pero con la sucursal bloqueada a la suya y
 * el puesto limitado a personal operativo (Ventas) - igual que el
 * "Empleados" de Gerente de sucursal en Indigo.
 */
export default function ManagerPersonalPage() {

  const { user: currentUser } = useAuth();
  const { users, loading: loadingUsers, error: errorUsers, create, update, deactivate, activate } = useUsers();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();

  const [viewingUserId, setViewingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  const team = useMemo(
    () => users.filter((u) => u.branchId === myBranch?.id),
    [users, myBranch]
  );

  const viewingUser = team.find((u) => u.id === viewingUserId) ?? null;

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
      description="Administra los accesos de tu equipo."
    >

      <div className="flex items-start gap-6">

        <div className="min-w-0 flex-1 space-y-4 transition-all duration-300 ease-in-out">

          <p className="text-sm text-text-secondary">
            {team.length} {team.length === 1 ? "empleado registrado" : "empleados registrados"}
          </p>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

            {team.map((user) => (
              <PersonalCard
                key={user.id}
                user={user}
                branchName={myBranch?.name}
                onView={() => setViewingUserId(user.id)}
                onEdit={() => setEditingUser(user)}
                onDeactivate={() => setConfirmAction({ type: "deactivate", user })}
                onActivate={() => setConfirmAction({ type: "activate", user })}
              />
            ))}

            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center transition hover:border-indigo-primary"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-light text-indigo-primary">
                <Plus className="h-6 w-6" />
              </span>
              <span className="font-semibold text-text-primary">Agregar empleado</span>
            </button>

          </div>

        </div>

        <SidePanel
          isOpen={Boolean(viewingUser)}
          onClose={() => setViewingUserId(null)}
          title="Detalle de personal"
        >
          <UserDetailPanel
            user={viewingUser}
            branch={myBranch}
            canDeactivate
            onDeactivate={(user) => setConfirmAction({ type: "deactivate", user })}
            onActivate={(user) => setConfirmAction({ type: "activate", user })}
          />
        </SidePanel>

      </div>

      <PersonnelFormModal
        open={createOpen}
        branch={myBranch}
        existingUsers={users}
        roleOptions={MANAGER_PERSONAL_ROLES}
        title="Nuevo personal"
        submitLabel="Crear personal"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <EditPersonnelModal
        key={editingUser?.id ?? "none"}
        open={Boolean(editingUser)}
        user={editingUser}
        branch={myBranch}
        roleOptions={MANAGER_PERSONAL_ROLES}
        title="Editar personal"
        onClose={() => setEditingUser(null)}
        onSubmit={handleEdit}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.type === "activate" ? "Dar de alta personal" : "Dar de baja personal"}
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
