import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ImageOff } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import Button from "../../shared/components/Button";
import StatusBadge from "../../shared/components/StatusBadge";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import EmptyState from "../../shared/components/EmptyState";

import useInventory from "./hooks/useInventory";
import { filterInventory } from "./filterInventory";
import { getStockStatus } from "./stockStatus";
import { PRODUCT_TYPES, LENS_TREATMENTS } from "./constants";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;


/**
 * El Dueño y el Jefe de sucursal no administran su propio inventario aquí:
 * consultan el catálogo de Indigo (su proveedor) para ver qué productos hay
 * y cuánto hay disponible - de solo lectura, sin alta/edición/baja ni
 * "agregar al pedido", solo "Ver más" por producto.
 */
export default function InventoryPage() {

  const navigate = useNavigate();
  const { items, loading, error } = useInventory();

  const activeItems = useMemo(() => items.filter((i) => i.active), [items]);

  const categories = useMemo(() => {
    return PRODUCT_TYPES
      .map((c) => ({ ...c, count: activeItems.filter((i) => i.type === c.value).length }))
      .filter((c) => c.count > 0);
  }, [activeItems]);

  const [type, setType] = useState("");
  const [query, setQuery] = useState("");

  const activeType = categories.some((c) => c.value === type) ? type : (categories[0]?.value ?? "");

  const scoped = useMemo(
    () => activeItems.filter((i) => i.type === activeType),
    [activeItems, activeType]
  );

  const filtered = useMemo(() => filterInventory(scoped, { query }), [scoped, query]);

  const handleView = (item) => navigate(`/opticas/inventario/${item.id}`);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer
      title="Catálogo Indigo"
      description="Consulta lo que Indigo tiene disponible."
    >

      <div className="space-y-6">

        {categories.length === 0 ? (
          <EmptyState
            title="Sin productos disponibles"
            description="Indigo todavía no tiene productos publicados en el catálogo."
          />
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setType(c.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeType === c.value
                      ? "bg-indigo-primary text-white"
                      : "border border-gray-200 bg-surface text-text-secondary hover:border-indigo-primary"
                  }`}
                >
                  {c.label} {c.count}
                </button>
              ))}
            </div>

            {activeType === "micas" ? (
              <MicasView items={filtered} query={query} onQueryChange={setQuery} onView={handleView} />
            ) : (
              <CatalogGrid items={filtered} query={query} onQueryChange={setQuery} onView={handleView} />
            )}
          </>
        )}

      </div>

    </PageContainer>

  );

}


function SearchBar({ query, onQueryChange }) {
  return (
    <div className="relative max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
      <input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Nombre, modelo o código..."
        className="w-full rounded-xl border border-gray-200 bg-surface py-3 pl-9 pr-4 text-text-primary outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
      />
    </div>
  );
}


function CatalogGrid({ items, query, onQueryChange, onView }) {
  return (
    <div className="space-y-4">

      <SearchBar query={query} onQueryChange={onQueryChange} />

      <p className="text-sm font-semibold text-indigo-primary">
        {items.length} producto{items.length === 1 ? "" : "s"}
      </p>

      {items.length === 0 ? (
        <EmptyState title="Sin resultados" description="No encontramos productos que coincidan con la búsqueda." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.id} item={item} onView={onView} />
          ))}
        </div>
      )}

    </div>
  );
}


function ProductCard({ item, onView }) {

  const status = getStockStatus(item);
  const photo = item.photos?.[0];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-surface">

      <div className="flex h-36 items-center justify-center bg-background">
        {photo ? (
          <img src={photo} alt={item.model} className="h-full w-full object-cover" />
        ) : (
          <ImageOff className="h-8 w-8 text-text-secondary" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">

        <div>
          <p className="text-xs text-text-secondary">{item.code}</p>
          <p className="font-bold text-text-primary">{item.model}</p>
          <p className="text-xs text-text-secondary">
            {[item.material, item.measurements].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2">
          <p className="text-lg font-bold text-text-primary">{currency(item.cost)}</p>
          <StatusBadge status={status} />
        </div>

        <Button className="w-full justify-center" onClick={() => onView(item)}>Ver más</Button>

      </div>

    </div>
  );
}


function MicasView({ items, query, onQueryChange, onView }) {
  return (
    <div className="space-y-4">

      <SearchBar query={query} onQueryChange={onQueryChange} />

      <div className="rounded-2xl border border-gray-200 bg-surface p-5">
        <p className="mb-3 text-sm font-bold text-text-primary">Tratamientos disponibles</p>
        <div className="flex flex-wrap gap-2">
          {LENS_TREATMENTS.map((treatment) => (
            <span
              key={treatment}
              className="rounded-full border border-indigo-light bg-indigo-light/40 px-3 py-1.5 text-xs font-medium text-indigo-primary"
            >
              {treatment}
            </span>
          ))}
        </div>
      </div>

      <p className="text-sm font-semibold text-indigo-primary">
        {items.length} producto{items.length === 1 ? "" : "s"}
      </p>

      {items.length === 0 ? (
        <EmptyState title="Sin micas disponibles" description="No encontramos micas que coincidan con la búsqueda." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.id} item={item} onView={onView} />
          ))}
        </div>
      )}

    </div>
  );
}
