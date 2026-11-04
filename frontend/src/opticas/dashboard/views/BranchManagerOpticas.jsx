import { useMemo, useState } from "react";
import { ShoppingCart, Package } from "lucide-react";

import DashboardLayout from "../../../shared/dashboard/DashboardLayout";
import DashboardGrid from "../../../shared/dashboard/DashboardGrid";

import ChartContainer from "../../../shared/charts/ChartContainer";
import SalesPerformanceChart from "../../../shared/charts/SalesPerformanceChart";

import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import ErrorState from "../../../shared/components/ErrorState";
import PeriodToggle from "../../../shared/components/PeriodToggle";
import { buildPeriodWindows } from "../../../shared/utils/periodWindows";

import useBranchScope from "../../../shared/hooks/useBranchScope";
import { ROLES } from "../../../shared/security/roles";
import { listBranches } from "../../branches/services/branchService";

import useVentas from "../../ventas/hooks/useVentas";
import useCitas from "../../citas/hooks/useCitas";
import usePatients from "../../pacientes/hooks/usePatients";
import useProductos from "../../catalogo/hooks/useProductos";
import useUsers from "../../users/hooks/useUsers";
import useMovimientos from "../../inventory/hooks/useMovimientos";

import TodayAgendaCalendar from "../components/TodayAgendaCalendar";
import RecentActivityFeed from "../components/RecentActivityFeed";
import CriticalStockTable from "../components/CriticalStockTable";

import { inDateRange, quickRangeDates } from "../../reportes/salesReportUtils";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

const PERIODS = [
  { value: "week", label: "Semanal" },
  { value: "month", label: "Mensual" },
  { value: "year", label: "Anual" },
];
const PERIOD_DAYS = { week: 7, month: 30, year: 365 };

const MOVIMIENTO_META = {
  entrada: { label: "entrada", iconBg: "bg-success/10", iconColor: "text-success" },
  salida: { label: "salida", iconBg: "bg-error/10", iconColor: "text-error" },
  ajustes: { label: "un ajuste", iconBg: "bg-indigo-light", iconColor: "text-indigo-primary" },
};


/**
 * Mismo dashboard que el del Dueño, pero fijo a la sucursal del Jefe:
 * sin comparar sucursales (una gráfica de ventas por día en su lugar),
 * sin columna de Sucursal en Stock crítico, y "Personal" en vez de
 * "Sucursales" en los KPIs (ver OwnerDashboardOpticas para la versión
 * multi-sucursal).
 */
