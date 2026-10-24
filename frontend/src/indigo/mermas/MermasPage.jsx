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
import { ROLES } from "../../shared/security/roles";

import useMermas from "./hooks/useMermas";
import useBranches from "../branches/hooks/useBranches";
import useLaboratoryJobs from "../laboratory/hooks/useLaboratoryJobs";
import { filterMermas } from "./filterMermas";
import { SERVICE_TYPES, BISEL_TYPES } from "../laboratory/constants";
import MermaTable from "./components/MermaTable";
import MermaDetailPanel from "./components/MermaDetailPanel";


const BRANCH_SCOPED_ROLES = [ROLES.INDIGO_GERENTE_SUCURSAL, ROLES.INDIGO_SUBGERENTE, ROLES.INDIGO_EMPLEADO_VENTAS, ROLES.INDIGO_EMPLEADO_LABORATORIO];


export default function MermasPage() {

  const { user: currentUser } = useAuth();
  const { mermas, loading, error } = useMermas();
  const { jobs: allJobs } = useLaboratoryJobs();
  const { branches } = useBranches();

  const isBranchScoped = BRANCH_SCOPED_ROLES.includes(currentUser?.role);

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  const scopedMermas = useMemo(
    () => (isBranchScoped ? mermas.filter((m) => m.branchId === myBranch?.id) : mermas),
    [mermas, isBranchScoped, myBranch]
  );

  const scopedJobs = useMemo(
    () => (isBranchScoped ? allJobs.filter((j) => j.branchId === myBranch?.id) : allJobs),
    [allJobs, isBranchScoped, myBranch]
  );

  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("");
  const [biselType, setBiselType] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [viewingMermaId, setViewingMermaId] = useState(null);

  const viewingMerma = scopedMermas.find((m) => m.id === viewingMermaId) ?? null;

  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.name })),
    [branches]
  );

  const filtered = useMemo(
    () => filterMermas(scopedMermas, { query, branch, biselType, serviceType }),
    [scopedMermas, query, branch, biselType, serviceType]
  );

  const kpis = useMemo(() => {
    const now = new Date();
    const thisMonth = scopedMermas.filter((m) => {
      if (!m.lossAt) return false;
      const d = new Date(m.lossAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const piecesLost = scopedMermas.reduce((sum, m) => sum + (m.quantity || 0), 0);
    const rate = scopedJobs.length ? ((scopedMermas.length / scopedJobs.length) * 100).toFixed(1) : "0.0";
    const monthLabel = now.toLocaleDateString("es-MX", { month: "long", year: "numeric" });

    return [
      { id: "total", type: "lowStock", title: "Total de mermas", color: "red", value: String(scopedMermas.length), description: isBranchScoped ? "En tu sucursal" : "En todas las sucursales" },
      { id: "month", type: "appointments", title: "Mermas este mes", color: "purple", value: String(thisMonth), description: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1) },
      { id: "pieces", type: "products", title: "Piezas perdidas", color: "blue", value: String(piecesLost), description: "Lentes y armazones" },
      { id: "rate", type: "rate", title: "Tasa de merma", color: "orange", value: `${rate}%`, description: `De ${scopedJobs.length} trabajos` },
    ];
  }, [scopedMermas, scopedJobs, isBranchScoped]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer
      title="Mermas"
      description={
        isBranchScoped
          ? "Consulta las mermas registradas en tu sucursal."
          : "Consulta las mermas registradas en todas las sucursales de Indigo."
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
              placeholder="Buscar por folio, cliente o vendedor..."
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
              label="Tipo de bisel"
              value={biselType}
              onChange={setBiselType}
              placeholder="Todos"
              options={BISEL_TYPES}
            />
            <SelectFilter
              label="Servicio"
              value={serviceType}
              onChange={setServiceType}
              placeholder="Todos"
              options={SERVICE_TYPES}
            />
          </FilterBar>

          <MermaTable
            mermas={filtered}
            showBranchColumn={!isBranchScoped}
            onView={(merma) => setViewingMermaId(merma.id)}
          />

        </div>

        <SidePanel
          isOpen={Boolean(viewingMerma)}
          onClose={() => setViewingMermaId(null)}
          title="Detalle de merma"
        >
          <MermaDetailPanel merma={viewingMerma} />
        </SidePanel>

      </div>

    </PageContainer>
  );
}
