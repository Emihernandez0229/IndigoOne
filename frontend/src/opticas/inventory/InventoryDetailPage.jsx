import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

import { ArrowLeft, ImageOff, ChevronLeft, ChevronRight } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import EmptyState from "../../shared/components/EmptyState";
import StatusBadge from "../../shared/components/StatusBadge";
import Button from "../../shared/components/Button";
import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";

import useInventory from "./hooks/useInventory";
import { getStockStatus } from "./stockStatus";
import { PRODUCT_TYPES, GENDERS } from "./constants";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

const labelFrom = (options, value) =>
  options.find((option) => option.value === value)?.label ?? value ?? "—";


export default function InventoryDetailPage() {

  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { items, loading, error } = useInventory();

  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    setActivePhoto(0);
  }, [id]);

  const isOwner =
    currentUser?.role === ROLES.OPTICA_DUENO;

  const item = useMemo(
    () => items.find((row) => String(row.id) === String(id)),
    [items, id]
  );

  const siblings = useMemo(() => {
    if (!item) return [];
    return items.filter((row) => row.code === item.code);
  }, [items, item]);

  const totals = useMemo(() => {
    return siblings.reduce(
      (acc, row) => ({
        available: acc.available + Number(row.stockAvailable ?? 0),
        reserved: acc.reserved + Number(row.stockReserved ?? 0),
        min: acc.min + Number(row.stockMin ?? 0),
      }),
      { available: 0, reserved: 0, min: 0 }
    );
  }, [siblings]);

  const maxAvailable = Math.max(1, ...siblings.map((row) => Number(row.stockAvailable ?? 0)));


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  if (!item) {
    return (
      <PageContainer title="Producto" description="">
        <EmptyState
          title="No encontramos este producto"
          description="Puede que ya lo hayan quitado del inventario."
        />
        <div className="mt-4">
          <Link to="/opticas/inventario" className="text-sm font-medium text-indigo-primary">
            ← Volver a inventario
          </Link>
        </div>
      </PageContainer>
    );
  }

  const photos = Array.isArray(item.photos) ? item.photos : [];
  const status = getStockStatus(item);


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

      <div className="space-y-6">

        <div className="grid gap-6 lg:grid-cols-2">

          {/* FOTOS */}
          <div className="rounded-2xl border border-gray-200 bg-surface p-4">
            {photos.length > 0 ? (
              <div className="space-y-3">

                <div className="relative">
                  <img
                    src={photos[activePhoto]}
                    alt={`${item.model} ${activePhoto + 1}`}
                    className="aspect-square w-full rounded-xl object-cover"
                  />

                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActivePhoto((i) => (i - 1 + photos.length) % photos.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePhoto((i) => (i + 1) % photos.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
                        aria-label="Siguiente foto"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {photos.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {photos.map((src, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActivePhoto(index)}
                        className={`aspect-square overflow-hidden rounded-lg border-2 transition ${
                          index === activePhoto ? "border-indigo-primary" : "border-transparent"
                        }`}
                      >
                        <img
                          src={src}
                          alt={`${item.model} ${index + 1}`}
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

              </div>
            ) : (
              <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl bg-background text-text-secondary">
                <ImageOff className="h-10 w-10" />
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

            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Field label="Código" value={item.code} />
              <Field label="Modelo" value={item.model} />
              <Field label="Tipo" value={labelFrom(PRODUCT_TYPES, item.type)} />
              <Field label="Material" value={item.material} />
              <Field label="Color" value={item.color} />
              <Field label="Género" value={labelFrom(GENDERS, item.gender)} />
              <Field label="Medidas" value={item.measurements} />
              <Field label="Sucursal" value={item.branchName} />
              <Field label="Stock disponible" value={item.stockAvailable} />
              <Field label="Stock mínimo" value={item.stockMin} />
              <Field label="Costo" value={currency(item.cost)} />
            </dl>

            {item.description && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="mb-1 text-sm font-medium text-text-secondary">Descripción</p>
                <p className="text-sm text-text-primary">{item.description}</p>
              </div>
            )}

          </div>

        </div>

        {/* EXISTENCIAS POR SUCURSAL - solo dueño */}
        {isOwner && (
          <div className="rounded-2xl border border-gray-200 bg-surface p-6">

            <h2 className="mb-4 text-lg font-semibold text-text-primary">Existencias por sucursal</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wide text-text-secondary">
                    <th className="pb-3 pr-4">Sucursal</th>
                    <th className="pb-3 pr-4">Stock disponible</th>
                    <th className="pb-3 pr-4">Stock reservado</th>
                    <th className="pb-3 pr-4">Stock mínimo</th>
                    <th className="pb-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {siblings.map((row) => {
                    const rowStatus = getStockStatus(row);
                    const barColor =
                      rowStatus === "out_of_stock" ? "bg-error" :
                      rowStatus === "low_stock" ? "bg-warning" :
                      "bg-indigo-primary";
                    const textColor =
                      rowStatus === "out_of_stock" ? "text-error" :
                      rowStatus === "low_stock" ? "text-warning" :
                      "text-text-primary";
                    const width = Math.max(4, (Number(row.stockAvailable ?? 0) / maxAvailable) * 100);

                    return (
                      <tr key={row.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-3 pr-4 font-medium text-text-primary">{row.branchName}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <span className={`w-6 font-semibold ${textColor}`}>{row.stockAvailable}</span>
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${width}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-text-secondary">{row.stockReserved ?? 0}</td>
                        <td className="py-3 pr-4 text-text-secondary opacity-60">{row.stockMin}</td>
                        <td className="py-3">
                          <StatusBadge status={rowStatus} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-8 border-t border-gray-100 pt-4">
              <div>
                <p className="text-xs text-text-secondary">Total disponible</p>
                <p className="text-xl font-bold text-text-primary">{totals.available}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Total reservado</p>
                <p className="text-xl font-bold text-text-primary">{totals.reserved}</p>
              </div>
              <div>
                <p className="text-xs text-text-secondary">Stock global mín.</p>
                <p className="text-xl font-bold text-text-secondary opacity-60">{totals.min}</p>
              </div>
            </div>

          </div>
        )}

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