export default function BranchManagerOpticas() {

  const { branches, selectedBranch, loadingBranches } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
    alwaysLoad: true,
  });

  const { ventas, loading: loadingVentas, error } = useVentas(selectedBranch);
  const { citas, loading: loadingCitas } = useCitas(selectedBranch);
  const { patients, loading: loadingPatients } = usePatients(selectedBranch);
  const { productos, loading: loadingProductos } = useProductos();
  const { users, loading: loadingUsers } = useUsers();
  const { movimientos, loading: loadingMovimientos } = useMovimientos();

  const [period, setPeriod] = useState("week");

  const branchName = useMemo(
    () => branches.find((b) => b.id === selectedBranch)?.name ?? "tu sucursal",
    [branches, selectedBranch]
  );
  const patientsById = useMemo(() => new Map(patients.map((p) => [p.id, p.name])), [patients]);
  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u.name])), [users]);
  const productosById = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  const branchStaff = useMemo(() => users.filter((u) => u.branchId === selectedBranch), [users, selectedBranch]);
  const branchMovimientos = useMemo(() => movimientos.filter((m) => m.branchId === selectedBranch), [movimientos, selectedBranch]);

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
    const activos = branchStaff.filter((u) => u.status === "active").length;
    const inactivos = branchStaff.length - activos;

    const totalVentasPeriodo = scopedVentas.reduce((sum, v) => sum + v.total, 0);

    const clientesActivos = patients.filter((p) => p.active).length;
    const clientesInactivos = patients.length - clientesActivos;

    const valorTotalProductos = productos.filter((p) => p.active).reduce(
      (sum, p) => sum + (p.stockPorSucursal?.find((s) => s.branchId === selectedBranch)?.stock ?? 0) * Number(p.salePrice ?? 0),
      0
    );

    return [
      { id: "personal", type: "team", title: "Personal", color: "blue", value: String(branchStaff.length), description: `Activos: ${activos} · Inactivos: ${inactivos}` },
      { id: "ventas", type: "sales", title: "Ventas del período", color: "orange", value: currency(totalVentasPeriodo), description: "De tu sucursal" },
      { id: "clientes", type: "customers", title: "Clientes", color: "purple", value: String(patients.length), description: `Activos: ${clientesActivos} · Inactivos: ${clientesInactivos}` },
      { id: "productos", type: "products", title: "Valor total de productos", color: "green", value: currency(valorTotalProductos), description: "Al precio de venta" },
    ];
  }, [branchStaff, scopedVentas, patients, productos, selectedBranch]);

  // Mismas ventanas de fecha que usa el dashboard de Gerente de sucursal de
  // Indigo (Semanal: últimos 7 días: Mensual: últimas 4 semanas; Anual:
  // últimos 12 meses) - cada quien calcula su propio valor por ventana, acá
  // la suma del total de las ventas no canceladas.
  const ventasBuckets = useMemo(() => {
    const mode = period === "year" ? "year-rolling" : period;
    return buildPeriodWindows(mode).map(({ label, from: wFrom, to: wTo }) => ({
      label,
      amount: ventas
        .filter((v) => v.status !== "cancelada")
        .filter((v) => {
          const d = new Date(v.createdAt);
          return d >= wFrom && d <= wTo;
        })
        .reduce((sum, v) => sum + v.total, 0),
    }));
  }, [ventas, period]);

  const citasEnriquecidas = useMemo(
    () => citas.map((c) => ({ ...c, patientName: patientsById.get(c.patientId) ?? "Paciente" })),
    [citas, patientsById]
  );

  const criticalStockRows = useMemo(() => {
    const rows = [];
    productos.filter((p) => p.active).forEach((p) => {
      const stockRow = p.stockPorSucursal?.find((s) => s.branchId === selectedBranch);
      if (!stockRow) return;
      if (stockRow.stock <= p.stockMin) {
        rows.push({ id: p.id, code: p.code, name: p.name, stock: stockRow.stock, stockMin: p.stockMin });
      }
    });
    return rows.sort((a, b) => a.stock - b.stock).slice(0, 6);
  }, [productos, selectedBranch]);

  const activityItems = useMemo(() => {
    const items = [];

    ventas.forEach((v) => {
      if (v.status === "cancelada") return;
      items.push({
        id: `venta-${v.id}`,
        icon: ShoppingCart, iconBg: "bg-indigo-light", iconColor: "text-indigo-primary",
        actor: v.sellerName || "Sistema",
        description: `registró una nueva venta · ${v.folio}`,
        timestamp: v.createdAt,
      });
    });

    // Los movimientos tipo "ventas" son la contraparte de inventario de la
    // misma venta de arriba - se omiten para no duplicar el evento.
    branchMovimientos.filter((m) => m.tipo !== "ventas").forEach((m) => {
      const meta = MOVIMIENTO_META[m.tipo] ?? MOVIMIENTO_META.entrada;
      items.push({
        id: `mov-${m.id}`,
        icon: Package, iconBg: meta.iconBg, iconColor: meta.iconColor,
        actor: usersById.get(m.createdBy) ?? "Sistema",
        description: `registró ${meta.label} de ${m.cantidad} ${productosById.get(m.productId)?.name ?? "producto"}`,
        timestamp: m.createdAt,
      });
    });

    return items
      .filter((i) => i.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 6);
  }, [ventas, branchMovimientos, usersById, productosById]);


  const loading = loadingBranches || loadingVentas || loadingCitas ||
    loadingPatients || loadingProductos || loadingUsers || loadingMovimientos;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;


  return (

    <DashboardLayout
      title="Dashboard Jefe de Sucursal"
      subtitle={`Resumen de ${branchName}.`}
      kpis={kpis}
      actions={<PeriodToggle periods={PERIODS} value={period} onChange={setPeriod} />}
    >

      <div className="space-y-6">

        <DashboardGrid>

          <div className="col-span-12 h-full xl:col-span-8">
            <ChartContainer
              title="Rendimiento de ventas en mi sucursal"
              subtitle="Por periodo."
              action={
                <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                  % de efectividad: {efectividad}%
                </span>
              }
              align="start"
            >
              <SalesPerformanceChart data={ventasBuckets} dataKey="amount" />
            </ChartContainer>
          </div>

          <div className="col-span-12 h-full xl:col-span-4">
            <TodayAgendaCalendar citas={citasEnriquecidas} />
          </div>

        </DashboardGrid>

        <DashboardGrid>

          <div className="col-span-12 h-full xl:col-span-6">
            <RecentActivityFeed items={activityItems} />
          </div>

          <div className="col-span-12 h-full xl:col-span-6">
            <CriticalStockTable rows={criticalStockRows} showBranch={false} />
          </div>

        </DashboardGrid>

      </div>

    </DashboardLayout>

  );

}
