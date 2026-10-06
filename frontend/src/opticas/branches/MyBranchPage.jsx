import { useMemo, useState } from "react";

import { Pencil } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import Button from "../../shared/components/Button";
import StatusBadge from "../../shared/components/StatusBadge";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import EmptyState from "../../shared/components/EmptyState";
import Can from "../../shared/security/Can";
import { useAuth } from "../../shared/context/AuthContext";

import useBranches from "./hooks/useBranches";
import BranchFormModal from "./components/BranchFormModal";


export default function MyBranchPage() {

  const { user: currentUser } = useAuth();
  const { branches, loading, error, update } = useBranches();

  const [editOpen, setEditOpen] = useState(false);

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  if (!myBranch) {
    return (
      <PageContainer title="Mi sucursal" description="">
        <EmptyState
          title="No tienes una sucursal asignada"
          description="Contacta al dueño de la óptica para que te asigne una."
        />
      </PageContainer>
    );
  }

  const handleSubmit = async (payload) => {
    await update(myBranch.id, payload);
  };


  return (

    <PageContainer
      title="Mi sucursal"
      description="Información de tu sucursal."
      actions={
        <Can permission="optica.branch.update">
          <Button
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </Can>
      }
    >

      <div className="rounded-2xl border border-gray-200 bg-surface p-6">

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">{myBranch.name}</h2>
          <StatusBadge status={myBranch.status} />
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
          <Field label="Dirección" value={myBranch.address} />
          <Field label="Teléfono" value={myBranch.phone} />
          <Field label="Responsable" value={myBranch.manager} />
          <Field label="Personal" value={myBranch.staff} />
          <Field label="Productos" value={myBranch.products} />
        </dl>

      </div>

      <BranchFormModal
        key={`edit-${myBranch.id}-${editOpen}`}
        open={editOpen}
        mode="edit"
        branch={myBranch}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSubmit}
      />

    </PageContainer>

  );

}


function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm text-text-primary">{value || "—"}</dd>
    </div>
  );
}
