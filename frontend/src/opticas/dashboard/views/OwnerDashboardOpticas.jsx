import { useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";

import DashboardLayout from "../../../shared/dashboard/DashboardLayout";
import DashboardGrid from "../../../shared/dashboard/DashboardGrid";

import ChartContainer from "../../../shared/charts/ChartContainer";
import BarChart from "../../../shared/charts/BarChart";
import { CHART_COLORS } from "../../../shared/charts/chartTheme";

import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import ErrorState from "../../../shared/components/ErrorState";
import PeriodToggle from "../../../shared/components/PeriodToggle";

import useBranches from "../../branches/hooks/useBranches";
import useVentas from "../../ventas/hooks/useVentas";
import useCitas from "../../citas/hooks/useCitas";
import usePatients from "../../pacientes/hooks/usePatients";
import useProductos from "../../catalogo/hooks/useProductos";

import TodayAgendaCalendar from "../components/TodayAgendaCalendar";
import RecentActivityFeed from "../components/RecentActivityFeed";
import CriticalStockTable from "../components/CriticalStockTable";

import { inDateRange, quickRangeDates, groupByBranch } from "../../reportes/salesReportUtils";
import { currency } from "../../../shared/utils/format";

const PERIODS = [
  { value: "day", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];
const PERIOD_DAYS = { day: 1, week: 7, month: 30 };

const BRANCH_CHART_COLORS = [
  CHART_COLORS.primary, CHART_COLORS.blue, CHART_COLORS.purple,
  CHART_COLORS.pink, CHART_COLORS.orange, CHART_COLORS.success,
  CHART_COLORS.warning, CHART_COLORS.secondary,
];


export default function OwnerDashboardOpticas() {

  const { branches, loading: loadingBranches } = useBranches();
  const { ventas, loading: loadingVentas, error } = useVentas("");
  const { citas, loading: loadingCitas } = useCitas("");
  const { patients, loading: loadingPatients } = usePatients("", { scopeToAll: true });
  const { productos, loading: loadingProductos } = useProductos();

  const [period, setPeriod] = useState("day");

  const branchesById = useMemo(() => new Map(branches.map((b) => [b.id, b.name])), [branches]);
  const patientsById = useMemo(() => new Map(patients.map((p) => [p.id, p.name])), [patients]);

  const { from, to } = useMemo(() => quickRangeDates(PERIOD_DAYS[period] ?? 1), [period]);

  // Incluye canceladas - las necesita el % de efectividad. El resto del
  // panel (KPIs, gráfica) usa la versión sin cancelar.
  const allScopedVentas = useMemo(
    () => ventas.filter((v) => inDateRange(v.createdAt, from, to)),
    [ventas, from, to]
  );
  const scopedVentas = useMemo(
    () => allScopedVentas.filter((v) => v.status !== "cancelada"),
    [allScopedVentas]
  );

  const efectividad = useMemo(() => {
    if (!allScopedVentas.length) return 100;
    const completadas = allScopedVentas.filter((v) => v.status !== "cancelada").length;
    return Math.round((completadas / allScopedVentas.length) * 100);
  }, [allScopedVentas]);

  const kpis = useMemo(() => {
    const activas = branches.filter((b) => b.status === "active").length;
    const inactivas = branches.length - activas;

    const totalVentasPeriodo = scopedVentas.reduce((sum, v) => sum + v.total, 0);

    const clientesActivos = patients.filter((p) => p.active).length;
    const clientesInactivos = patients.length - clientesActivos;

    const valorTotalProductos = productos.filter((p) => p.active).reduce(
      (sum, p) => sum + (p.stockPorSucursal ?? []).reduce((s, row) => s + row.stock, 0) * Number(p.salePrice ?? 0),
      0
    );

    return [
      { id: "sucursales", type: "branches", title: "Sucursales", color: "blue", value: String(branches.length), description: `Activas: ${activas} · Inactivas: ${inactivas}` },
      { id: "ventas", type: "sales", title: "Ventas del período", color: "orange", value: currency(totalVentasPeriodo), description: "De todas las sucursales" },
      { id: "clientes", type: "customers", title: "Clientes", color: "purple", value: String(patients.length), description: `Activos: ${clientesActivos} · Inactivos: ${clientesInactivos}` },
      { id: "productos", type: "products", title: "Valor total de productos", color: "green", value: currency(valorTotalProductos), description: "Al precio de venta" },
    ];
  }, [branches, scopedVentas, patients, productos]);

  const branchComparison = useMemo(() => {
    return groupByBranch(scopedVentas, branchesById).map((row, idx) => ({
      ...row,
      color: BRANCH_CHART_COLORS[idx % BRANCH_CHART_COLORS.length],
    }));
  }, [scopedVentas, branchesById]);

  const citasEnriquecidas = useMemo(
    () => citas.map((c) => ({
      ...c,
      patientName: patientsById.get(c.patientId) ?? "Paciente",
      branchName: branchesById.get(c.branchId) ?? "",
    })),
    [citas, patientsById, branchesById]
  );

  const criticalStockRows = useMemo(() => {
    const rows = [];
    productos.filter((p) => p.active).forEach((p) => {
      (p.stockPorSucursal ?? []).forEach((s) => {
        if (s.stock <= p.stockMin) {
          rows.push({
            id: `${p.id}-${s.branchId}`, code: p.code, name: p.name,
            branchName: branchesById.get(s.branchId) ?? "", stock: s.stock, stockMin: p.stockMin,
          });
        }
      });
    });
    return rows.sort((a, b) => a.stock - b.stock).slice(0, 6);
  }, [productos, branchesById]);

  const activityItems = useMemo(() => {
    const items = [];

    ventas.forEach((v) => {
      if (v.status === "cancelada") return;
      items.push({
        id: `venta-${v.id}`,
        icon: ShoppingCart, iconBg: "bg-indigo-light", iconColor: "text-indigo-primary",
        actor: v.sellerName || "Sistema",
        description: `registró una nueva venta · ${v.folio} · ${branchesById.get(v.branchId) ?? "Sucursal"}`,
        timestamp: v.createdAt,
      });
    });

    // Los movimientos de stock (entradas/salidas/ajustes) ya no entran a
    // este feed: el back solo expone movimientos por producto individual
    // (GET /stock/:productoId/movimientos), no una lista de "todos los
    // movimientos recientes de la sucursal" - no hay de donde traerlos
    // aquí sin pedir producto por producto. Si el back agrega ese
    // endpoint, aquí es donde se volverían a sumar.

    return items
      .filter((i) => i.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6);
  }, [ventas, branchesById]);


  const loading = loadingBranches || loadingVentas || loadingCitas ||
    loadingPatients || loadingProductos;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;


  return (

    <DashboardLayout
      title="Dashboard Dueño"
      subtitle="Resumen general del negocio."
      kpis={kpis}
      actions={<PeriodToggle periods={PERIODS} value={period} onChange={setPeriod} />}
    >

      <div className="space-y-6">

        <DashboardGrid>

          <div className="col-span-12 h-full xl:col-span-8">
            <ChartContainer
              title="Ventas por sucursal"
              subtitle="Comparativo de rendimiento en el período."
              action={
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                  % de efectividad: {efectividad}%
                </span>
              }
            >
              <BarChart data={branchComparison} dataKey="total" labelKey="name" />
            </ChartContainer>
          </div>

          <div className="col-span-12 h-full xl:col-span-4">
            <TodayAgendaCalendar citas={citasEnriquecidas} showBranch />
          </div>

        </DashboardGrid>

        <DashboardGrid>

          <div className="col-span-12 h-full xl:col-span-6">
            <RecentActivityFeed items={activityItems} />
          </div>

          <div className="col-span-12 h-full xl:col-span-6">
            <CriticalStockTable rows={criticalStockRows} />
          </div>

        </DashboardGrid>

      </div>

    </DashboardLayout>

  );

}
