import { useMemo, useState } from "react";
import {
  Building2, Pencil, MapPin, User, Phone, Home,
  Users, UserRound, Package, Clock, Settings, CheckCircle2, BarChart3,
} from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import StatusBadge from "../../shared/components/StatusBadge";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import EmptyState from "../../shared/components/EmptyState";
import Can from "../../shared/security/Can";
import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";
import { kpiColors } from "../../shared/constants/kpiColors";

import useBranches from "./hooks/useBranches";
import useUsers from "../users/hooks/useUsers";
import usePatients from "../pacientes/hooks/usePatients";
import useLaboratorio from "../laboratorio/hooks/useLaboratorio";
import MyBranchEditModal from "./components/MyBranchEditModal";
import { OpticaCardDecoration } from "../optica/components/OpticaCardParts";


function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-bold text-text-primary">
      <Icon className="h-4 w-4 text-indigo-primary" />
      {children}
    </h3>
  );
}


function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
      <div>
        <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
        <dd className="mt-0.5 text-sm font-semibold text-text-primary">{value || "—"}</dd>
      </div>
    </div>
  );
}


function MiniKpi({ icon: Icon, label, value, color }) {
  const palette = kpiColors[color] ?? kpiColors.blue;
  return (
    <div className="rounded-xl bg-background p-4">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${palette.bg}`}>
        <Icon className={`h-5 w-5 ${palette.text}`} />
      </div>
      <p className="text-xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  );
}


/**
 * "Mi sucursal" del Jefe de sucursal (Encargado) de Óptica - mismo patrón
 * que la de Indigo (Gerente de sucursal), con dos diferencias: no hay
 * segundo a cargo (Ópticas no tiene rol de subgerente) y el desglose de
 * personal por puesto (ventas/laboratorio) se reemplaza por un solo total
 * de "Personal operativo", ya que Ópticas no distingue esos puestos.
 */
export default function MyBranchPage() {

  const { user: currentUser } = useAuth();
  const { branches, loading: loadingBranches, error: errorBranches, updateContact } = useBranches();
  const { users, loading: loadingUsers, error: errorUsers } = useUsers();
  const { patients, loading: loadingPatients, error: errorPatients } = usePatients(currentUser?.sucursalId);
  const { orders, loading: loadingOrders, error: errorOrders } = useLaboratorio(currentUser?.sucursalId);

  const [editOpen, setEditOpen] = useState(false);

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  const staff = useMemo(
    () => users.filter((u) => u.branchId === myBranch?.id),
    [users, myBranch]
  );

  const loading = loadingBranches || loadingUsers || loadingPatients || loadingOrders;
  const error = errorBranches || errorUsers || errorPatients || errorOrders;

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
    await updateContact(myBranch.id, payload);
  };

  const operationalCount = staff.filter((u) => u.role === ROLES.OPTICA_EMPLEADO).length;

  const pending = orders.filter((o) => o.status === "pendiente").length;
  const processing = orders.filter((o) => o.status === "en_proceso").length;
  const completed = orders.filter((o) => o.status === "listo" || o.status === "entregado").length;

  return (

    <PageContainer
      title="Mi sucursal"
      description="Aquí puedes consultar la información y el estado actual de tu sucursal."
    >

      <div className="space-y-6">

        <div className="grid gap-6 lg:grid-cols-3">

          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-surface p-6 lg:col-span-2">
            <OpticaCardDecoration />
            <div className="relative">
              <StatusBadge status={myBranch.status} label={myBranch.status === "active" ? "Sucursal activa" : "Sucursal inactiva"} />
              <h2 className="mt-3 text-2xl font-bold text-text-primary">{myBranch.name}</h2>
              {myBranch.address && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                  <MapPin className="h-4 w-4" />
                  {myBranch.address}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-light bg-indigo-light/40 p-6">
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-light">
              <Building2 className="h-5 w-5 text-indigo-primary" />
            </div>
            <h3 className="text-sm font-bold text-text-primary">Resumen rápido</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Desde aquí puedes ver la información general de tu sucursal y el estado de sus principales áreas de operación.
            </p>
          </div>

        </div>

        <div className="grid gap-6 lg:grid-cols-2">

          <div className="rounded-2xl border border-gray-200 bg-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle icon={Building2}>Información general</SectionTitle>
              <Can permission="optica.branch.update">
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-text-secondary transition hover:bg-indigo-light hover:text-indigo-primary"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </Can>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Field icon={Building2} label="Nombre de la sucursal" value={myBranch.name} />
              <Field icon={Home} label="Dirección" value={myBranch.address} />
              <Field icon={Phone} label="Teléfono" value={myBranch.phone} />
              <Field icon={User} label="Responsable (Jefe de sucursal)" value={myBranch.manager ? `${myBranch.manager}${myBranch.managerPhone ? " · " + myBranch.managerPhone : ""}` : null} />
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-surface p-6">
            <div className="mb-4">
              <SectionTitle icon={Users}>Personal de la sucursal</SectionTitle>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <MiniKpi icon={Users} label="Total de empleados" color="green" value={staff.length} />
              <MiniKpi icon={UserRound} label="Personal operativo" color="blue" value={operationalCount} />
            </div>
          </div>

        </div>

        <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-surface p-6">
          <OpticaCardDecoration />
          <div className="relative mb-4">
            <SectionTitle icon={BarChart3}>Operación de la sucursal</SectionTitle>
          </div>
          <div className="relative grid grid-cols-2 gap-4 sm:grid-cols-5">
            <MiniKpi icon={UserRound} label="Clientes" color="green" value={patients.length} />
            <MiniKpi icon={Package} label="Productos" color="blue" value={myBranch.products ?? 0} />
            <MiniKpi icon={Clock} label="Trabajos pendientes" color="orange" value={pending} />
            <MiniKpi icon={Settings} label="Trabajos en proceso" color="purple" value={processing} />
            <MiniKpi icon={CheckCircle2} label="Trabajos terminados" color="green" value={completed} />
          </div>
        </div>

      </div>

      <MyBranchEditModal
        key={`edit-${myBranch.id}-${editOpen}`}
        open={editOpen}
        branch={myBranch}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSubmit}
      />

    </PageContainer>

  );

}
