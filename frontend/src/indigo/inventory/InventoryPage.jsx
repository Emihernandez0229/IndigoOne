import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import Can from "../../shared/security/Can";
import usePermissions from "../../shared/hooks/usePermissions";

import useInventory from "./hooks/useInventory";
import { filterInventory } from "./filterInventory";
import { getStockStatus } from "./stockStatus";
import InventoryTable from "./components/InventoryTable";
import InventoryFormModal from "./components/InventoryFormModal";
import { PRODUCT_TYPES, ALL_MATERIALS, MATERIALS_BY_TYPE, INVENTORY_STATUSES } from "./constants";


export default function InventoryPage() {

  const navigate = useNavigate();
  const { can } = usePermissions();
  const { items, loading, error, create, update, deactivate, activate } = useInventory();

  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [material, setMaterial] = useState("");
  const [status, setStatus] = useState("");
  const [branch, setBranch] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "create", item: null });
  const [itemToDeactivate, setItemToDeactivate] = useState(null);


  const materialOptions = type ? (MATERIALS_BY_TYPE[type] ?? []) : ALL_MATERIALS;

  const handleTypeChange = (value) => {
    setType(value);
    const allowed = value ? MATERIALS_BY_TYPE[value] ?? [] : null;
    if (allowed && material && !allowed.some((option) => option.value === material)) {
      setMaterial("");
    }
  };


  const branchOptions = useMemo(() => {
    const map = new Map();
    items.forEach((item) => {
      if (item.branchId != null && !map.has(item.branchId)) {
        map.set(item.branchId, { value: item.branchId, label: item.branchName });
      }
    });
    return [...map.values()];
  }, [items]);


  const filtered = useMemo(
    () => filterInventory(items, { query, type, material, status, branch }),
    [items, query, type, material, status, branch]
  );


  const kpis = useMemo(() => {
    const active = items.filter((item) => item.active);
    const statuses = active.map(getStockStatus);

    return [
      {
        id: "total", type: "frames", title: "Total",
        value: String(items.length), description: "Productos registrados",
      },
      {
        id: "available", type: "available", title: "Disponibles",
        value: String(statuses.filter((s) => s === "available").length),
        description: "Con stock suficiente",
      },
      {
        id: "lowStock", type: "lowStock", title: "Bajo stock",
        value: String(statuses.filter((s) => s === "low_stock").length),
        description: "Cerca del mínimo",
      },
      {
        id: "outOfStock", type: "outOfStock", title: "Agotados",
        value: String(statuses.filter((s) => s === "out_of_stock").length),
        description: "Sin unidades",
      },
    ];
  }, [items]);


  const closeModal = () => setModal((m) => ({ ...m, open: false }));

  const handleSubmit = async (payload) => {
    if (modal.mode === "edit" && modal.item) {
      await update(modal.item.id, payload);
    } else {
      await create(payload);
    }
  };


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;


  return (

    <PageContainer
      title="Inventario"
      description="Productos disponibles en tu alcance."
      actions={
        <Can permission="inventory.manage">
          <Button
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() => setModal({ open: true, mode: "create", item: null })}
          >
            <Plus className="h-4 w-4" />
            Nuevo producto
          </Button>
        </Can>
      }
    >

      <div className="space-y-6">

        <KpiRow items={kpis} />

        <FilterBar>
          <SearchInput
            className="w-full sm:max-w-xs"
            value={query}
            onChange={setQuery}
            placeholder="Buscar por código o modelo"
          />
          <SelectFilter
            label="Tipo"
            value={type}
            onChange={handleTypeChange}
            placeholder="Todos los tipos"
            options={PRODUCT_TYPES}
          />
          <SelectFilter
            label="Material"
            value={material}
            onChange={setMaterial}
            placeholder="Todos los materiales"
            options={materialOptions}
          />
          <SelectFilter
            label="Estado"
            value={status}
            onChange={setStatus}
            placeholder="Todos los estados"
            options={INVENTORY_STATUSES}
          />
          {branchOptions.length > 1 && (
            <SelectFilter
              label="Sucursal"
              value={branch}
              onChange={setBranch}
              placeholder="Todas las sucursales"
              options={branchOptions}
            />
          )}
        </FilterBar>

        <InventoryTable
          items={filtered}
          canEdit={can("inventory.manage")}
          canDeactivate={can("inventory.manage")}
          onView={(item) => navigate(`/indigo/inventario/${item.id}`)}
          onEdit={(item) => setModal({ open: true, mode: "edit", item })}
          onDeactivate={(item) => setItemToDeactivate(item)}
          onActivate={(item) => activate(item.id)}
        />

      </div>

      <InventoryFormModal
        key={`${modal.mode}-${modal.item?.id ?? "new"}-${modal.open}`}
        open={modal.open}
        mode={modal.mode}
        item={modal.item}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(itemToDeactivate)}
        title="Dar de baja producto"
        description={
          itemToDeactivate &&
          `¿Seguro que quieres dar de baja "${itemToDeactivate.model}" (${itemToDeactivate.code})? Podrás volver a activarlo después.`
        }
        confirmLabel="Dar de baja"
        variant="danger"
        onConfirm={() => deactivate(itemToDeactivate.id)}
        onClose={() => setItemToDeactivate(null)}
      />

    </PageContainer>

  );

}
