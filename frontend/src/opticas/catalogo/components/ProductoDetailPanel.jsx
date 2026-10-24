import { Pencil, ImageOff, Ban, RotateCcw } from "lucide-react";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import Can from "../../../shared/security/Can";
import { PRODUCT_CATEGORIES } from "../constants";


const currency = (value) => `$${Number(value ?? 0).toLocaleString("es-MX")}`;

const categoryLabel = (value) =>
  PRODUCT_CATEGORIES.find((c) => c.value === value)?.label ?? value;

// Mismo criterio que opticas/inventory/stockStatus.js (catalogo Indigo):
// agotado si es 0, bajo stock si no llega al minimo, disponible si no.
function stockStatus(stock, stockMin) {
  if (stock <= 0) return "out_of_stock";
  if (stock <= stockMin) return "low_stock";
  return "available";
}


export default function ProductoDetailPanel({ producto, branches = [], canDeactivate = false, onEdit, onDeactivate, onActivate }) {

  if (!producto) return null;

  const stockPorSucursal = branches.map((branch) => ({
    branchId: branch.id,
    branchName: branch.name,
    stock: producto.stockPorSucursal?.find((s) => s.branchId === branch.id)?.stock ?? 0,
  }));

  const maxStock = Math.max(1, ...stockPorSucursal.map((row) => row.stock));
  const totalDisponible = stockPorSucursal.reduce((sum, row) => sum + row.stock, 0);
  const valorTotal = totalDisponible * Number(producto.salePrice ?? 0);

  return (
    <div className="space-y-4">

      <div className="flex h-40 items-center justify-center overflow-hidden rounded-xl bg-background">
        {producto.imageUrl ? (
          <img src={producto.imageUrl} alt={producto.name} className="h-full w-full object-contain" />
        ) : (
          <ImageOff className="h-8 w-8 text-text-secondary" />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={producto.active ? "active" : "inactive"} label={producto.active ? "Activo" : "Inactivo"} />
        <span className="rounded-full bg-indigo-light px-2.5 py-1 text-xs font-medium text-indigo-primary">Producto</span>
      </div>

      <h3 className="text-lg font-bold text-text-primary">{producto.name}</h3>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Precio de venta</p>
        <p className="text-2xl font-bold text-text-primary">{currency(producto.salePrice)}</p>
      </div>

      <dl className="space-y-3 border-t border-gray-100 pt-4">
        <Field label="SKU o código interno" value={producto.code} />
        <Field label="Marca" value={producto.brand} />
        <Field label="Categoría" value={categoryLabel(producto.category)} />
        <Field label="Stock mínimo" value={producto.stockMin ?? 0} />
        <Field label="Descripción" value={producto.description} />
      </dl>

      {stockPorSucursal.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="mb-3 text-sm font-bold text-text-primary">Existencias por sucursal</p>

          <div className="grid grid-cols-[1fr_1.4fr_auto] gap-x-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            <span>Sucursal</span>
            <span>Stock disponible</span>
            <span className="text-right">Estado</span>
          </div>

          <div className="space-y-3">
            {stockPorSucursal.map((row) => (
              <div key={row.branchId} className="grid grid-cols-[1fr_1.4fr_auto] items-center gap-x-3">
                <span className="truncate text-sm font-medium text-indigo-primary">{row.branchName}</span>
                <div className="flex items-center gap-2">
                  <span className="w-6 text-sm font-semibold text-text-primary">{row.stock}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-indigo-primary"
                      style={{ width: `${Math.round((row.stock / maxStock) * 100)}%` }}
                    />
                  </div>
                </div>
                <StatusBadge status={stockStatus(row.stock, producto.stockMin ?? 0)} />
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-8 border-t border-gray-100 pt-3">
            <div>
              <p className="text-xs text-text-secondary">Total disponible</p>
              <p className="text-lg font-bold text-text-primary">{totalDisponible}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary">Valor total</p>
              <p className="text-lg font-bold text-text-primary">{currency(valorTotal)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Can permission="optica.catalog.update">
          <Button className="flex-1 justify-center gap-2" onClick={() => onEdit(producto)}>
            <Pencil className="h-4 w-4" />
            Editar producto
          </Button>
        </Can>

        {canDeactivate && (producto.active ? (
          <Button variant="danger" className="flex-1 justify-center gap-2" onClick={() => onDeactivate(producto)}>
            <Ban className="h-4 w-4" />
            Dar de baja
          </Button>
        ) : (
          <Button variant="outline" className="flex-1 justify-center gap-2" onClick={() => onActivate(producto)}>
            <RotateCcw className="h-4 w-4" />
            Dar de alta
          </Button>
        ))}
      </div>

    </div>
  );

}


function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-text-primary">{value || "—"}</dd>
    </div>
  );
}
