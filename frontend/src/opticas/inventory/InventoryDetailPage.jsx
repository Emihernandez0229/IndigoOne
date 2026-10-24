import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import { ArrowLeft, ImageOff, ChevronLeft, ChevronRight } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import EmptyState from "../../shared/components/EmptyState";
import StatusBadge from "../../shared/components/StatusBadge";
import Button from "../../shared/components/Button";

import useInventory from "./hooks/useInventory";
import { getStockStatus } from "./stockStatus";
import { PRODUCT_TYPES, GENDERS } from "./constants";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

const labelFrom = (options, value) =>
  options.find((option) => option.value === value)?.label ?? value ?? "—";

// "56-17-140" -> calibre/puente/varilla en mm, como vienen las medidas de
// un armazón. Si no coincide (micas, estuches, etc.) no se descompone.
function parseFrameMeasurements(measurements) {
  const match = /^(\d+)-(\d+)-(\d+)$/.exec((measurements ?? "").trim());
  if (!match) return null;
  return { calibre: match[1], puente: match[2], varilla: match[3] };
}


/**
 * Ficha de un producto del catálogo de Indigo - duplicado 1:1 de la ficha
 * de producto del inventario del Jefe de sucursal (Gerente) de Indigo:
 * misma tarjeta "Información general", mismo carrusel de fotos. Igual
 * para Dueño y Jefe de sucursal de la óptica - sin la tabla de
 * existencias por sucursal (solo la tiene el Dueño de Indigo en su propio
 * módulo, no aplica aquí). Sin "Agregar al pedido".
 */
export default function InventoryDetailPage() {

  const { id } = useParams();
  const navigate = useNavigate();
  const { items, loading, error } = useInventory();

  const [activePhoto, setActivePhoto] = useState(0);
  const [loadedId, setLoadedId] = useState(id);
  if (id !== loadedId) {
    setLoadedId(id);
    setActivePhoto(0);
  }

  const item = useMemo(
    () => items.find((row) => String(row.id) === String(id)),
    [items, id]
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  if (!item) {
    return (
      <PageContainer title="Producto" description="">
        <EmptyState
          title="No encontramos este producto"
          description="Puede que Indigo ya no lo tenga disponible en el catálogo."
        />
        <div className="mt-4">
          <Link to="/opticas/inventario" className="text-sm font-medium text-indigo-primary">
            ← Volver al catálogo
          </Link>
        </div>
      </PageContainer>
    );
  }

  const photos = (Array.isArray(item.photos) ? item.photos : []).slice(0, 2);
  const status = getStockStatus(item);
  const frameSize = parseFrameMeasurements(item.measurements);


  return (

    <PageContainer
      title={item.model}
      description={`Código ${item.code}`}
      actions={
        <Button variant="outline" className="inline-flex items-center gap-2 py-2.5 text-sm" onClick={() => navigate("/opticas/inventario")}>
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      }
    >

      <div className="grid gap-6 lg:grid-cols-2">

        {/* FOTOS */}
        <div className="rounded-2xl border border-gray-200 bg-surface p-4">
          {photos.length > 0 ? (
            <div className="relative">
              <img
                src={photos[activePhoto]}
                alt={`${item.model} ${activePhoto + 1}`}
                className="aspect-[16/9] w-full rounded-xl object-cover"
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setActivePhoto((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition hover:bg-black/70"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePhoto((i) => (i + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 text-white transition hover:bg-black/70"
                    aria-label="Siguiente foto"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-2 rounded-xl bg-background text-text-secondary">
              <ImageOff className="h-8 w-8" />
              <span className="text-sm">Sin fotos</span>
            </div>
          )}
        </div>

        {/* INFORMACION GENERAL */}
        <div className="rounded-2xl border border-gray-200 bg-surface p-6">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">Información general</h2>
            <StatusBadge status={status} />
          </div>

          <div className="mb-5">
            <p className="text-3xl font-bold text-text-primary">{currency(item.cost)}</p>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
            <Field label="Nombre del producto" value={item.model} />
            <Field label="Código" value={item.code} />
            <Field label="Tipo" value={labelFrom(PRODUCT_TYPES, item.type)} />
            <Field label="Material" value={item.material} />
            <Field label="Color" value={item.color} />
            <Field label="Género" value={labelFrom(GENDERS, item.gender)} />
            <Field label="Medidas" value={item.measurements} />
            <Field label="Stock disponible" value={item.stockAvailable} />
          </dl>

          {frameSize && (
            <div className="mt-5 grid grid-cols-3 gap-3">
              <MeasurementBox label="Calibre (mm)" value={frameSize.calibre} />
              <MeasurementBox label="Puente (mm)" value={frameSize.puente} />
              <MeasurementBox label="Varilla (mm)" value={frameSize.varilla} />
            </div>
          )}

          {item.description && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-1 text-sm font-medium text-text-secondary">Descripción</p>
              <p className="text-sm text-text-primary">{item.description}</p>
            </div>
          )}

        </div>

      </div>

    </PageContainer>

  );

}


function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm text-text-primary">{value || "—"}</dd>
    </div>
  );
}


function MeasurementBox({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-background py-3 text-center">
      <p className="text-lg font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  );
}
