import { useState } from "react";

import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";
import { onlyDigits, textWithSpecialChars } from "../../../shared/utils/textInput";


const MOVEMENT_TYPES = [
  { value: "entrada", label: "Entrada" },
  { value: "salida", label: "Salida" },
  { value: "ventas", label: "Ventas" },
  { value: "ajustes", label: "Ajustes" },
];

const MOTIVO_MAX = 200;
const EMPTY = { tipo: "", cantidad: "", motivo: "" };


/**
 * El Jefe de sucursal no edita los datos del producto (eso es del Dueño):
 * solo registra entradas/salidas de stock para SU sucursal. Reemplaza al
 * ProductoFormModal normal cuando quien edita no es el Dueño.
 */
export default function StockMovementModal({ open, producto, branchName, onClose, onSubmit }) {

  const [form, setForm] = useState(EMPTY);
  const { errors, validate, clearError, resetErrors } = useFormValidation();
  const [saving, setSaving] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  if (open && !wasOpen) {
    setWasOpen(true);
    setForm(EMPTY);
    resetErrors();
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  if (!open || !producto) return null;

  const set = (field, transform) => (event) => {
    const raw = event.target.value;
    const value = transform ? transform(raw) : raw;
    setForm((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isValid = validate([
      ["tipo", !form.tipo, "Selecciona un tipo de movimiento."],
      ["cantidad", !form.cantidad || Number(form.cantidad) <= 0, "Indica una cantidad mayor a 0."],
      ["motivo", !form.motivo.trim(), "El motivo es obligatorio."],
    ]);
    if (!isValid) return;

    try {
      setSaving(true);
      await onSubmit({ tipo: form.tipo, cantidad: Number(form.cantidad), motivo: form.motivo.trim() });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={`Movimiento de stock - ${producto.name}`} size="md">

      <form onSubmit={handleSubmit} className="space-y-4">

        <p className="text-sm text-text-secondary">
          Actualiza el stock de este producto en {branchName || "tu sucursal"}. No se modifican sus demás datos.
        </p>

        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">Tipo</label>
          <select value={form.tipo} onChange={set("tipo")} className={selectClass}>
            <option value="">Selecciona...</option>
            {MOVEMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {errors.tipo && <p className="mt-1.5 text-sm text-error">{errors.tipo}</p>}
        </div>

        <Input
          label="Cantidad"
          value={form.cantidad}
          onChange={set("cantidad", (v) => onlyDigits(v, 6))}
          error={errors.cantidad}
          placeholder="Máx. 999999"
        />

        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">Motivo</label>
          <textarea
            value={form.motivo}
            onChange={set("motivo", (v) => textWithSpecialChars(v, MOTIVO_MAX))}
            rows={3}
            maxLength={MOTIVO_MAX}
            className={`${selectClass} resize-none`}
          />
          <p className="mt-1 text-right text-xs text-text-secondary">{form.motivo.length}/{MOTIVO_MAX}</p>
          {errors.motivo && <p className="mt-1.5 text-sm text-error">{errors.motivo}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Registrar"}</Button>
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
`;
