import { useEffect, useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Select from "../../../shared/components/Select";
import Button from "../../../shared/components/Button";
import { onlyLetters, onlyDigits, alphanumericDash } from "../../../shared/utils/textInput";
import { useCategoriasProductos } from "../hooks/useCategorias";


const CODE_MAX = 10;
const NAME_MAX = 40;
const BRAND_MAX = 20;
const NUMBER_MAX = 3;

const EMPTY = {
  code: "", name: "", categoryId: "", brand: "",
  description: "", salePrice: "", stockMin: "",
};

function crearForm(producto) {
  if (!producto) return { ...EMPTY };
  return {
    ...EMPTY,
    code: producto.code ?? "",
    name: producto.name ?? "",
    categoryId: producto.categoryId != null ? String(producto.categoryId) : "",
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
  const { categorias: categoryOptions } = useCategoriasProductos();

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
    if (!form.categoryId) nextErrors.categoryId = "Selecciona una categoría.";
    if (form.salePrice === "" || Number(form.salePrice) < 0) nextErrors.salePrice = "Indica el precio de venta.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      await onSubmit({
        code,
        name,
        categoryId: form.categoryId,
        brand: String(form.brand ?? "").trim(),
        description: String(form.description ?? "").trim(),
        salePrice: Number(form.salePrice),
        stockMin: form.stockMin === "" ? 0 : Number(form.stockMin),
      });
      onClose();
    } catch {
      setErrors((prev) => ({ ...prev, submit: "No se pudo guardar el producto. Intenta de nuevo." }));
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
            <Select id="prod-category" value={form.categoryId} onChange={set("categoryId")}>
              <option value="">Selecciona...</option>
              {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </Select>
            {errors.categoryId && <p className="mt-1.5 text-sm text-error">{errors.categoryId}</p>}
          </div>
          <Input label="Marca" value={form.brand} onChange={set("brand", (v) => onlyLetters(v, BRAND_MAX))} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Precio de venta" value={form.salePrice} onChange={set("salePrice", (v) => onlyDigits(v, NUMBER_MAX))} error={errors.salePrice} placeholder="Máx. 999" />
          <Input label="Stock mínimo" value={form.stockMin} onChange={set("stockMin", (v) => onlyDigits(v, NUMBER_MAX))} placeholder="Máx. 999" />
        </div>

        {errors.submit && <p className="text-sm text-error">{errors.submit}</p>}

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
