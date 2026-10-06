import { useMemo, useState } from "react";

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

import useProductos from "./hooks/useProductos";
import useServicios from "./hooks/useServicios";
import { PRODUCT_CATEGORIES, SERVICE_CATEGORIES, CATALOG_STATUSES } from "./constants";
import ProductoTable from "./components/ProductoTable";
import ProductoFormModal from "./components/ProductoFormModal";
import ServicioTable from "./components/ServicioTable";
import ServicioFormModal from "./components/ServicioFormModal";


function withDisplayIds(list) {
  return list.map((row, index) => ({ ...row, displayId: index + 1 }));
}


export default function CatalogoPage() {

  const { can } = usePermissions();
  const canManage = can("optica.catalog.update");

  const [tab, setTab] = useState("productos");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");

  const productosHook = useProductos();
  const serviciosHook = useServicios();

  const [productModal, setProductModal] = useState({ open: false, mode: "create", producto: null });
  const [serviceModal, setServiceModal] = useState({ open: false, mode: "create", servicio: null });
  const [toDeactivate, setToDeactivate] = useState(null);

  const productos = withDisplayIds(productosHook.productos);
  const servicios = withDisplayIds(serviciosHook.servicios);

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
      return [
        { id: "total", type: "products", title: "Total de productos", value: String(productos.length), description: "En el catálogo" },
        { id: "active", type: "available", title: "Activos", value: String(productos.filter((p) => p.active).length), description: "Disponibles para vender" },
      ];
    }
    return [
      { id: "total", type: "orders", title: "Total de servicios", value: String(servicios.length), description: "En el catálogo" },
      { id: "active", type: "available", title: "Activos", value: String(servicios.filter((s) => s.active).length), description: "Disponibles para ofrecer" },
    ];
  }, [tab, productos, servicios]);

  const categoryOptions = tab === "productos" ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES;

  const handleTabChange = (value) => {
    setTab(value);
    setCategory("");
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

      <div className="space-y-6">

        <div className="inline-flex rounded-xl bg-background p-1">
          <button
            type="button"
            onClick={() => handleTabChange("productos")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "productos" ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary"
            }`}
          >
            Productos
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("servicios")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === "servicios" ? "bg-surface text-text-primary shadow-sm" : "text-text-secondary"
            }`}
          >
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
        </FilterBar>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState />
        ) : tab === "productos" ? (
          <ProductoTable
            productos={filteredProductos}
            canEdit={canManage}
            canDeactivate={can("optica.catalog.deactivate")}
            onEdit={(producto) => setProductModal({ open: true, mode: "edit", producto })}
            onDeactivate={(producto) => setToDeactivate({ type: "producto", item: producto })}
            onActivate={(producto) => productosHook.activate(producto.id)}
          />
        ) : (
          <ServicioTable
            servicios={filteredServicios}
            canEdit={canManage}
            canDeactivate={can("optica.catalog.deactivate")}
            onEdit={(servicio) => setServiceModal({ open: true, mode: "edit", servicio })}
            onDeactivate={(servicio) => setToDeactivate({ type: "servicio", item: servicio })}
            onActivate={(servicio) => serviciosHook.activate(servicio.id)}
          />
        )}

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

      <ConfirmDialog
        open={Boolean(toDeactivate)}
        title={toDeactivate?.item?.active ? "Dar de baja" : "Dar de baja"}
        description={
          toDeactivate &&
          `¿Seguro que quieres dar de baja "${toDeactivate.item.name}"? Podrás volver a activarlo después.`
        }
        confirmLabel="Dar de baja"
        variant="danger"
        onConfirm={() =>
          toDeactivate.type === "producto"
            ? productosHook.deactivate(toDeactivate.item.id)
            : serviciosHook.deactivate(toDeactivate.item.id)
        }
        onClose={() => setToDeactivate(null)}
      />

    </PageContainer>

  );

}
