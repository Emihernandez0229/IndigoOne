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
import Can from "../../shared/security/Can";
import usePermissions from "../../shared/hooks/usePermissions";
import useBranchScope from "../../shared/hooks/useBranchScope";
import { ROLES } from "../../shared/security/roles";

import { listBranches } from "../branches/services/branchService";
import usePatients from "../pacientes/hooks/usePatients";
import useCitas from "./hooks/useCitas";
import { filterCitas } from "./filterCitas";
import { CITA_STATUSES } from "./constants";
import CitaTable from "./components/CitaTable";
import CitaFormModal from "./components/CitaFormModal";


export default function CitasPage() {

  const navigate = useNavigate();
  const { can } = usePermissions();

  const { isOwner, branches, selectedBranch, setSelectedBranch, loadingBranches } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
  });

  const { patients } = usePatients(selectedBranch);
  const { citas, loading, error, create, update } = useCitas(selectedBranch);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", cita: null });


  const patientsById = useMemo(() => {
    const map = new Map();
    patients.forEach((patient) => map.set(patient.id, patient.name));
    return map;
  }, [patients]);

  const citasWithPatient = useMemo(
    () => citas.map((cita) => ({ ...cita, patientName: patientsById.get(cita.patientId) })),
    [citas, patientsById]
  );

  const filtered = useMemo(
    () => filterCitas(citasWithPatient, { query, status, date }),
    [citasWithPatient, query, status, date]
  );

  const kpis = useMemo(() => [
    {
      id: "total", type: "appointments", title: "Total",
      value: String(citas.length), description: "Citas registradas",
    },
    {
      id: "programada", type: "scheduled", title: "Programadas",
      value: String(citas.filter((c) => c.status === "programada").length),
      description: "Por confirmar",
    },
    {
      id: "confirmada", type: "confirmed", title: "Confirmadas",
      value: String(citas.filter((c) => c.status === "confirmada").length),
      description: "Listas para atender",
    },
    {
      id: "atendida", type: "available", title: "Atendidas",
      value: String(citas.filter((c) => c.status === "atendida").length),
      description: "Completadas",
    },
  ], [citas]);


  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleSubmit = async (payload) => {
    if (modal.mode === "edit" && modal.cita) {
      await update(modal.cita.id, payload);
    } else {
      const branchId = payload.branchId || selectedBranch;
      await create({ ...payload, branchId });
      if (isOwner && branchId !== selectedBranch) {
        setSelectedBranch(branchId);
      }
    }
  };


  if (loadingBranches) return <LoadingSpinner />;

  return (

    <PageContainer
      title="Citas"
      description="Citas agendadas en tu alcance."
      actions={
        <Can permission="optica.appointment.manage">
          <Button
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => setModal({ open: true, mode: "create", cita: null })}
            disabled={!selectedBranch}
          >
            <Plus className="h-4 w-4" />
            Nueva cita
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
            placeholder="Buscar por paciente"
          />
          <SelectFilter
            label="Estado"
            value={status}
            onChange={setStatus}
            placeholder="Todos los estados"
            options={CITA_STATUSES}
          />
          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-sm font-medium text-text-primary">
              Fecha
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
            />
          </div>
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
            description="Elige una sucursal para ver sus citas."
          />
        ) : loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState />
        ) : (
          <CitaTable
            citas={filtered}
            canEdit={can("optica.appointment.manage")}
            onView={(cita) => navigate(`/opticas/citas/${cita.id}`)}
            onEdit={(cita) => setModal({ open: true, mode: "edit", cita })}
          />
        )}

      </div>

      <CitaFormModal
        key={`${modal.mode}-${modal.cita?.id ?? "new"}-${modal.open}`}
        open={modal.open}
        mode={modal.mode}
        cita={modal.cita}
        patients={patients}
        defaultBranchId={selectedBranch}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

    </PageContainer>

  );

}
