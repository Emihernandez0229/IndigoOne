import { useMemo, useState } from "react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import SearchInput from "../../shared/components/SearchInput";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import SidePanel from "../../shared/components/SidePanel";
import { useAuth } from "../../shared/context/AuthContext";
import usePermissions from "../../shared/hooks/usePermissions";

import useLaboratoryJobs from "../laboratory/hooks/useLaboratoryJobs";
import useBranches from "../branches/hooks/useBranches";
import { filterLaboratoryJobs } from "../laboratory/filterLaboratoryJobs";
import { LAB_STATUSES, PRIORITIES } from "../laboratory/constants";
import LabJobTable from "./components/LabJobTable";
import LabJobDetailPanel from "./components/LabJobDetailPanel";


export default function LabJobsPage() {

  const { user: currentUser } = useAuth();
  const { can } = usePermissions();
  const { jobs, loading: loadingJobs, error: errorJobs, accept, complete, registerLoss, addDetail } = useLaboratoryJobs();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  // Todos los trabajos de la sucursal (los registra Ventas), no solo los
  // propios - el de Laboratorio da seguimiento a toda la cola.
  const branchJobs = useMemo(
    () => jobs.filter((j) => j.branchId === myBranch?.id),
    [jobs, myBranch]
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [viewingJobId, setViewingJobId] = useState(null);

  const viewingJob = branchJobs.find((j) => j.id === viewingJobId) ?? null;

  const filtered = useMemo(
    () => filterLaboratoryJobs(branchJobs, { query, status, priority }),
    [branchJobs, query, status, priority]
  );

  const kpis = useMemo(() => {
    const count = (s) => branchJobs.filter((j) => j.status === s).length;

    return [
      { id: "total", type: "orders", title: "Total de trabajos", color: "blue", value: String(branchJobs.length), description: "En tu sucursal" },
      { id: "pending", type: "pendingClock", title: "Pendientes", color: "orange", value: String(count("pending")), description: "Por aceptar" },
      { id: "processing", type: "processingGear", title: "En proceso", color: "purple", value: String(count("processing")), description: "En laboratorio" },
      { id: "completed", type: "confirmed", title: "Terminados", color: "green", value: String(count("completed")), description: "Listos" },
      { id: "loss", type: "lowStock", title: "Mermas", color: "red", value: String(count("loss")), description: "Con incidencia" },
    ];
  }, [branchJobs]);

  const loading = loadingJobs || loadingBranches;
  const error = errorJobs || errorBranches;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  const employeeName = currentUser?.name;

  return (

    <PageContainer
      title="Trabajos"
      description="Trabajos registrados por Ventas en tu sucursal. Acéptalos, márcalos como terminados o registra una merma."
    >

      <div className="flex items-start gap-6">

        <div className="min-w-0 flex-1 space-y-6 transition-all duration-300 ease-in-out">

          <KpiRow items={kpis} dense />

          <FilterBar>
            <SearchInput
              className="w-full sm:max-w-xs"
              value={query}
              onChange={setQuery}
              placeholder="Buscar óptica o folio"
            />
            <SelectFilter
              label="Estado"
              value={status}
              onChange={setStatus}
              placeholder="Todos"
              options={LAB_STATUSES}
            />
            <SelectFilter
              label="Prioridad"
              value={priority}
              onChange={setPriority}
              placeholder="Todas"
              options={PRIORITIES}
            />
          </FilterBar>

          <LabJobTable jobs={filtered} onView={(job) => setViewingJobId(job.id)} />

        </div>

        <SidePanel
          isOpen={Boolean(viewingJob)}
          onClose={() => setViewingJobId(null)}
          title="Detalle del trabajo"
        >
          <LabJobDetailPanel
            job={viewingJob}
            canAccept={can("laboratory.job.accept")}
            canUpdate={can("laboratory.job.update")}
            onAccept={(job) => accept(job.id, employeeName)}
            onComplete={(job) => complete(job.id, employeeName)}
            onRegisterLoss={(job, reason) => registerLoss(job.id, employeeName, reason)}
            onAddDetail={(job, text) => addDetail(job.id, employeeName, text)}
          />
        </SidePanel>

      </div>

    </PageContainer>
  );
}
