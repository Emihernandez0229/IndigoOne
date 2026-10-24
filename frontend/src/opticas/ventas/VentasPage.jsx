import { useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { Plus } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import Button from "../../shared/components/Button";
import SearchInput from "../../shared/components/SearchInput";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import ConfirmDialog from "../../shared/components/ConfirmDialog";
import SidePanel from "../../shared/components/SidePanel";
import Can from "../../shared/security/Can";
import useBranchScope from "../../shared/hooks/useBranchScope";
import { ROLES } from "../../shared/security/roles";

import { listBranches } from "../branches/services/branchService";
import usePatients from "../pacientes/hooks/usePatients";
import useLaboratorio from "../laboratorio/hooks/useLaboratorio";
import useVentas from "./hooks/useVentas";
import { filterVentas } from "./filterVentas";
import { SALE_STATUSES, WORK_TYPES, PAYMENT_METHODS } from "./constants";
import VentaTable from "./components/VentaTable";
import VentaDetailPanel from "./components/VentaDetailPanel";
import LiquidarSaldoPanel from "./components/LiquidarSaldoPanel";
import { downloadPaymentReceipt } from "./pdfReceipt";


export default function VentasPage() {

  const navigate = useNavigate();
  const location = useLocation();

  const { isOwner, branches, selectedBranch, setSelectedBranch, loadingBranches } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
    autoSelectFirst: false,
  });

  // "" (Todas) trae pacientes de todas las sucursales, igual que el
  // modulo Clientes del dueno.
  const { patients } = usePatients(selectedBranch, { scopeToAll: !selectedBranch });
  const { orders: labOrders } = useLaboratorio(selectedBranch);
  const { ventas, loading, error, liquidar, changeStatus, cancel } = useVentas(selectedBranch);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [workType, setWorkType] = useState("");
  // Laboratorio enlaza aqui (SidePanel, ya no es una ruta por id) para
  // abrir directo el detalle de la venta relacionada a una orden.
  const [viewingId, setViewingId] = useState(() => location.state?.viewVentaId ?? null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [liquidatingId, setLiquidatingId] = useState(null);


  const patientsById = useMemo(() => {
    const map = new Map();
    patients.forEach((patient) => map.set(patient.id, patient.name));
    return map;
  }, [patients]);

  const branchesById = useMemo(() => {
    const map = new Map();
    branches.forEach((branch) => map.set(branch.id, branch.name));
    return map;
  }, [branches]);

  // Con "Todas" cada venta puede ser de una sucursal distinta, asi que el
  // nombre se busca por fila (no por la sucursal elegida en el filtro).
  // "receta" sale de la orden de laboratorio ligada (solo aplica cuando
  // workType es "orden_laboratorio").
  const ventasEnriched = useMemo(
    () => ventas.map((venta) => ({
      ...venta,
      patientName: patientsById.get(venta.patientId),
      branchName: branchesById.get(venta.branchId) ?? "",
      receta: labOrders.find((o) => o.saleId === venta.id)?.receta ?? null,
    })),
    [ventas, patientsById, branchesById, labOrders]
  );

  const filtered = useMemo(
    () => filterVentas(ventasEnriched, { query, status, date, workType }),
    [ventasEnriched, query, status, date, workType]
  );

  const viewingVenta = ventasEnriched.find((v) => v.id === viewingId) ?? null;
  const liquidatingVenta = ventasEnriched.find((v) => v.id === liquidatingId) ?? null;

  const handleConfirmLiquidar = async (monto) => {
    const updated = await liquidar(liquidatingVenta.id, monto);
    downloadPaymentReceipt({
      folio: liquidatingVenta.folio,
      date: new Date().toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" }),
      patientName: liquidatingVenta.patientName || "Público general",
      sellerName: liquidatingVenta.sellerName,
      paymentMethodLabel: PAYMENT_METHODS.find((m) => m.value === "efectivo")?.label,
      montoPagado: monto,
      saldoPendiente: updated.saldoPendiente,
    });
    setLiquidatingId(null);
  };

  const kpis = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);

    const thisMonth = ventas.filter((v) => {
      if (!v.createdAt) return false;
      const created = new Date(v.createdAt);
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
    });
    const thisMonthActive = thisMonth.filter((v) => v.status !== "cancelada");
    const todayActive = ventas.filter((v) => v.status !== "cancelada" && (v.createdAt ?? "").slice(0, 10) === today);
    // "Pendientes de pago" es el adeudo (ver PAYMENT_STATUSES), no el
    // estado del trabajo - son independientes.
    const pendingPayment = ventas.filter((v) => v.status !== "cancelada" && v.paymentStatus === "en_adeudo");

    return [
      {
        id: "monthTotal", type: "sales", title: "Total de ventas en el mes", color: "blue",
        value: String(thisMonth.length), description: "Registradas este mes",
      },
      {
        id: "monthAmount", type: "revenue", title: "Ventas del mes", color: "green",
        value: `$${thisMonthActive.reduce((sum, v) => sum + v.total, 0).toLocaleString("es-MX")}`,
        description: "Importe del mes",
      },
      {
        id: "today", type: "appointments", title: "Ventas de hoy", color: "orange",
        value: String(todayActive.length), description: "Registradas hoy",
      },
      {
        id: "pending", type: "lowStock", title: "Ventas pendientes de pago", color: "red",
        value: String(pendingPayment.length), description: "Saldo por cobrar",
      },
    ];
  }, [ventas]);


  if (loadingBranches) return <LoadingSpinner />;

  return (

    <PageContainer
      title="Ventas"
      description="Ventas registradas en tu alcance."
      actions={
        <Can permission="optica.sales.create">
          <Button
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => navigate("/opticas/ventas/nueva", { state: { branchId: selectedBranch } })}
          >
            <Plus className="h-4 w-4" />
            Nueva venta
          </Button>
        </Can>
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
            placeholder="Buscar por folio, paciente o producto"
          />
          <SelectFilter
            label="Estado"
            value={status}
            onChange={setStatus}
            placeholder="Todos los estados"
            options={SALE_STATUSES}
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
              options={[{ value: "", label: "Todas las sucursales" }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
            />
          )}
          <SelectFilter
            label="Trabajo"
            value={workType}
            onChange={setWorkType}
            placeholder="Todos los trabajos"
            options={WORK_TYPES}
          />
        </FilterBar>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState />
        ) : (
          <VentaTable
            ventas={filtered}
            onView={(venta) => setViewingId(venta.id)}
          />
        )}

      </div>

      <SidePanel
        isOpen={Boolean(viewingVenta) || Boolean(liquidatingVenta)}
        onClose={() => {
          setViewingId(null);
          setLiquidatingId(null);
        }}
        title={liquidatingVenta ? "Liquidar saldo" : "Detalle de venta"}
      >
        {liquidatingVenta ? (
          <LiquidarSaldoPanel
            venta={liquidatingVenta}
            onCancel={() => setLiquidatingId(null)}
            onConfirm={handleConfirmLiquidar}
          />
        ) : (
          <VentaDetailPanel
            venta={viewingVenta}
            receta={viewingVenta?.receta}
            onLiquidar={(venta) => setLiquidatingId(venta.id)}
            onChangeStatus={(venta, transition) => setConfirmAction({ action: "changeStatus", venta, transition })}
            onCancel={(venta) => setConfirmAction({ action: "cancel", venta })}
          />
        )}
      </SidePanel>

      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.action === "changeStatus" ? confirmAction.transition.label : "Cancelar venta"}
        description={
          confirmAction &&
          (confirmAction.action === "changeStatus"
            ? `¿Confirmas que quieres marcar la venta "${confirmAction.venta.folio}" como "${confirmAction.transition.label.toLowerCase()}"?`
            : `¿Seguro que quieres cancelar la venta "${confirmAction.venta.folio}"? Esta acción no se puede deshacer.`)
        }
        confirmLabel={confirmAction?.action === "changeStatus" ? confirmAction.transition.label : "Cancelar venta"}
        variant={confirmAction?.action === "changeStatus" ? "primary" : "danger"}
        onConfirm={() =>
          confirmAction.action === "changeStatus"
            ? changeStatus(confirmAction.venta.id, confirmAction.transition.value)
            : cancel(confirmAction.venta.id)
        }
        onClose={() => setConfirmAction(null)}
      />

    </PageContainer>

  );

}
