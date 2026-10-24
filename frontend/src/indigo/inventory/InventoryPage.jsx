import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import SearchInput from "../../shared/components/SearchInput";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import DonutChart from "../../shared/charts/DonutChart";
import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import useInventory from "./hooks/useInventory";
import useBranches from "../branches/hooks/useBranches";
import { filterInventory } from "./filterInventory";
import { getStockStatus } from "./stockStatus";
import InventoryTable from "./components/InventoryTable";
import BranchValueList from "./components/BranchValueList";
import { PRODUCT_TYPES, INVENTORY_STATUSES } from "./constants";


const CATEGORY_COLORS = {
  armazones: "#5565C8",
  micas: "#A855F7",
  accesorios: "#F59E0B",
  estuches: "#22A06B",
  otros: "#9CA3AF",
};


const BRANCH_SCOPED_ROLES = [ROLES.INDIGO_GERENTE_SUCURSAL, ROLES.INDIGO_SUBGERENTE, ROLES.INDIGO_EMPLEADO_VENTAS];


export default function InventoryPage() {

  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { items, loading: loadingItems, error: errorItems } = useInventory();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();

  const isBranchScoped = BRANCH_SCOPED_ROLES.includes(currentUser?.role);

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  const scopedItems = useMemo(
    () => (isBranchScoped ? items.filter((i) => i.branchId === myBranch?.id) : items),
    [items, isBranchScoped, myBranch]
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [branch, setBranch] = useState("");

  const branchOptions = useMemo(
    () => branches.map((b) => ({ value: b.id, label: b.name })),
    [branches]
  );

  const filtered = useMemo(
    () => filterInventory(scopedItems, { query, type: category, status, branch }),
    [scopedItems, query, category, status, branch]
  );

  const activeItems = useMemo(() => scopedItems.filter((i) => i.active), [scopedItems]);

  const kpis = useMemo(() => {
    const totalPieces = activeItems.reduce((sum, i) => sum + Number(i.stockAvailable ?? 0), 0);
    const totalValue = activeItems.reduce((sum, i) => sum + Number(i.stockAvailable ?? 0) * Number(i.cost ?? 0), 0);
    const statuses = activeItems.map(getStockStatus);
    const branchCount = new Set(activeItems.map((i) => i.branchId)).size;

    return [
      {
        id: "available", type: "products", title: "Productos disponibles", color: "purple",
        value: totalPieces.toLocaleString("es-MX"),
        description: isBranchScoped ? "Piezas en tu sucursal" : `Piezas en ${branchCount} sucursales`,
      },
      {
        id: "value", type: "revenue", title: "Valor total del inventario", color: "green",
        value: `$${totalValue.toLocaleString("es-MX")}`, description: "MXN",
      },
      {
        id: "lowStock", type: "lowStock", title: "Productos con stock bajo", color: "orange",
        value: String(statuses.filter((s) => s === "low_stock").length), description: "Menos de 10 piezas",
      },
      {
        id: "outOfStock", type: "outOfStock", title: "Productos agotados", color: "red",
        value: String(statuses.filter((s) => s === "out_of_stock").length), description: "Sin existencia",
      },
    ];
  }, [activeItems, isBranchScoped]);

  const valueByBranch = useMemo(() => {
    return branches
      .map((b) => ({
        id: b.id,
        name: b.name,
        value: activeItems
          .filter((i) => i.branchId === b.id)
          .reduce((sum, i) => sum + Number(i.stockAvailable ?? 0) * Number(i.cost ?? 0), 0),
      }))
      .sort((a, b) => b.value - a.value);
  }, [branches, activeItems]);

  const byCategory = useMemo(() => {
    const totals = new Map();
    activeItems.forEach((i) => {
      totals.set(i.type, (totals.get(i.type) ?? 0) + Number(i.stockAvailable ?? 0));
    });
    return PRODUCT_TYPES
      .map((c) => ({ label: c.label, value: totals.get(c.value) ?? 0, color: CATEGORY_COLORS[c.value] }))
      .filter((c) => c.value > 0);
  }, [activeItems]);

  // Para Gerente/Subgerente (una sola sucursal) "Valor por sucursal" no
  // aporta nada, asi que se reemplaza por "Valor por categoria".
  const valueByCategory = useMemo(() => {
    return PRODUCT_TYPES
      .map((c) => ({
        id: c.value,
        name: c.label,
        value: activeItems
          .filter((i) => i.type === c.value)
          .reduce((sum, i) => sum + Number(i.stockAvailable ?? 0) * Number(i.cost ?? 0), 0),
      }))
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [activeItems]);

  const loading = loadingItems || loadingBranches;
  const error = errorItems || errorBranches;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer
      title="Inventario"
      description={
        isBranchScoped
          ? "Consulta los productos, existencias y valor del inventario de tu sucursal."
          : "Consulta los productos, existencias y valor del inventario de todas las sucursales."
      }
    >

      <div className="flex items-start gap-6">

        <div className="min-w-0 flex-1 space-y-6">

          <KpiRow items={kpis} />

          <FilterBar>
            <SearchInput
              className="w-full sm:max-w-xs"
              value={query}
              onChange={setQuery}
              placeholder="Buscar por nombre o código..."
            />
            {!isBranchScoped && (
              <SelectFilter
                label="Sucursal"
                value={branch}
                onChange={setBranch}
                placeholder="Todas"
                options={branchOptions}
              />
            )}
            <SelectFilter
              label="Categoría"
              value={category}
              onChange={setCategory}
              placeholder="Todas"
              options={PRODUCT_TYPES}
            />
            <SelectFilter
              label="Estado"
              value={status}
              onChange={setStatus}
              placeholder="Todos"
              options={INVENTORY_STATUSES}
            />
          </FilterBar>

          <InventoryTable
            items={filtered}
            onView={(item) => navigate(`/indigo/inventario/${item.id}`)}
          />

        </div>

        <div className="w-full max-w-sm shrink-0 space-y-6">

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <h3 className="mb-4 text-base font-bold text-text-primary">
              {isBranchScoped ? "Valor por categoría" : "Valor por sucursal"}
            </h3>
            <BranchValueList branches={isBranchScoped ? valueByCategory : valueByBranch} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <h3 className="mb-4 text-base font-bold text-text-primary">Inventario por categoría</h3>
            <DonutChart data={byCategory} centerLabel="Piezas" />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            {isBranchScoped
              ? "Las cantidades y valores provienen de los registros reales de tu sucursal."
              : "Las cantidades y valores provienen de los registros reales de cada sucursal. La actualización del inventario corresponde a los gerentes."}
          </div>

        </div>

      </div>

    </PageContainer>
  );
}
