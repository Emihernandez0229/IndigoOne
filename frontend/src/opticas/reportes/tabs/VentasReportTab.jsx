import { useEffect, useMemo, useState } from "react";

import Input from "../../../shared/components/Input";
import SelectFilter from "../../../shared/filters/SelectFilter";
import ChartContainer from "../../../shared/charts/ChartContainer";
import BarChart from "../../../shared/charts/BarChart";
import KpiRow from "../../../shared/components/KpiRow";

import SalesComparisonList from "../components/SalesComparisonList";
import SalesDetailTable from "../components/SalesDetailTable";
import SalesLineItemsTable from "../components/SalesLineItemsTable";
import { PRODUCT_CATEGORIES, SERVICE_CATEGORIES } from "../../catalogo/constants";
import {
  QUICK_RANGES, inDateRange, unidadesDeVenta,
  buildDailyBuckets, groupByBranch, groupBySeller, groupByItem, itemTotalConIva, toCsv,
} from "../salesReportUtils";
import { currency } from "../../../shared/utils/format";

const ALL_DIMENSIONS = [
  { value: "sucursal", label: "Sucursal" },
  { value: "empleado", label: "Empleado" },
  { value: "producto", label: "Producto" },
  { value: "servicio", label: "Servicio" },
];

function mapLineItem(venta, item, idx) {
  return {
    id: `${venta.id}-${idx}`,
    itemName: item.model || item.code || "Sin nombre",
    itemType: item.itemType,
    fecha: venta.createdAt,
    vendedor: venta.sellerName,
    cantidad: item.quantity,
    total: itemTotalConIva(venta, item),
  };
}


