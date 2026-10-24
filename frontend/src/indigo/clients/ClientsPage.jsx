import { useMemo, useState } from "react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import SearchInput from "../../shared/components/SearchInput";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import SidePanel from "../../shared/components/SidePanel";

import useClients from "./hooks/useClients";
import useBranches from "../branches/hooks/useBranches";
import { filterClients } from "./filterClients";
import { CLIENT_STATUSES } from "./constants";
import ClientTable from "./components/ClientTable";
import ClientDetailPanel from "./components/ClientDetailPanel";


export default function ClientsPage() {

  const { clients, loading, error } = useClients();
  const { branches } = useBranches();

  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("");
  const [status, setStatus] = useState("");
  const [viewingClientId, setViewingClientId] = useState(null);

  const viewingClient = clients.find((client) => client.id === viewingClientId) ?? null;

  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.name })),
    [branches]
  );

  const filtered = useMemo(
    () => filterClients(clients, { query, branch, status }),
    [clients, query, branch, status]
  );

  const kpis = useMemo(() => {
    const active = clients.filter((c) => c.status === "active").length;
    const inactive = clients.filter((c) => c.status === "inactive").length;

    return [
      {
        id: "total", type: "customers", title: "Total de clientes registrados", color: "blue",
        value: String(clients.length), description: "En todas las sucursales",
      },
      {
        id: "active", type: "available", title: "Clientes activos", color: "green",
        value: String(active), description: "Con relación comercial vigente",
      },
      {
        id: "inactive", type: "canceled", title: "Clientes inactivos", color: "red",
        value: String(inactive), description: "Sin movimiento actual",
      },
      {
        id: "branches", type: "branches", title: "Total de sucursales", color: "purple",
        value: String(branches.length), description: "De Indigo",
      },
    ];
  }, [clients, branches]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer
      title="Clientes"
      description="Consulta los clientes de Indigo por sucursal o de manera general."
    >

      <div className="flex items-start gap-6">

        <div className="min-w-0 flex-1 space-y-6 transition-all duration-300 ease-in-out">

          <KpiRow items={kpis} />

          <FilterBar>
            <SearchInput
              className="w-full sm:max-w-xs"
              value={query}
              onChange={setQuery}
              placeholder="Buscar por nombre, código o razón social"
            />
            <SelectFilter
              label="Sucursal"
              value={branch}
              onChange={setBranch}
              placeholder="Todas las sucursales"
              options={branchOptions}
            />
            <SelectFilter
              label="Estado"
              value={status}
              onChange={setStatus}
              placeholder="Todos los estados"
              options={CLIENT_STATUSES}
            />
          </FilterBar>

          <ClientTable
            clients={filtered}
            onView={(client) => setViewingClientId(client.id)}
          />

        </div>

        <SidePanel
          isOpen={Boolean(viewingClient)}
          onClose={() => setViewingClientId(null)}
          title="Detalle de cliente"
        >
          <ClientDetailPanel client={viewingClient} />
        </SidePanel>

      </div>

    </PageContainer>
  );
}
