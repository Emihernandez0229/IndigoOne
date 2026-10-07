import { useEffect, useMemo, useState } from "react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import { useAuth } from "../../shared/context/AuthContext";
import useBranchScope from "../../shared/hooks/useBranchScope";
import { ROLES } from "../../shared/security/roles";

import { listBranches } from "../branches/services/branchService";
import { listInventory } from "../inventory/services/inventoryService";
import usePatients from "../pacientes/hooks/usePatients";
import useCitas from "../citas/hooks/useCitas";
import useVentas from "../ventas/hooks/useVentas";


const PERIODS = [
  { value: "day", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
];

const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

function withinPeriod(dateStr, period) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  if (period === "day") {
    return date.toDateString() === now.toDateString();
  }
  if (period === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return date >= start;
  }
  if (period === "month") {
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
  if (period === "year") {
    return date.getFullYear() === now.getFullYear();
  }
  return true;
}


export default function ReportesPage() {

  const { user: currentUser } = useAuth();
  const isEmployee = currentUser?.role === ROLES.OPTICA_EMPLEADO;

  const { isOwner, branches, selectedBranch, setSelectedBranch, loadingBranches } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
  });
  const [period, setPeriod] = useState("month");

  const { ventas, loading: loadingVentas } = useVentas(selectedBranch);
  const { patients, loading: loadingPatients } = usePatients(selectedBranch);
  const { citas, loading: loadingCitas } = useCitas(selectedBranch);

  const [inventory, setInventory] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(true);

  useEffect(() => {
    if (!selectedBranch) {
      setInventory([]);
      setLoadingInventory(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        setLoadingInventory(true);
        const data = await listInventory();
        if (!active) return;
        setInventory((Array.isArray(data) ? data : []).filter((i) => i.branchId === selectedBranch));
      } catch (error) {
        console.error("Error al cargar inventario:", error);
      } finally {
        if (active) setLoadingInventory(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedBranch]);


  const ventasEmpleado = useMemo(
    () => ventas.filter((v) => v.createdBy === currentUser?.id),
    [ventas, currentUser?.id]
  );

  const ventasEnPeriodo = useMemo(
    () => (isEmployee ? ventasEmpleado : ventas).filter((v) => withinPeriod(v.createdAt, period)),
    [ventas, ventasEmpleado, isEmployee, period]
  );

  const ventasCompletadas = ventasEnPeriodo.filter((v) => v.status === "completada");
  const totalVentas = ventasCompletadas.reduce((sum, v) => sum + v.total, 0);
  const ticketPromedio = ventasCompletadas.length > 0 ? totalVentas / ventasCompletadas.length : 0;

  const salesKpis = [
    { id: "total", type: "sales", title: "Ventas totales", value: currency(totalVentas), description: "En el período" },
    { id: "count", type: "orders", title: "Transacciones", value: String(ventasCompletadas.length), description: "Completadas" },
    { id: "avg", type: "revenue", title: "Ticket promedio", value: currency(ticketPromedio), description: "Por venta" },
  ];

  const citasEnPeriodo = useMemo(
    () => citas.filter((c) => withinPeriod(c.createdAt, period)),
    [citas, period]
  );

  const citasKpis = [
    { id: "total", type: "appointments", title: "Citas", value: String(citasEnPeriodo.length), description: "En el período" },
    { id: "attended", type: "available", title: "Atendidas", value: String(citasEnPeriodo.filter((c) => c.status === "atendida").length), description: "Completadas" },
    { id: "cancelled", type: "canceled", title: "Canceladas", value: String(citasEnPeriodo.filter((c) => c.status === "cancelada" || c.status === "no_asistio").length), description: "No concretadas" },
  ];

  const clientesEnPeriodo = useMemo(
    () => patients.filter((p) => withinPeriod(p.createdAt, period)),
    [patients, period]
  );

  const clientesKpis = [
    { id: "total", type: "patients", title: "Total de clientes", value: String(patients.length), description: "En tu alcance" },
    { id: "new", type: "confirmed", title: "Nuevos", value: String(clientesEnPeriodo.length), description: "En el período" },
  ];

  const lowStock = inventory.filter((i) => i.active && i.stockAvailable > 0 && i.stockAvailable <= i.stockMin);
  const outOfStock = inventory.filter((i) => i.active && i.stockAvailable === 0);

  const inventoryKpis = [
    { id: "total", type: "products", title: "Existencias", value: String(inventory.reduce((sum, i) => sum + (i.stockAvailable || 0), 0)), description: "Unidades disponibles" },
    { id: "low", type: "lowStock", title: "Stock bajo", value: String(lowStock.length), description: "Productos por reabastecer" },
    { id: "out", type: "outOfStock", title: "Agotados", value: String(outOfStock.length), description: "Sin unidades" },
  ];


  if (loadingBranches) return <LoadingSpinner />;

  const loading = loadingVentas || loadingPatients || loadingCitas || loadingInventory;

  return (

    <PageContainer
      title="Reportes"
      description={isEmployee ? "Resumen de tus ventas." : "Qué ocurrió y cómo se comportó tu óptica."}
    >

      <div className="space-y-8">

        <FilterBar>
          <SelectFilter
            label="Período"
            value={period}
            onChange={setPeriod}
            options={PERIODS}
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
          <p className="text-sm text-text-secondary">Selecciona una sucursal para ver sus reportes.</p>
        ) : loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <section>
              <h2 className="mb-3 font-semibold text-text-primary">Ventas</h2>
              <KpiRow items={salesKpis} />
            </section>

            {!isEmployee && (
              <>
                <section>
                  <h2 className="mb-3 font-semibold text-text-primary">Citas</h2>
                  <KpiRow items={citasKpis} />
                </section>

                <section>
                  <h2 className="mb-3 font-semibold text-text-primary">Clientes</h2>
                  <KpiRow items={clientesKpis} />
                </section>

                <section>
                  <h2 className="mb-3 font-semibold text-text-primary">Inventario</h2>
                  <KpiRow items={inventoryKpis} />
                </section>
              </>
            )}
          </>
        )}

      </div>

    </PageContainer>

  );

}
