import { useMemo, useState } from "react";

import Input from "../../../shared/components/Input";
import SelectFilter from "../../../shared/filters/SelectFilter";
import KpiRow from "../../../shared/components/KpiRow";
import ChartContainer from "../../../shared/charts/ChartContainer";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";

import { QUICK_RANGES, inDateRange } from "../salesReportUtils";
import { MOVIMIENTO_META } from "../../inventory/constants";
import useMovimientos from "../../inventory/hooks/useMovimientos";
import { formatFecha } from "../../../shared/utils/format";

const ESTADO_OPTIONS = [
  { value: "available", label: "Disponible" },
  { value: "low_stock", label: "Pocas unidades" },
  { value: "out_of_stock", label: "Agotado" },
];


export default function InventarioReportTab({
  productos, branches, branchesById,
  branchId, setBranchId, dateFrom, dateTo, quickRange, onQuickRange, onDateFromChange, onDateToChange,
  onClearFilters, branchLocked = false,
}) {

  const [category, setCategory] = useState("");
  const [estado, setEstado] = useState("");
  const [movimientoProductId, setMovimientoProductId] = useState("");

  const branchOptions = useMemo(() => branches.map((b) => ({ value: b.id, label: b.name })), [branches]);
  const productosById = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  // Las categorías ya no son una lista fija: se sacan de los productos
  // que realmente llegaron (cada uno ya trae su categoryId/categoryName
  // reales del back, ver catalogoService.js).
  const categoryOptions = useMemo(() => {
    const map = new Map();
    productos.forEach((p) => {
      if (p.categoryId != null && !map.has(p.categoryId)) {
        map.set(p.categoryId, { value: String(p.categoryId), label: p.categoryName });
      }
    });
    return [...map.values()];
  }, [productos]);

  const productOptions = useMemo(
    () => productos.filter((p) => p.active).map((p) => ({ value: p.id, label: p.name })),
    [productos]
  );

  // El back solo da movimientos de UN producto a la vez (no existe un
  // "todos los movimientos" plano) - por eso aquí hay que elegir uno.
  const { movimientos, loading: loadingMovimientos } = useMovimientos(movimientoProductId, branchId);

  // Filtradas por Sucursal/Categoría pero sin Estado, para que los KPIs
  // reflejen el alcance completo (el Estado solo recorta la tabla de
  // Existencias, no los conteos de arriba).
  const baseRows = useMemo(() => {
    const rows = [];
    productos.filter((p) => p.active).forEach((p) => {
      (p.stockPorSucursal ?? []).forEach((s) => {
        if (branchId && s.branchId !== branchId) return;
        if (category && String(p.categoryId) !== category) return;
        const status = s.stock <= 0 ? "out_of_stock" : s.stock <= p.stockMin ? "low_stock" : "available";
        rows.push({
          id: `${p.id}-${s.branchId}`,
          productId: p.id,
          productName: p.name,
          category: p.categoryName,
          branchId: s.branchId,
          branchName: branchesById.get(s.branchId) ?? "",
          stock: s.stock,
          stockMin: p.stockMin,
          status,
        });
      });
    });
    return rows;
  }, [productos, branchId, category, branchesById]);

  const existenciaRows = useMemo(
    () => (estado ? baseRows.filter((r) => r.status === estado) : baseRows),
    [baseRows, estado]
  );

  const kpis = useMemo(() => {
    const productosCount = new Set(baseRows.map((r) => r.productId)).size;
    const unidades = baseRows.reduce((sum, r) => sum + r.stock, 0);
    const pocas = baseRows.filter((r) => r.status === "low_stock").length;
    const agotados = baseRows.filter((r) => r.status === "out_of_stock").length;
    return [
      { id: "productos", type: "products", title: "Productos", color: "blue", value: String(productosCount), description: "En el catálogo" },
      { id: "unidades", type: "products", title: "Unidades en existencia", color: "purple", value: String(unidades), description: "Entre sucursales" },
      { id: "pocas", type: "lowStock", title: "Pocas unidades", color: "orange", value: String(pocas), description: "Por reabastecer" },
      { id: "agotados", type: "outOfStock", title: "Agotados", color: "red", value: String(agotados), description: "Sin existencia" },
    ];
  }, [baseRows]);

  // "movimientos" ya viene filtrado por producto+sucursal desde el hook
  // (eso lo exige el back); aquí solo falta acotar por fecha.
  const movimientoProductName = productosById.get(movimientoProductId)?.name ?? "";
  const movimientoRows = useMemo(() => {
    return movimientos
      .filter((m) => inDateRange(m.createdAt, dateFrom, dateTo))
      .map((m) => {
        const meta = MOVIMIENTO_META[m.tipo] ?? MOVIMIENTO_META.entrada;
        return {
          id: m.id,
          fecha: m.createdAt,
          productName: movimientoProductName,
          motivo: m.motivo ?? "",
          tipo: m.tipo,
          badge: meta.badge,
          tipoLabel: meta.label,
          cantidadMostrada: `${meta.sign > 0 ? "+" : "-"}${m.cantidad}`,
          realizadoPor: m.createdByName || "—",
        };
      })
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [movimientos, dateFrom, dateTo, movimientoProductName]);

  const existenciaColumns = [
    {
      key: "producto",
      label: "Producto",
      render: (row) => (
        <div>
          <p className="font-medium text-text-primary">{row.productName}</p>
          <p className="text-xs capitalize text-text-secondary">{row.category}</p>
        </div>
      ),
    },
    ...(branchLocked ? [] : [{ key: "branchName", label: "Sucursal" }]),
    { key: "stock", label: "Existencia", render: (row) => <span className="font-semibold text-text-primary">{row.stock}</span> },
    { key: "stockMin", label: "Mínimo" },
    { key: "status", label: "Estado", render: (row) => <StatusBadge status={row.status} /> },
  ];

  const movimientoColumns = [
    { key: "fecha", label: "Fecha", render: (row) => formatFecha(row.fecha) },
    { key: "motivo", label: "Motivo", render: (row) => row.motivo || "" },
    { key: "tipo", label: "Tipo", render: (row) => <StatusBadge status={row.badge} label={row.tipoLabel} /> },
    {
      key: "cantidad",
      label: "Cant.",
      render: (row) => (
        <span className={`font-semibold ${row.cantidadMostrada.startsWith("+") ? "text-success" : "text-error"}`}>
          {row.cantidadMostrada}
        </span>
      ),
    },
    { key: "realizadoPor", label: "Realizado por" },
  ];

  return (
    <>

      <div className="space-y-4 rounded-2xl border border-gray-200 bg-surface p-4">

        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-text-secondary">Período de movimientos</label>
            <div className="flex items-center gap-2">
              <Input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} />
              <span className="text-text-secondary">a</span>
              <Input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} />
            </div>
          </div>
          {!branchLocked && (
            <SelectFilter label="Sucursal" value={branchId} onChange={setBranchId} placeholder="Todas" options={branchOptions} />
          )}
          <SelectFilter label="Categoría" value={category} onChange={setCategory} placeholder="Todas" options={categoryOptions} />
          <SelectFilter label="Estado" value={estado} onChange={setEstado} placeholder="Todos" options={ESTADO_OPTIONS} />
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

        <ChartContainer title="Existencias" subtitle="Stock actual por producto y sucursal." align="start">
          <DataTable columns={existenciaColumns} data={existenciaRows} emptyMessage="Sin productos que coincidan con los filtros." pageSize={8} />
        </ChartContainer>

        <ChartContainer title="Movimientos de inventario" subtitle="Entradas, salidas y ajustes de un producto." align="start">
          <div className="space-y-3">
            <SelectFilter
              label="Producto"
              value={movimientoProductId}
              onChange={setMovimientoProductId}
              placeholder="Elige un producto para ver su historial"
              options={productOptions}
            />
            {movimientoProductId ? (
              <DataTable
                columns={movimientoColumns}
                data={movimientoRows}
                emptyMessage={loadingMovimientos ? "Cargando..." : "Sin movimientos registrados en el período."}
                pageSize={8}
              />
            ) : (
              <p className="py-6 text-center text-sm text-text-secondary">
                Elige un producto para ver sus entradas, salidas y ajustes.
              </p>
            )}
          </div>
        </ChartContainer>

      </div>

    </>
  );

}
