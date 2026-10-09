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
import SidePanel from "../../shared/components/SidePanel";
import { useAuth } from "../../shared/context/AuthContext";

import useLaboratoryJobs from "../laboratory/hooks/useLaboratoryJobs";
import LaboratoryDetailPanel from "../laboratory/components/LaboratoryDetailPanel";
import { filterLaboratoryJobs } from "../laboratory/filterLaboratoryJobs";
import { LAB_STATUSES, SERVICE_TYPES } from "../laboratory/constants";
import JobTable from "./components/JobTable";


export default function JobsPage() {

  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { jobs, loading, error } = useLaboratoryJobs();

  // Lo que el empleado registro el mismo - sin importar a quien se le dio
  // el credito de la venta (campo `seller`, puede ser otra persona).
  const myJobs = useMemo(
    () => jobs.filter((j) => j.registeredById === currentUser?.id),
    [jobs, currentUser?.id]
  );

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [viewingJobId, setViewingJobId] = useState(null);

  const viewingJob = myJobs.find((j) => j.id === viewingJobId) ?? null;

  const filtered = useMemo(
    () => filterLaboratoryJobs(myJobs, { query, status, serviceType }),
    [myJobs, query, status, serviceType]
  );

  const kpis = useMemo(() => {
    const count = (s) => myJobs.filter((j) => j.status === s).length;

    return [
      { id: "total", type: "orders", title: "Total de trabajos", color: "blue", value: String(myJobs.length), description: "Que has registrado" },
      { id: "pending", type: "pendingClock", title: "Pendiente", color: "orange", value: String(count("pending")), description: "Por aceptar" },
      { id: "processing", type: "processingGear", title: "En proceso", color: "purple", value: String(count("processing")), description: "En laboratorio" },
      { id: "completed", type: "confirmed", title: "Terminado", color: "green", value: String(count("completed")), description: "Listos" },
      { id: "loss", type: "lowStock", title: "Merma", color: "red", value: String(count("loss")), description: "Con incidencia" },
    ];
  }, [myJobs]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer
      title="Trabajos u órdenes"
      description="Trabajos que registraste para el laboratorio. El estado lo actualiza el personal de laboratorio."
      actions={
        <Button className="inline-flex items-center gap-2 py-2.5 text-sm" onClick={() => navigate("/indigo/trabajos/nuevo")}>
          <Plus className="h-4 w-4" />
          Nuevo trabajo
        </Button>
      }
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
              label="Tipo de servicio"
              value={serviceType}
              onChange={setServiceType}
              placeholder="Todos"
              options={SERVICE_TYPES}
            />
          </FilterBar>

          <JobTable jobs={filtered} onView={(job) => setViewingJobId(job.id)} />

          <p className="text-sm text-text-secondary">
            Solo lectura: aceptar, terminar y registrar merma corresponden al laboratorio.
          </p>

        </div>

        <SidePanel
          isOpen={Boolean(viewingJob)}
          onClose={() => setViewingJobId(null)}
          title="Seguimiento del trabajo"
        >
          <LaboratoryDetailPanel job={viewingJob} />
        </SidePanel>

      </div>

    </PageContainer>
  );
}
