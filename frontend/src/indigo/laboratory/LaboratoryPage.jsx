import { useMemo, useState } from "react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import SearchInput from "../../shared/components/SearchInput";
import Input from "../../shared/components/Input";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import SidePanel from "../../shared/components/SidePanel";
import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import useLaboratoryJobs from "./hooks/useLaboratoryJobs";
import useBranches from "../branches/hooks/useBranches";
import { filterLaboratoryJobs } from "./filterLaboratoryJobs";
import { LAB_STATUSES, SERVICE_TYPES, PERIODS } from "./constants";
import LaboratoryTable from "./components/LaboratoryTable";
import LaboratoryDetailPanel from "./components/LaboratoryDetailPanel";


const BRANCH_SCOPED_ROLES = [ROLES.INDIGO_GERENTE_SUCURSAL, ROLES.INDIGO_SUBGERENTE, ROLES.INDIGO_EMPLEADO_VENTAS, ROLES.INDIGO_EMPLEADO_LABORATORIO];


export default function LaboratoryPage() {

  const { user: currentUser } = useAuth();
  const { jobs, loading, error } = useLaboratoryJobs();
  const { branches } = useBranches();

  const isBranchScoped = BRANCH_SCOPED_ROLES.includes(currentUser?.role);

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  // Gerente/Subgerente solo consultan los trabajos de su propia sucursal,
  // nunca de otras - el Dueño/Super usuario siguen viendo todo.
  const scopedJobs = useMemo(
    () => (isBranchScoped ? jobs.filter((j) => j.branchId === myBranch?.id) : jobs),
    [jobs, isBranchScoped, myBranch]
  );

  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("");
  const [status, setStatus] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [period, setPeriod] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [viewingJobId, setViewingJobId] = useState(null);

  const viewingJob = scopedJobs.find((job) => job.id === viewingJobId) ?? null;

  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.name })),
    [branches]
  );

  const filtered = useMemo(
    () => filterLaboratoryJobs(scopedJobs, { query, branch, status, serviceType, period, customFrom, customTo }),
    [scopedJobs, query, branch, status, serviceType, period, customFrom, customTo]
  );

  const kpis = useMemo(() => {
    const count = (s) => scopedJobs.filter((j) => j.status === s).length;

    return [
      { id: "total", type: "orders", title: "Total de trabajos", color: "blue", value: String(scopedJobs.length), description: isBranchScoped ? "En tu sucursal" : "En todas las sucursales" },
      { id: "pending", type: "pendingClock", title: "Pendientes", color: "orange", value: String(count("pending")), description: "Por aceptar" },
      { id: "processing", type: "processingGear", title: "En proceso", color: "purple", value: String(count("processing")), description: "En laboratorio" },
      { id: "completed", type: "confirmed", title: "Terminados", color: "green", value: String(count("completed")), description: "Listos" },
      { id: "loss", type: "lowStock", title: "Mermas / Pérdidas", color: "red", value: String(count("loss")), description: "Con incidencia" },
      { id: "warranty", type: "warranty", title: "Garantías", color: "purple", value: String(count("warranty")), description: "En garantía" },
    ];
  }, [scopedJobs, isBranchScoped]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer
      title="Laboratorio"
      description={
        isBranchScoped
          ? "Consulta el estado de los trabajos de laboratorio de tu sucursal."
          : "Consulta el estado de los trabajos de laboratorio en todas las sucursales."
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
              placeholder="Buscar por folio, cliente, sucursal..."
            />
            {!isBranchScoped && (
              <SelectFilter
                label="Sucursal"
                value={branch}
                onChange={setBranch}
                placeholder="Todas las sucursales"
                options={branchOptions}
              />
            )}
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
            <SelectFilter
              label="Periodo"
              value={period}
              onChange={setPeriod}
              placeholder="Todo el tiempo"
              options={PERIODS}
            />
            {period === "custom" && (
              <>
                <Input type="date" label="Desde" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                <Input type="date" label="Hasta" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </>
            )}
          </FilterBar>

          <LaboratoryTable
            jobs={filtered}
            onView={(job) => setViewingJobId(job.id)}
          />

        </div>

        <SidePanel
          isOpen={Boolean(viewingJob)}
          onClose={() => setViewingJobId(null)}
          title="Detalle del trabajo"
        >
          <LaboratoryDetailPanel job={viewingJob} />
        </SidePanel>

      </div>

    </PageContainer>
  );
}
