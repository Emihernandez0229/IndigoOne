import { useMemo, useState } from "react";

import { Plus, Package, Wrench } from "lucide-react";

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
import usePermissions from "../../shared/hooks/usePermissions";
import useBranchScope from "../../shared/hooks/useBranchScope";
import { ROLES } from "../../shared/security/roles";

import { listBranches } from "../branches/services/branchService";
import useProductos from "./hooks/useProductos";
import useServicios from "./hooks/useServicios";
import { PRODUCT_CATEGORIES, SERVICE_CATEGORIES, CATALOG_STATUSES } from "./constants";
import ProductoTable from "./components/ProductoTable";
import ProductoFormModal from "./components/ProductoFormModal";
import ProductoDetailPanel from "./components/ProductoDetailPanel";
import ServicioTable from "./components/ServicioTable";
import ServicioFormModal from "./components/ServicioFormModal";
import ServicioDetailPanel from "./components/ServicioDetailPanel";
import StockMovementModal from "./components/StockMovementModal";


function withDisplayIds(list) {
  return list.map((row, index) => ({ ...row, displayId: index + 1 }));
}


export default function CatalogoPage() {

  const { can } = usePermissions();
  const canManage = can("optica.catalog.update");

  // El catalogo de productos y servicios es compartido (no depende de
  // sucursal: el dueno no da de alta por sucursal), pero el selector se
  // deja porque el dueno si puede consultar cuanto stock de cada producto
  // hay en cada una de sus sucursales (ver columna "Stock en sucursal" y
  // el desglose de "Sucursales" en el detalle de producto).
  const { isOwner, branches, selectedBranch, setSelectedBranch, loadingBranches } = useBranchScope({
    listBranches,
    ownerRoles: [ROLES.OPTICA_DUENO],
    alwaysLoad: true,
    autoSelectFirst: false,
  });

  const [tab, setTab] = useState("productos");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const productosHook = useProductos();
  const serviciosHook = useServicios();

  const [productModal, setProductModal] = useState({ open: false, mode: "create", producto: null });
  const [serviceModal, setServiceModal] = useState({ open: false, mode: "create", servicio: null });
  const [movementModal, setMovementModal] = useState({ open: false, producto: null });
  const [confirmAction, setConfirmAction] = useState(null);
  const [viewingId, setViewingId] = useState(null);

  // Sin sucursal elegida (Todas), el stock es la suma de todas las
  // sucursales; con una elegida, se actualiza a la de esa sucursal. El
  // Jefe de sucursal ve "active" como el de SU sucursal (dar de baja ahi
  // no afecta al resto); el Dueño sigue viendo el estado global.
  const productos = useMemo(
    () =>
      withDisplayIds(productosHook.productos).map((p) => {
        const branchEntry = p.stockPorSucursal?.find((s) => s.branchId === selectedBranch);
        return {
          ...p,
          branchStock: selectedBranch
            ? branchEntry?.stock ?? 0
            : (p.stockPorSucursal ?? []).reduce((sum, s) => sum + s.stock, 0),
          active: isOwner ? p.active : (branchEntry?.active ?? true),
        };
      }),
    [productosHook.productos, selectedBranch, isOwner]
  );
  const servicios = withDisplayIds(serviciosHook.servicios);

  // Igual que Dueño/Encargado: el Dueño edita el producto completo, el
  // Jefe de sucursal solo registra movimientos de stock de su sucursal.
  const handleEditProducto = (producto) => {
    if (isOwner) {
      setProductModal({ open: true, mode: "edit", producto });
    } else {
      setMovementModal({ open: true, producto });
    }
  };

  const viewingProducto = tab === "productos" ? productos.find((p) => p.id === viewingId) ?? null : null;
  const viewingServicio = tab === "servicios" ? servicios.find((s) => s.id === viewingId) ?? null : null;

  const filteredProductos = useMemo(() => {
    const term = query.trim().toLowerCase();
    return productos.filter((p) => {
      const matchesQuery = !term || p.name.toLowerCase().includes(term) || p.code.toLowerCase().includes(term);
      const matchesCategory = !category || p.category === category;
      const matchesStatus = !status || (status === "active" ? p.active : !p.active);
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [productos, query, category, status]);

  const filteredServicios = useMemo(() => {
    const term = query.trim().toLowerCase();
    return servicios.filter((s) => {
      const matchesQuery = !term || s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term);
      const matchesCategory = !category || s.category === category;
      const matchesStatus = !status || (status === "active" ? s.active : !s.active);
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [servicios, query, category, status]);

  const kpis = useMemo(() => {
    if (tab === "productos") {
      const valorTotal = productos.reduce((sum, p) => sum + p.branchStock * Number(p.salePrice ?? 0), 0);
      const bajoStock = productos.filter((p) => p.branchStock > 0 && p.branchStock <= (p.stockMin ?? 0)).length;
      const agotados = productos.filter((p) => p.branchStock <= 0).length;

      return [
        { id: "total", type: "products", title: "Total de productos", value: String(productos.length), description: "En el catálogo" },
        { id: "value", type: "revenue", color: "green", title: "Valor total de productos", value: `$${valorTotal.toLocaleString("es-MX")}`, description: "Al precio de venta" },
        { id: "lowStock", type: "lowStock", color: "orange", title: "Productos con stock bajo", value: String(bajoStock), description: "Por debajo del mínimo" },
        { id: "outOfStock", type: "outOfStock", color: "red", title: "Productos agotados", value: String(agotados), description: "Sin existencias" },
      ];
    }
    return [
      { id: "total", type: "orders", title: "Total de servicios", value: String(servicios.length), description: "En el catálogo" },
      { id: "active", type: "available", color: "green", title: "Servicios activos", value: String(servicios.filter((s) => s.active).length), description: "Disponibles para ofrecer" },
      { id: "inactive", type: "canceled", color: "red", title: "Servicios inactivos", value: String(servicios.filter((s) => !s.active).length), description: "Dados de baja" },
    ];
  }, [tab, productos, servicios]);

  const categoryOptions = tab === "productos" ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES;

  const handleTabChange = (value) => {
    setTab(value);
    setCategory("");
    setViewingId(null);
  };

  const handleProductSubmit = async (payload) => {
    if (productModal.mode === "edit" && productModal.producto) {
      await productosHook.update(productModal.producto.id, payload);
    } else {
      await productosHook.create(payload);
    }
  };

  const handleServiceSubmit = async (payload) => {
    if (serviceModal.mode === "edit" && serviceModal.servicio) {
      await serviciosHook.update(serviceModal.servicio.id, payload);
    } else {
      await serviciosHook.create(payload);
    }
  };

  const loading = tab === "productos" ? productosHook.loading : serviciosHook.loading;
  const error = tab === "productos" ? productosHook.error : serviciosHook.error;


  return (

    <PageContainer
      title="Productos y servicios"
      description="Catálogo de lo que tu óptica puede vender u ofrecer."
      actions={
        <Can permission="optica.catalog.create">
          <Button
            className="inline-flex items-center gap-2 py-2.5 text-sm"
            onClick={() =>
              tab === "productos"
                ? setProductModal({ open: true, mode: "create", producto: null })
                : setServiceModal({ open: true, mode: "create", servicio: null })
            }
          >
            <Plus className="h-4 w-4" />
            {tab === "productos" ? "Nuevo producto" : "Nuevo servicio"}
          </Button>
        </Can>
      }
    >

      <div className="flex items-start gap-6">

      <div className="min-w-0 flex-1 space-y-6 transition-all duration-300 ease-in-out">

        <div className="flex gap-6 border-b border-gray-200">
          <button
            type="button"
            onClick={() => handleTabChange("productos")}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition ${
              tab === "productos" ? "border-indigo-primary text-indigo-primary" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <Package className="h-4 w-4" />
            Productos
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("servicios")}
            className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition ${
              tab === "servicios" ? "border-indigo-primary text-indigo-primary" : "border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            <Wrench className="h-4 w-4" />
            Servicios
          </button>
        </div>

        <KpiRow items={kpis} />

        <FilterBar>
          <SearchInput
            className="w-full sm:max-w-xs"
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nombre o código"
          />
          <SelectFilter
            label="Categoría"
            value={category}
            onChange={setCategory}
            placeholder="Todas las categorías"
            options={categoryOptions}
          />
          <SelectFilter
            label="Estado"
            value={status}
            onChange={setStatus}
            placeholder="Todos los estados"
            options={CATALOG_STATUSES}
          />
          {tab === "productos" && isOwner && (
            <SelectFilter
              label="Sucursal"
              value={selectedBranch}
              onChange={setSelectedBranch}
              options={[{ value: "", label: "Todas las sucursales" }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
            />
          )}
        </FilterBar>

        {loading || loadingBranches ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState />
        ) : tab === "productos" ? (
          <ProductoTable
            productos={filteredProductos}
            canEdit={canManage}
            canDeactivate={can("optica.catalog.deactivate")}
            onView={(producto) => setViewingId(producto.id)}
            onEdit={handleEditProducto}
            onDeactivate={(producto) => setConfirmAction({ type: "producto", action: "deactivate", item: producto })}
            onActivate={(producto) => setConfirmAction({ type: "producto", action: "activate", item: producto })}
          />
        ) : (
          <ServicioTable
            servicios={filteredServicios}
            canEdit={canManage}
            canDeactivate={can("optica.catalog.deactivate")}
            onView={(servicio) => setViewingId(servicio.id)}
            onEdit={(servicio) => setServiceModal({ open: true, mode: "edit", servicio })}
            onDeactivate={(servicio) => setConfirmAction({ type: "servicio", action: "deactivate", item: servicio })}
            onActivate={(servicio) => setConfirmAction({ type: "servicio", action: "activate", item: servicio })}
          />
        )}

      </div>

      <SidePanel
        isOpen={tab === "productos" ? Boolean(viewingProducto) : Boolean(viewingServicio)}
        onClose={() => setViewingId(null)}
        title={tab === "productos" ? "Detalle de producto" : "Detalle de servicio"}
      >
        {tab === "productos" ? (
          <ProductoDetailPanel
            producto={viewingProducto}
            branches={isOwner ? branches : branches.filter((b) => b.id === selectedBranch)}
            canDeactivate={can("optica.catalog.deactivate")}
            onEdit={handleEditProducto}
            onDeactivate={(producto) => setConfirmAction({ type: "producto", action: "deactivate", item: producto })}
            onActivate={(producto) => setConfirmAction({ type: "producto", action: "activate", item: producto })}
          />
        ) : (
          <ServicioDetailPanel
            servicio={viewingServicio}
            canDeactivate={can("optica.catalog.deactivate")}
            onEdit={(servicio) => setServiceModal({ open: true, mode: "edit", servicio })}
            onDeactivate={(servicio) => setConfirmAction({ type: "servicio", action: "deactivate", item: servicio })}
            onActivate={(servicio) => setConfirmAction({ type: "servicio", action: "activate", item: servicio })}
          />
        )}
      </SidePanel>

      </div>

      <ProductoFormModal
        key={`prod-${productModal.mode}-${productModal.producto?.id ?? "new"}-${productModal.open}`}
        open={productModal.open}
        mode={productModal.mode}
        producto={productModal.producto}
        onClose={() => setProductModal((m) => ({ ...m, open: false }))}
        onSubmit={handleProductSubmit}
      />

      <ServicioFormModal
        key={`serv-${serviceModal.mode}-${serviceModal.servicio?.id ?? "new"}-${serviceModal.open}`}
        open={serviceModal.open}
        mode={serviceModal.mode}
        servicio={serviceModal.servicio}
        onClose={() => setServiceModal((m) => ({ ...m, open: false }))}
        onSubmit={handleServiceSubmit}
      />

      <StockMovementModal
        key={`mov-${movementModal.producto?.id ?? "none"}-${movementModal.open}`}
        open={movementModal.open}
        producto={movementModal.producto}
        branchName={branches.find((b) => b.id === selectedBranch)?.name}
        onClose={() => setMovementModal({ open: false, producto: null })}
        onSubmit={(payload) => productosHook.registerMovimiento(movementModal.producto.id, selectedBranch, payload)}
      />

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={
          confirmAction &&
          (confirmAction.action === "activate"
            ? `Dar de alta ${confirmAction.type}`
            : `Dar de baja ${confirmAction.type}`)
        }
        description={
          confirmAction &&
          (confirmAction.action === "activate"
            ? `¿Seguro que quieres dar de alta "${confirmAction.item.name}"?`
            : `¿Seguro que quieres dar de baja "${confirmAction.item.name}"? Podrás volver a activarlo después.`)
        }
        confirmLabel={confirmAction?.action === "activate" ? "Dar de alta" : "Dar de baja"}
        variant={confirmAction?.action === "activate" ? "primary" : "danger"}
        onConfirm={() => {
          // El dueño da de alta/baja el producto completo; el jefe de
          // sucursal solo afecta su propia sucursal (ver stockPorSucursal).
          if (confirmAction.type === "servicio") {
            return confirmAction.action === "activate"
              ? serviciosHook.activate(confirmAction.item.id)
              : serviciosHook.deactivate(confirmAction.item.id);
          }
          if (isOwner) {
            return confirmAction.action === "activate"
              ? productosHook.activate(confirmAction.item.id)
              : productosHook.deactivate(confirmAction.item.id);
          }
          return confirmAction.action === "activate"
            ? productosHook.activateBranch(confirmAction.item.id, selectedBranch)
            : productosHook.deactivateBranch(confirmAction.item.id, selectedBranch);
        }}
        onClose={() => setConfirmAction(null)}
      />

    </PageContainer>

  );

}
