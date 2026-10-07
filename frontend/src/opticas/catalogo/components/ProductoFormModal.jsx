import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { PRODUCT_CATEGORIES, MEASUREMENT_UNITS, DEFAULT_TAX_RATE } from "../constants";


const EMPTY = {
  code: "", barcode: "", name: "", category: "", brand: "",
  description: "", salePrice: "", cost: "", tax: String(DEFAULT_TAX_RATE), unit: "pieza",
};

function crearForm(producto) {
  if (!producto) return { ...EMPTY };
  return {
    ...EMPTY,
    code: producto.code ?? "",
    barcode: producto.barcode ?? "",
    name: producto.name ?? "",
    category: producto.category ?? "",
    brand: producto.brand ?? "",
    description: producto.description ?? "",
    salePrice: producto.salePrice ?? "",
    cost: producto.cost ?? "",
    tax: producto.tax ?? DEFAULT_TAX_RATE,
    unit: producto.unit ?? "pieza",
  };
}


export default function ProductoFormModal({ open, mode = "create", producto = null, onClose, onSubmit }) {

  const [form, setForm] = useState(() => crearForm(producto));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const titles = { create: "Nuevo producto", edit: "Editar producto" };

  useEffect(() => {
    if (!open) return;
    setForm(crearForm(producto));
    setErrors({});
  }, [open, producto]);

  const set = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const code = String(form.code ?? "").trim();
    const name = String(form.name ?? "").trim();

    if (!code) nextErrors.code = "El código es obligatorio.";
    if (!name) nextErrors.name = "El nombre es obligatorio.";
    if (!form.category) nextErrors.category = "Selecciona una categoría.";
    if (form.salePrice === "" || Number(form.salePrice) < 0) nextErrors.salePrice = "Indica el precio de venta.";
    if (form.cost === "" || Number(form.cost) < 0) nextErrors.cost = "Indica el costo.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      await onSubmit({
        code,
        barcode: String(form.barcode ?? "").trim(),
        name,
        category: form.category,
        brand: String(form.brand ?? "").trim(),
        description: String(form.description ?? "").trim(),
        salePrice: Number(form.salePrice),
        cost: Number(form.cost),
        tax: Number(form.tax) || 0,
        unit: form.unit,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };


  return (
    <Modal isOpen={open} onClose={onClose} title={titles[mode]} size="lg">

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Código / SKU" value={form.code} onChange={set("code")} error={errors.code} />
          <Input label="Código de barras" value={form.barcode} onChange={set("barcode")} />
        </div>

        <Input label="Nombre" value={form.name} onChange={set("name")} error={errors.name} />

        <div className="w-full">
          <label htmlFor="prod-desc" className="mb-2 block text-sm font-medium text-text-primary">Descripción</label>
          <textarea id="prod-desc" value={form.description} onChange={set("description")} rows={2} className={`${selectClass} resize-none`} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="w-full">
            <label htmlFor="prod-category" className="mb-2 block text-sm font-medium text-text-primary">Categoría</label>
            <select id="prod-category" value={form.category} onChange={set("category")} className={selectClass}>
              <option value="">Selecciona...</option>
              {PRODUCT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            {errors.category && <p className="mt-1.5 text-sm text-error">{errors.category}</p>}
          </div>
          <Input label="Marca" value={form.brand} onChange={set("brand")} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Precio de venta" type="number" min="0" step="0.01" value={form.salePrice} onChange={set("salePrice")} error={errors.salePrice} />
          <Input label="Costo" type="number" min="0" step="0.01" value={form.cost} onChange={set("cost")} error={errors.cost} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Impuesto (%)" type="number" min="0" step="0.01" value={form.tax} onChange={set("tax")} />
          <div className="w-full">
            <label htmlFor="prod-unit" className="mb-2 block text-sm font-medium text-text-primary">Unidad de medida</label>
            <select id="prod-unit" value={form.unit} onChange={set("unit")} className={selectClass}>
              {MEASUREMENT_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </div>

      </form>
    </Modal>
  );
}


const selectClass = `
  w-full
  rounded-xl
  border
  border-gray-200
  bg-surface
  px-4
  py-3
  text-text-primary
  outline-none
  transition
  focus:border-indigo-primary
  focus:ring-2
  focus:ring-indigo-light
  disabled:cursor-not-allowed
  disabled:opacity-50
`;
