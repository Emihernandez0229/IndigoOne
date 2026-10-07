import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import Can from "../../shared/security/Can";
import usePermissions from "../../shared/hooks/usePermissions";
import useBranchScope from "../../shared/hooks/useBranchScope";
import { ROLES } from "../../shared/security/roles";

import { listBranches } from "../branches/services/branchService";
import usePatients from "./hooks/usePatients";
import { filterPatients } from "./filterPatients";
import PatientTable from "./components/PatientTable";
import PatientFormModal from "./components/PatientFormModal";


export default function PacientesPage() {

  const navigate = useNavigate();
  const { can } = usePermissions();

  const { isOwner, branches, selectedBranch, setSelectedBranch, loadingBranches } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
  });

  const {
    patients,
    loading,
    error,
    create,
    update,
    deactivate,
    activate,
  } = usePatients(selectedBranch);

  const [query, setQuery] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", patient: null });
  const [patientToDeactivate, setPatientToDeactivate] = useState(null);


  const filtered = useMemo(
    () => filterPatients(patients, { query }),
    [patients, query]
  );

  const kpis = useMemo(() => {
    const now = new Date();
    const newThisMonth = patients.filter((p) => {
      if (!p.createdAt) return false;
      const created = new Date(p.createdAt);
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    });

    return [
      {
        id: "total", type: "patients", title: "Total de pacientes",
        value: String(patients.length), description: "Registrados",
      },
      {
        id: "new", type: "confirmed", title: "Nuevos este mes",
        value: String(newThisMonth.length), description: "Registrados en el mes actual",
      },
      {
        id: "active", type: "available", title: "Activos",
        value: String(patients.filter((p) => p.active).length), description: "Vigentes",
      },
    ];
  }, [patients]);


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
      title="Pacientes"
      description="Pacientes registrados en tu alcance."
      actions={
        <Can permission="optica.patient.create">
          <Button
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => setModal({ open: true, mode: "create", patient: null })}
            disabled={!selectedBranch}
          >
            <Plus className="h-4 w-4" />
            Nuevo paciente
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
            placeholder="Buscar por nombre o teléfono"
          />

          {isOwner && (
            <SelectFilter
              label="Sucursal"
              value={selectedBranch}
              onChange={setSelectedBranch}
              placeholder="Selecciona una sucursal"
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          )}
        </FilterBar>

        {!selectedBranch ? (
          <EmptyState
            title="Selecciona una sucursal"
            description="Elige una sucursal para ver sus pacientes."
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
            onView={(patient) => navigate(`/opticas/pacientes/${patient.id}`)}
            onEdit={(patient) => setModal({ open: true, mode: "edit", patient })}
            onDeactivate={(patient) => setPatientToDeactivate(patient)}
            onActivate={(patient) => activate(patient.id)}
          />
        )}

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
        open={Boolean(patientToDeactivate)}
        title="Dar de baja paciente"
        description={
          patientToDeactivate &&
          `¿Seguro que quieres dar de baja a "${patientToDeactivate.name}"? Podrás volver a activarlo después.`
        }
        confirmLabel="Dar de baja"
        variant="danger"
        onConfirm={() => deactivate(patientToDeactivate.id)}
        onClose={() => setPatientToDeactivate(null)}
      />

    </PageContainer>

  );

}
