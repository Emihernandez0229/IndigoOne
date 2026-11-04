import { useEffect, useMemo, useState } from "react";

import Input from "../../../shared/components/Input";
import SelectFilter from "../../../shared/filters/SelectFilter";
import KpiRow from "../../../shared/components/KpiRow";
import ChartContainer from "../../../shared/charts/ChartContainer";
import BarChart from "../../../shared/charts/BarChart";

import SalesComparisonList from "../components/SalesComparisonList";
import SalesLineItemsTable from "../components/SalesLineItemsTable";
import { QUICK_RANGES, inDateRange, groupByItem, buildServiceDailyBuckets, itemTotalConIva, toCsv } from "../salesReportUtils";
import { currency } from "../../../shared/utils/format";

const count = (value) => String(value ?? 0);


export default function ServiciosReportTab({
  ventas, servicios, branches,
  branchId, setBranchId, dateFrom, dateTo, quickRange, onQuickRange, onDateFromChange, onDateToChange,
  onClearFilters, onExportReady, branchLocked = false,
}) {

  const [serviceId, setServiceId] = useState("");

  const branchOptions = useMemo(() => branches.map((b) => ({ value: b.id, label: b.name })), [branches]);

  const serviceOptions = useMemo(
    () => servicios.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name })),
    [servicios]
  );

  const scopedVentas = useMemo(
    () => ventas.filter((venta) =>
      venta.status !== "cancelada" &&
      inDateRange(venta.createdAt, dateFrom, dateTo) &&
      (!branchId || venta.branchId === branchId)
    ),
    [ventas, dateFrom, dateTo, branchId]
  );

  const servicioStats = useMemo(
    () => groupByItem(scopedVentas, "servicio", serviceId || undefined),
    [scopedVentas, serviceId]
  );

  const kpis = useMemo(() => {
    const realizados = servicioStats.reduce((sum, s) => sum + s.unidades, 0);
    const ingresos = servicioStats.reduce((sum, s) => sum + s.total, 0);
    const masSolicitado = [...servicioStats].sort((a, b) => b.unidades - a.unidades)[0]?.name ?? "—";
    const ingresoPromedio = realizados > 0 ? ingresos / realizados : 0;

    return [
      { id: "realizados", type: "orders", title: "Servicios realizados", color: "blue", value: String(realizados), description: "En el período" },
      { id: "ingresos", type: "revenue", title: "Ingresos generados", color: "green", value: currency(ingresos), description: "En el período" },
      { id: "top", type: "confirmed", title: "Más solicitado", color: "purple", value: masSolicitado, description: "" },
      { id: "promedio", type: "revenue", title: "Ingreso promedio", color: "orange", value: currency(ingresoPromedio), description: "Por servicio" },
    ];
  }, [servicioStats]);

  const dailyBuckets = useMemo(
    () => buildServiceDailyBuckets(scopedVentas, dateFrom, dateTo, serviceId || undefined),
    [scopedVentas, dateFrom, dateTo, serviceId]
  );

  const comparisonItems = useMemo(
    () => servicioStats.map((s) => ({ id: s.id, name: s.name, total: s.unidades })),
    [servicioStats]
  );

  // Detalle sin agrupar: cada servicio realizado con su fecha y quién lo
  // vendió (antes era un resumen por nombre de servicio, pero eso no deja
  // ver fecha/vendedor por renglón).
  const servicioLineItems = useMemo(() => {
    return scopedVentas
      .flatMap((v) =>
        (v.items ?? [])
          .filter((item) => item.itemType === "servicio" && (!serviceId || item.productId === serviceId))
          .map((item, idx) => ({
            id: `${v.id}-${idx}`,
            itemName: item.model || item.code || "Sin nombre",
            itemType: item.itemType,
            fecha: v.createdAt,
            vendedor: v.sellerName,
            cantidad: item.quantity,
            total: itemTotalConIva(v, item),
          }))
      )
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [scopedVentas, serviceId]);

  useEffect(() => {
    onExportReady({
      filename: `reporte-servicios-${dateFrom}-a-${dateTo}.csv`,
      csv: toCsv(servicioLineItems, [
        { label: "Servicio", value: (row) => row.itemName },
        { label: "Fecha", value: (row) => row.fecha },
        { label: "Vendedor", value: (row) => row.vendedor },
        { label: "Cantidad", value: (row) => row.cantidad },
        { label: "Total", value: (row) => row.total.toFixed(2) },
      ]),
    });
  }, [servicioLineItems, dateFrom, dateTo, onExportReady]);


  return (
    <>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-surface p-4">

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-secondary">Período</label>
            <div className="flex items-center gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} />
              <span className="text-text-secondary">a</span>
              <Input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} />
            </div>
          </div>
          {!branchLocked && (
            <SelectFilter label="Sucursal" value={branchId} onChange={setBranchId} placeholder="Todas" options={branchOptions} />
          )}
          <SelectFilter label="Servicio" value={serviceId} onChange={setServiceId} placeholder="Todos" options={serviceOptions} />
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            {QUICK_RANGES.map((qr) => (
              <button
                key={qr.value}
                type="button"
                onClick={() => onQuickRange(qr.value, qr.days)}
                className={`text-sm font-medium transition ${
                  quickRange === qr.value ? "text-indigo-primary" : "text-text-secondary hover:text-indigo-primary"
                }`}
              >
                {qr.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClearFilters} className="pb-2 text-sm font-medium text-indigo-primary hover:underline">
            Limpiar filtros
          </button>
        </div>

      </div>

      <KpiRow items={kpis} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <ChartContainer title="Servicios más solicitados" subtitle="Veces realizado en el período." align="start">
          <SalesComparisonList items={comparisonItems} formatValue={count} />
        </ChartContainer>

        <ChartContainer title="Servicios realizados por día" subtitle="Cantidad de servicios por día en el período.">
          <BarChart data={dailyBuckets} dataKey="total" labelKey="label" color="#A855F7" />
        </ChartContainer>

      </div>

      <ChartContainer title="Detalle por servicio" subtitle="Servicios realizados en el período, con fecha y quién lo realizó." align="start">
        <SalesLineItemsTable rows={servicioLineItems} />
      </ChartContainer>

    </>
  );

}
