import { useMemo, useState } from "react";

import { FlaskConical, Wrench } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import SearchInput from "../../shared/components/SearchInput";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import Input from "../../shared/components/Input";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
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

import useVentas from "../ventas/hooks/useVentas";
import { SALE_STATUSES } from "../ventas/constants";
import VentaTable from "../ventas/components/VentaTable";
import VentaDetailPanel from "../ventas/components/VentaDetailPanel";
import LiquidarSaldoPanel from "../ventas/components/LiquidarSaldoPanel";
import { downloadPaymentReceipt } from "../ventas/pdfReceipt";


export default function LaboratorioPage() {

  const { can } = usePermissions();

  const { isOwner, branches, selectedBranch, setSelectedBranch, loadingBranches } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
    alwaysLoad: true,
    autoSelectFirst: false,
  });

  const { patients } = usePatients(selectedBranch, { scopeToAll: !selectedBranch });
  const { orders, loading: loadingOrders, error: errorOrders, changeStatus } = useLaboratorio(selectedBranch);
  const {
    ventas, loading: loadingVentas, error: errorVentas,
    liquidar, changeStatus: changeVentaStatus, cancel: cancelVenta,
  } = useVentas(selectedBranch);

  const [tab, setTab] = useState("laboratorio");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState("");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [viewingOrderId, setViewingOrderId] = useState(null);
  const [viewingVentaId, setViewingVentaId] = useState(null);
  const [liquidatingId, setLiquidatingId] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);


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

  const ventaBySaleId = useMemo(() => new Map(ventas.map((v) => [v.id, v])), [ventas]);

  // Una orden no trae folio/vendedor/prioridad/total/pagos propios - esos
  // datos viven en la venta que la generó (order.saleId), asi que se
  // enriquecen aqui para mostrar los mismos campos que "Trabajos internos".
  const ordersWithPatient = useMemo(
    () => orders.map((order) => {
      const venta = ventaBySaleId.get(order.saleId);
      return {
        ...order,
        patientName: patientsById.get(order.patientId),
        branchName: branchesById.get(order.branchId) ?? "",
        folio: venta?.folio ?? "",
        sellerName: venta?.sellerName ?? "",
        priority: venta?.priority ?? "normal",
        total: venta?.total ?? 0,
        paymentStatus: venta?.paymentStatus ?? "",
        workType: "orden_laboratorio",
      };
    }),
    [orders, patientsById, branchesById, ventaBySaleId]
  );

  // "Trabajos internos" son ventas con workType "trabajo_interno" - viven
  // en Ventas, pero se gestionan tambien aqui para darles el mismo
  // seguimiento de estado que ya tienen las ordenes de laboratorio.
  const trabajosInternos = useMemo(
    () => ventas
      .filter((venta) => venta.workType === "trabajo_interno")
      .map((venta) => ({
        ...venta,
        patientName: patientsById.get(venta.patientId),
        branchName: branchesById.get(venta.branchId) ?? "",
      })),
    [ventas, patientsById, branchesById]
  );

  const filteredOrders = useMemo(
    () => filterLaboratorio(ordersWithPatient, { query, status, period, customFrom, customTo }),
    [ordersWithPatient, query, status, period, customFrom, customTo]
  );

  const filteredInternos = useMemo(
    () => filterLaboratorio(trabajosInternos, { query, status, period, customFrom, customTo }),
    [trabajosInternos, query, status, period, customFrom, customTo]
  );

  const viewingOrder = ordersWithPatient.find((o) => o.id === viewingOrderId) ?? null;
  const viewingPatient = patients.find((p) => p.id === viewingOrder?.patientId) ?? null;
  const viewingVenta = trabajosInternos.find((v) => v.id === viewingVentaId) ?? null;
  const liquidatingVenta = trabajosInternos.find((v) => v.id === liquidatingId) ?? null;

  const kpisLaboratorio = useMemo(() => [
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

  const kpisInternos = useMemo(() => [
    {
      id: "total", type: "laboratory", title: "Total de trabajos internos", color: "blue",
      value: String(trabajosInternos.length), description: "Registrados",
    },
    {
      id: "pendiente", type: "scheduled", title: "Pendientes", color: "orange",
      value: String(trabajosInternos.filter((v) => v.status === "pendiente").length),
      description: "Por iniciar",
    },
    {
      id: "en_proceso", type: "confirmed", title: "En proceso", color: "purple",
      value: String(trabajosInternos.filter((v) => v.status === "en_proceso").length),
      description: "En taller",
    },
    {
      id: "completada", type: "available", title: "Completados", color: "green",
      value: String(trabajosInternos.filter((v) => v.status === "completada").length),
      description: "Terminados",
    },
  ], [trabajosInternos]);

  const kpis = tab === "laboratorio" ? kpisLaboratorio : kpisInternos;
  const statusOptions = tab === "laboratorio" ? LAB_STATUSES : SALE_STATUSES;
  const loading = tab === "laboratorio" ? loadingOrders : loadingVentas;
  const error = tab === "laboratorio" ? errorOrders : errorVentas;

  const handleTabChange = (value) => {
    setTab(value);
    setStatus("");
    setViewingOrderId(null);
    setViewingVentaId(null);
  };

  const handleChangeStatus = async () => {
    await changeStatus(viewingOrderId, pendingStatus.value);
    setPendingStatus(null);
  };

  const handleConfirmLiquidar = async (monto) => {
    const updated = await liquidar(liquidatingVenta.id, monto);
    downloadPaymentReceipt({
      folio: liquidatingVenta.folio,
      date: new Date().toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" }),
      patientName: liquidatingVenta.patientName || "Público general",
      sellerName: liquidatingVenta.sellerName,
      paymentMethodLabel: "Efectivo",
      montoPagado: monto,
      saldoPendiente: updated.saldoPendiente,
    });
    setLiquidatingId(null);
  };


  if (loadingBranches) return <LoadingSpinner />;

  return (

    <PageContainer
      title="Laboratorio"
      description="Órdenes de laboratorio y trabajos internos generados desde tus ventas."
    >

      <div className="flex items-start gap-6">

        <div className="min-w-0 flex-1 space-y-6 transition-all duration-300 ease-in-out">

          <div className="flex gap-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => handleTabChange("laboratorio")}
              className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition ${
                tab === "laboratorio" ? "border-indigo-primary text-indigo-primary" : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <FlaskConical className="h-4 w-4" />
              Laboratorio
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("internos")}
              className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition ${
                tab === "internos" ? "border-indigo-primary text-indigo-primary" : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              <Wrench className="h-4 w-4" />
              Trabajos internos
            </button>
          </div>

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
                options={[{ value: "", label: "Todas las sucursales" }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
              />
            )}
            <SelectFilter
              label="Estado"
              value={status}
              onChange={setStatus}
              placeholder="Todos los estados"
              options={statusOptions}
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

          {loading ? (
            <LoadingSpinner />
          ) : error ? (
            <ErrorState />
          ) : tab === "laboratorio" ? (
            <LaboratorioTable
              orders={filteredOrders}
              onView={(order) => setViewingOrderId(order.id)}
            />
          ) : (
            <VentaTable
              ventas={filteredInternos}
              onView={(venta) => setViewingVentaId(venta.id)}
            />
          )}

        </div>

        <SidePanel
          isOpen={tab === "laboratorio" ? Boolean(viewingOrder) : (Boolean(viewingVenta) || Boolean(liquidatingVenta))}
          onClose={() => {
            setViewingOrderId(null);
            setViewingVentaId(null);
            setLiquidatingId(null);
          }}
          title={tab === "laboratorio" ? "Detalle de orden" : liquidatingVenta ? "Liquidar saldo" : "Detalle de trabajo interno"}
        >
          {tab === "laboratorio" ? (
            <LaboratorioDetailPanel
              order={viewingOrder}
              patient={viewingPatient}
              canManage={can("optica.lab.manage")}
              onChangeStatus={(transition) => setPendingStatus(transition)}
            />
          ) : liquidatingVenta ? (
            <LiquidarSaldoPanel
              venta={liquidatingVenta}
              onCancel={() => setLiquidatingId(null)}
              onConfirm={handleConfirmLiquidar}
            />
          ) : (
            <VentaDetailPanel
              venta={viewingVenta}
              onLiquidar={(venta) => setLiquidatingId(venta.id)}
              onChangeStatus={(venta, transition) => setConfirmAction({ action: "changeStatus", venta, transition })}
              onCancel={(venta) => setConfirmAction({ action: "cancel", venta })}
            />
          )}
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

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.action === "changeStatus" ? confirmAction.transition.label : "Cancelar trabajo"}
        description={
          confirmAction &&
          (confirmAction.action === "changeStatus"
            ? `¿Confirmas que quieres marcar el trabajo "${confirmAction.venta.folio}" como "${confirmAction.transition.label.toLowerCase()}"?`
            : `¿Seguro que quieres cancelar el trabajo "${confirmAction.venta.folio}"? Esta acción no se puede deshacer.`)
        }
        confirmLabel={confirmAction?.action === "changeStatus" ? confirmAction.transition.label : "Cancelar trabajo"}
        variant={confirmAction?.action === "changeStatus" ? "primary" : "danger"}
        onConfirm={() =>
          confirmAction.action === "changeStatus"
            ? changeVentaStatus(confirmAction.venta.id, confirmAction.transition.value)
            : cancelVenta(confirmAction.venta.id)
        }
        onClose={() => setConfirmAction(null)}
      />

    </PageContainer>

  );

}
