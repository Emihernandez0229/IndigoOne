import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import SearchInput from "../../shared/components/SearchInput";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import EmptyState from "../../shared/components/EmptyState";
import useBranchScope from "../../shared/hooks/useBranchScope";
import { ROLES } from "../../shared/security/roles";

import { listBranches } from "../branches/services/branchService";
import usePatients from "../pacientes/hooks/usePatients";
import useLaboratorio from "./hooks/useLaboratorio";
import { filterLaboratorio } from "./filterLaboratorio";
import { LAB_STATUSES } from "./constants";
import LaboratorioTable from "./components/LaboratorioTable";


export default function LaboratorioPage() {

  const navigate = useNavigate();

  const { isOwner, branches, selectedBranch, setSelectedBranch, loadingBranches } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
  });

  const { patients } = usePatients(selectedBranch);
  const { orders, loading, error } = useLaboratorio(selectedBranch);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");


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
    () => filterLaboratorio(ordersWithPatient, { query, status, date }),
    [ordersWithPatient, query, status, date]
  );

  const kpis = useMemo(() => [
    {
      id: "total", type: "laboratory", title: "Total",
      value: String(orders.length), description: "Órdenes registradas",
    },
    {
      id: "pendiente", type: "scheduled", title: "Pendientes",
      value: String(orders.filter((o) => o.status === "pendiente").length),
      description: "Por iniciar",
    },
    {
      id: "en_proceso", type: "confirmed", title: "En proceso",
      value: String(orders.filter((o) => o.status === "en_proceso").length),
      description: "En laboratorio",
    },
    {
      id: "listo", type: "available", title: "Listas",
      value: String(orders.filter((o) => o.status === "listo").length),
      description: "Para entregar",
    },
  ], [orders]);


  if (loadingBranches) return <LoadingSpinner />;

  return (

    <PageContainer
      title="Laboratorio"
      description="Órdenes de laboratorio generadas desde tus ventas."
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
            options={LAB_STATUSES}
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
            description="Elige una sucursal para ver sus órdenes de laboratorio."
          />
        ) : loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState />
        ) : (
          <LaboratorioTable
            orders={filtered}
            onView={(order) => navigate(`/opticas/laboratorio/${order.id}`)}
          />
        )}

      </div>

    </PageContainer>

  );

}
