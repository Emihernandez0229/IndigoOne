import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { onlyLetters, onlyDigits, alphanumericDash } from "../../../shared/utils/textInput";
import { PRODUCT_CATEGORIES } from "../constants";


const CODE_MAX = 10;
const NAME_MAX = 40;
const BRAND_MAX = 20;
const NUMBER_MAX = 3;

const EMPTY = {
  code: "", name: "", category: "", brand: "",
  description: "", salePrice: "", stockMin: "",
};

function crearForm(producto) {
  if (!producto) return { ...EMPTY };
  return {
    ...EMPTY,
    code: producto.code ?? "",
    name: producto.name ?? "",
    category: producto.category ?? "",
    brand: producto.brand ?? "",
    description: producto.description ?? "",
    salePrice: producto.salePrice ?? "",
    stockMin: producto.stockMin ?? "",
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

  const set = (field, transform) => (event) => {
    const raw = event.target.value;
    const value = transform ? transform(raw) : raw;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    const code = String(form.code ?? "").trim();
    const name = String(form.name ?? "").trim();

    if (!code) nextErrors.code = "El SKU es obligatorio.";
    if (!name) nextErrors.name = "El nombre es obligatorio.";
    if (!form.category) nextErrors.category = "Selecciona una categoría.";
    if (form.salePrice === "" || Number(form.salePrice) < 0) nextErrors.salePrice = "Indica el precio de venta.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      await onSubmit({
        code,
        name,
        category: form.category,
        brand: String(form.brand ?? "").trim(),
        description: String(form.description ?? "").trim(),
        salePrice: Number(form.salePrice),
        stockMin: form.stockMin === "" ? 0 : Number(form.stockMin),
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
          <Input label="SKU" value={form.code} onChange={set("code", (v) => alphanumericDash(v, CODE_MAX))} error={errors.code} />
          <Input label="Nombre" value={form.name} onChange={set("name", (v) => onlyLetters(v, NAME_MAX))} error={errors.name} />
        </div>

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
          <Input label="Marca" value={form.brand} onChange={set("brand", (v) => onlyLetters(v, BRAND_MAX))} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Precio de venta" value={form.salePrice} onChange={set("salePrice", (v) => onlyDigits(v, NUMBER_MAX))} error={errors.salePrice} placeholder="Máx. 999" />
          <Input label="Stock mínimo" value={form.stockMin} onChange={set("stockMin", (v) => onlyDigits(v, NUMBER_MAX))} placeholder="Máx. 999" />
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
