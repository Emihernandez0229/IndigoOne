import { useMemo, useState } from "react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import SearchInput from "../../shared/components/SearchInput";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import Input from "../../shared/components/Input";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import EmptyState from "../../shared/components/EmptyState";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import SidePanel from "../../shared/components/SidePanel";
import usePermissions from "../../shared/hooks/usePermissions";
import useBranchScope from "../../shared/hooks/useBranchScope";
import { ROLES } from "../../shared/security/roles";

import { listBranches } from "../branches/services/branchService";
import usePatients from "../pacientes/hooks/usePatients";
import useLaboratorio from "./hooks/useLaboratorio";
import { filterLaboratorio } from "./filterLaboratorio";
import { LAB_STATUSES, PERIODS } from "./constants";
import LaboratorioTable from "./components/LaboratorioTable";
import LaboratorioDetailPanel from "./components/LaboratorioDetailPanel";


export default function LaboratorioPage() {

  const { can } = usePermissions();

  const { isOwner, branches, selectedBranch, setSelectedBranch, loadingBranches } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
  });

  const { patients } = usePatients(selectedBranch);
  const { orders, loading, error, changeStatus } = useLaboratorio(selectedBranch);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [viewingOrderId, setViewingOrderId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);


  const patientsById = useMemo(() => {
    const map = new Map();
    patients.forEach((patient) => map.set(patient.id, patient.name));
    return map;
  }, [patients]);

  const ordersWithPatient = useMemo(
    () => orders.map((order) => ({ ...order, patientName: patientsById.get(order.patientId) })),
    [orders, patientsById]
  );

  const filtered = useMemo(
    () => filterLaboratorio(ordersWithPatient, { query, status, period, customFrom, customTo }),
    [ordersWithPatient, query, status, period, customFrom, customTo]
  );

  const viewingOrder = ordersWithPatient.find((o) => o.id === viewingOrderId) ?? null;
  const viewingPatient = patients.find((p) => p.id === viewingOrder?.patientId) ?? null;

  const kpis = useMemo(() => [
    {
      id: "total", type: "laboratory", title: "Total de trabajos", color: "blue",
      value: String(orders.length), description: "Órdenes registradas",
    },
    {
      id: "pendiente", type: "scheduled", title: "Pendientes", color: "orange",
      value: String(orders.filter((o) => o.status === "pendiente").length),
      description: "Por iniciar",
    },
    {
      id: "en_proceso", type: "confirmed", title: "En proceso", color: "purple",
      value: String(orders.filter((o) => o.status === "en_proceso").length),
      description: "En laboratorio",
    },
    {
      id: "listo", type: "available", title: "Listos para entregar", color: "green",
      value: String(orders.filter((o) => o.status === "listo").length),
      description: "Para entregar",
    },
  ], [orders]);


  const handleChangeStatus = async () => {
    await changeStatus(viewingOrderId, pendingStatus.value);
    setPendingStatus(null);
  };


  if (loadingBranches) return <LoadingSpinner />;

  return (

    <PageContainer
      title="Laboratorio"
      description="Órdenes de laboratorio generadas desde tus ventas."
    >

      <div className="flex items-start gap-6">

        <div className="min-w-0 flex-1 space-y-6 transition-all duration-300 ease-in-out">

          <KpiRow items={kpis} />

          <FilterBar>
            <SearchInput
              className="w-full sm:max-w-xs"
              value={query}
              onChange={setQuery}
              placeholder="Buscar por paciente"
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
            <SelectFilter
              label="Estado"
              value={status}
              onChange={setStatus}
              placeholder="Todos los estados"
              options={LAB_STATUSES}
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

          {!selectedBranch ? (
            <EmptyState
              title="Selecciona una sucursal"
              description="Elige una sucursal para ver sus órdenes de laboratorio."
            />
          ) : loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorState />
          ) : (
            <LaboratorioTable
              orders={filtered}
              onView={(order) => setViewingOrderId(order.id)}
            />
          )}

        </div>

        <SidePanel
          isOpen={Boolean(viewingOrder)}
          onClose={() => setViewingOrderId(null)}
          title="Detalle de orden"
        >
          <LaboratorioDetailPanel
            order={viewingOrder}
            patient={viewingPatient}
            canManage={can("optica.lab.manage")}
            onChangeStatus={(transition) => setPendingStatus(transition)}
          />
        </SidePanel>

      </div>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        title={pendingStatus?.label}
        description={`¿Seguro que quieres marcar esta orden como "${pendingStatus?.label?.toLowerCase()}"?`}
        confirmLabel={pendingStatus?.label}
        variant={pendingStatus?.variant === "danger" ? "danger" : "primary"}
        onConfirm={handleChangeStatus}
        onClose={() => setPendingStatus(null)}
      />

    </PageContainer>

  );

}
