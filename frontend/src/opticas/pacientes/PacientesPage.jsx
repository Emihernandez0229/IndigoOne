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
import EmptyState from "../../shared/components/EmptyState";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import SidePanel from "../../shared/components/SidePanel";
import Can from "../../shared/security/Can";
import usePermissions from "../../shared/hooks/usePermissions";
import useBranchScope from "../../shared/hooks/useBranchScope";
import { ROLES } from "../../shared/security/roles";

import { listBranches } from "../branches/services/branchService";
import usePatients from "./hooks/usePatients";
import { filterPatients } from "./filterPatients";
import PatientTable from "./components/PatientTable";
import PatientFormModal from "./components/PatientFormModal";
import PatientDetailPanel from "./components/PatientDetailPanel";
import { PATIENT_STATUSES } from "./constants";


/**
 * "Clientes" (antes "Pacientes"). El Dueño ve a todos los clientes de la
 * óptica, de todas las sucursales a la vez - mismo patrón que la
 * "Clientes" de Indigo Dueño (KPIs con color, filtro de sucursal opcional,
 * detalle en SidePanel). El Encargado/Empleado siguen con su experiencia
 * de siempre: una sucursal a la vez, detalle en página aparte.
 */
export default function PacientesPage() {

  const { can } = usePermissions();

  const { isOwner, branches, selectedBranch, setSelectedBranch, loadingBranches } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
    autoSelectFirst: false,
  });

  const {
    patients,
    loading,
    error,
    create,
    update,
    deactivate,
    activate,
  } = usePatients(selectedBranch, { scopeToAll: isOwner });

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", patient: null });
  const [viewingPatientId, setViewingPatientId] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);


  const filtered = useMemo(
    () => filterPatients(patients, {
      query,
      branch: isOwner ? selectedBranch : "",
      status,
    }),
    [patients, query, selectedBranch, status, isOwner]
  );

  const viewingPatient = patients.find((p) => p.id === viewingPatientId) ?? null;

  const kpis = useMemo(() => {
    const active = patients.filter((p) => p.active).length;
    const inactive = patients.filter((p) => !p.active).length;

    const now = new Date();
    const newThisMonth = patients.filter((p) => {
      if (!p.createdAt) return false;
      const created = new Date(p.createdAt);
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    });

    return [
      {
        id: "total", type: "customers", title: "Total de clientes registrados", color: "blue",
        value: String(patients.length), description: isOwner ? "En todas las sucursales" : "De tu sucursal",
      },
      {
        id: "new", type: "confirmed", title: "Clientes nuevos este mes", color: "purple",
        value: String(newThisMonth.length), description: "Registrados en el mes actual",
      },
      {
        id: "active", type: "available", title: "Clientes activos", color: "green",
        value: String(active), description: "Con relación comercial vigente",
      },
      {
        id: "inactive", type: "canceled", title: "Clientes inactivos", color: "red",
        value: String(inactive), description: "Sin movimiento actual",
      },
    ];
  }, [patients, isOwner]);


  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleSubmit = async (payload) => {
    if (modal.mode === "edit" && modal.patient) {
      await update(modal.patient.id, payload);
    } else {
      await create({ ...payload, branchId: payload.branchId || selectedBranch });
    }
  };


  if (loadingBranches) return <LoadingSpinner />;

  return (

    <PageContainer
      title="Clientes"
      description={isOwner ? "Clientes registrados en todas las sucursales de la óptica." : "Clientes registrados en tu alcance."}
      actions={
        <Can permission="optica.patient.create">
          <Button
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => setModal({ open: true, mode: "create", patient: null })}
            disabled={!isOwner && !selectedBranch}
          >
            <Plus className="h-4 w-4" />
            Nuevo cliente
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
              placeholder="Buscar por nombre, teléfono o correo"
            />

            {isOwner && (
              <SelectFilter
                label="Sucursal"
                value={selectedBranch}
                onChange={setSelectedBranch}
                options={[{ value: "", label: "Todas las sucursales" }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
              />
            )}
            <SelectFilter
              label="Estado"
              value={status}
              onChange={setStatus}
              placeholder="Todos los estados"
              options={PATIENT_STATUSES}
            />
          </FilterBar>

          {!isOwner && !selectedBranch ? (
            <EmptyState
              title="Selecciona una sucursal"
              description="Elige una sucursal para ver sus clientes."
            />
          ) : loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorState />
          ) : (
            <PatientTable
              patients={filtered}
              canEdit={can("optica.patient.update")}
              canDeactivate={can("optica.patient.deactivate")}
              onView={(patient) => setViewingPatientId(patient.id)}
              onEdit={(patient) => setModal({ open: true, mode: "edit", patient })}
              onDeactivate={(patient) => setConfirmAction({ type: "deactivate", patient })}
              onActivate={(patient) => setConfirmAction({ type: "activate", patient })}
            />
          )}

        </div>

        <SidePanel
          isOpen={Boolean(viewingPatient)}
          onClose={() => setViewingPatientId(null)}
          title="Detalle de cliente"
        >
          <PatientDetailPanel patient={viewingPatient} />
        </SidePanel>

      </div>

      <PatientFormModal
        key={`${modal.mode}-${modal.patient?.id ?? "new"}-${modal.open}`}
        open={modal.open}
        mode={modal.mode}
        patient={modal.patient}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.type === "activate" ? "Dar de alta cliente" : "Dar de baja cliente"}
        description={
          confirmAction &&
          (confirmAction.type === "activate"
            ? `¿Seguro que quieres dar de alta a "${confirmAction.patient.name}"?`
            : `¿Seguro que quieres dar de baja a "${confirmAction.patient.name}"? Podrás volver a activarlo después.`)
        }
        confirmLabel={confirmAction?.type === "activate" ? "Dar de alta" : "Dar de baja"}
        variant={confirmAction?.type === "activate" ? "primary" : "danger"}
        onConfirm={() =>
          confirmAction.type === "activate"
            ? activate(confirmAction.patient.id)
            : deactivate(confirmAction.patient.id)
        }
        onClose={() => setConfirmAction(null)}
      />

    </PageContainer>

  );

}