export default function VentasReportTab({
  ventas, productos, servicios, branches, branchesById,
  branchId, setBranchId, dateFrom, dateTo, quickRange, onQuickRange, onDateFromChange, onDateToChange,
  onClearFilters, onExportReady, branchLocked = false,
}) {

  const [sellerName, setSellerName] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [serviceCategory, setServiceCategory] = useState("");
  const [comparisonDim, setComparisonDim] = useState(() => (branchLocked ? "producto" : "sucursal"));
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Si ya está fija la sucursal (Jefe de sucursal), comparar "por sucursal"
  // no tiene sentido - solo habría una barra.
  const comparisonDimensions = branchLocked ? ALL_DIMENSIONS.filter((d) => d.value !== "sucursal") : ALL_DIMENSIONS;

  const branchOptions = useMemo(() => branches.map((b) => ({ value: b.id, label: b.name })), [branches]);

  const sellerOptions = useMemo(() => {
    const pool = branchId ? ventas.filter((v) => v.branchId === branchId) : ventas;
    const names = [...new Set(pool.map((v) => v.sellerName).filter(Boolean))].sort();
    return names.map((name) => ({ value: name, label: name }));
  }, [ventas, branchId]);

  const productosById = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);
  const serviciosById = useMemo(() => new Map(servicios.map((s) => [s.id, s])), [servicios]);

  const scopedVentas = useMemo(
    () => ventas.filter((venta) => {
      if (venta.status === "cancelada") return false;
      if (!inDateRange(venta.createdAt, dateFrom, dateTo)) return false;
      if (branchId && venta.branchId !== branchId) return false;
      if (sellerName && venta.sellerName !== sellerName) return false;
      if (productCategory && !venta.items.some((item) => item.itemType === "producto" && productosById.get(item.productId)?.category === productCategory)) return false;
      if (serviceCategory && !venta.items.some((item) => item.itemType === "servicio" && serviciosById.get(item.productId)?.category === serviceCategory)) return false;
      return true;
    }),
    [ventas, dateFrom, dateTo, branchId, sellerName, productCategory, serviceCategory, productosById, serviciosById]
  );

  const kpis = useMemo(() => {
    const totalVentas = scopedVentas.reduce((sum, v) => sum + v.total, 0);
    const operaciones = scopedVentas.length;
    const ticketPromedio = operaciones > 0 ? totalVentas / operaciones : 0;
    const unidadesVendidas = scopedVentas.reduce((sum, v) => sum + unidadesDeVenta(v), 0);

    return [
      { id: "total", type: "sales", title: "Ventas totales", color: "blue", value: currency(totalVentas), description: "En el período" },
      { id: "ops", type: "orders", title: "Operaciones", color: "purple", value: String(operaciones), description: "Ventas registradas" },
      { id: "avg", type: "revenue", title: "Ticket promedio", color: "green", value: currency(ticketPromedio), description: "Por operación" },
      { id: "units", type: "products", title: "Unidades vendidas", color: "orange", value: String(unidadesVendidas), description: "Solo productos" },
    ];
  }, [scopedVentas]);

  const dailyBuckets = useMemo(
    () => buildDailyBuckets(scopedVentas, dateFrom, dateTo),
    [scopedVentas, dateFrom, dateTo]
  );

  const comparisonItems = useMemo(() => {
    if (comparisonDim === "sucursal") return groupByBranch(scopedVentas, branchesById);
    if (comparisonDim === "empleado") return groupBySeller(scopedVentas);
    if (comparisonDim === "producto") return groupByItem(scopedVentas, "producto");
    return groupByItem(scopedVentas, "servicio");
  }, [comparisonDim, scopedVentas, branchesById]);

  // Con una sola sucursal, el desglose por sucursal no aporta: se reemplaza
  // por el desglose por producto.
  const detailRows = useMemo(
    () => (branchLocked ? groupByItem(scopedVentas, "producto") : groupByBranch(scopedVentas, branchesById)),
    [branchLocked, scopedVentas, branchesById]
  );
  const detailLabel = branchLocked ? "Producto" : "Sucursal";
  const detailSubtitle = branchLocked
    ? "Desglose por producto en el período seleccionado."
    : "Desglose por sucursal en el período seleccionado.";

  // El ojito abre el listado sin agrupar de esa fila: para el Dueño (filas
  // por sucursal) son los productos y servicios vendidos en esa sucursal;
  // para el Jefe (filas por producto, ver detailRows arriba) son las
  // ventas de ese producto en particular - mismo componente en ambos casos.
  const expandedRowName = detailRows.find((r) => r.id === expandedRowId)?.name ?? "";
  const expandedLineItems = useMemo(() => {
    if (!expandedRowId) return [];
    if (branchLocked) {
      return scopedVentas
        .flatMap((v) =>
          (v.items ?? [])
            .filter((item) => item.itemType === "producto" && (item.model || item.code || "Sin nombre") === expandedRowId)
            .map((item, idx) => mapLineItem(v, item, idx))
        )
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }
    return scopedVentas
      .filter((v) => v.branchId === expandedRowId)
      .flatMap((v) => (v.items ?? []).map((item, idx) => mapLineItem(v, item, idx)))
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [expandedRowId, branchLocked, scopedVentas]);

  const comparisonLabel = comparisonDimensions.find((d) => d.value === comparisonDim)?.label
    ?? (branchLocked ? "Producto" : "Sucursal");

  useEffect(() => {
    onExportReady({
      filename: `reporte-ventas-${dateFrom}-a-${dateTo}.csv`,
      csv: toCsv([...detailRows].sort((a, b) => b.total - a.total), [
        { label: detailLabel, value: (row) => row.name },
        { label: "Operaciones", value: (row) => row.operaciones },
        { label: "Unidades", value: (row) => row.unidades },
        { label: "Total", value: (row) => row.total.toFixed(2) },
      ]),
    });
  }, [detailRows, detailLabel, dateFrom, dateTo, onExportReady]);


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
          <SelectFilter label="Empleado" value={sellerName} onChange={setSellerName} placeholder="Todos" options={sellerOptions} />
          <SelectFilter label="Producto" value={productCategory} onChange={setProductCategory} placeholder="Todos" options={PRODUCT_CATEGORIES} />
          <SelectFilter label="Servicios" value={serviceCategory} onChange={setServiceCategory} placeholder="Todos" options={SERVICE_CATEGORIES} />
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">

        <div className="xl:col-span-3">
          <ChartContainer title="Ventas por día" subtitle="Total vendido por día en el período seleccionado.">
            <BarChart data={dailyBuckets} dataKey="total" labelKey="label" />
          </ChartContainer>
        </div>

        <div className="xl:col-span-2">
          <ChartContainer
            title={branchLocked ? `Ventas por ${comparisonLabel.toLowerCase()}` : `Comparativo por ${comparisonLabel.toLowerCase()}`}
            action={
              <div className="inline-flex flex-wrap rounded-xl border border-gray-200 bg-background p-1">
                {comparisonDimensions.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setComparisonDim(d.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      comparisonDim === d.value ? "bg-indigo-primary text-white" : "text-text-secondary hover:bg-surface"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            }
          >
            <SalesComparisonList items={comparisonItems} />
          </ChartContainer>
        </div>

      </div>

      <ChartContainer title="Detalle" subtitle={detailSubtitle}>
        <SalesDetailTable
          rows={detailRows}
          nameLabel={detailLabel}
          onView={(row) => setExpandedRowId((prev) => (prev === row.id ? null : row.id))}
          viewedId={expandedRowId}
        />
      </ChartContainer>

      {expandedRowId && (
        <ChartContainer
          title={`Detalle de ${expandedRowName}`}
          subtitle={branchLocked
            ? "Ventas de este producto, con fecha y vendedor, en el período seleccionado."
            : "Productos y servicios vendidos en esta sucursal, con fecha y vendedor, en el período seleccionado."}
          align="start"
          action={
            <button
              type="button"
              onClick={() => setExpandedRowId(null)}
              className="text-sm font-medium text-indigo-primary hover:underline"
            >
              Cerrar
            </button>
          }
        >
          <SalesLineItemsTable rows={expandedLineItems} />
        </ChartContainer>
      )}

    </>
  );

}
