import { useState } from "react";

import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

import { BRANCH_STATUSES } from "../constants";


const EMPTY = {
  name: "",
  address: "",
  manager: "",
  phone: "",
  products: 0,
  staff: 0,
  status: "active",
};


/**
 * Alta / edicion / vista de una sucursal.
 * mode: "create" | "edit" | "view"
 */
export default function BranchFormModal({
  open,
  mode = "create",
  branch = null,
  onClose,
  onSubmit,
}) {


  const [form, setForm] = useState(
    () => (branch ? { ...EMPTY, ...branch } : EMPTY)
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const readOnly = mode === "view";

  const titles = {
    create: "Nueva sucursal",
    edit: "Editar sucursal",
    view: "Detalle de sucursal",
  };


  const set = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, [field]: value }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "El nombre es obligatorio.";
    if (!form.address.trim()) nextErrors.address = "La dirección es obligatoria.";
    if (!form.manager.trim()) nextErrors.manager = "El responsable es obligatorio.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      await onSubmit({
        name: form.name.trim(),
        address: form.address.trim(),
        manager: form.manager.trim(),
        phone: form.phone.trim(),
        products: Number(form.products) || 0,
        staff: Number(form.staff) || 0,
        status: form.status,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };


  return (

    <Modal isOpen={open} onClose={onClose} title={titles[mode]} size="lg">

      <form onSubmit={handleSubmit} className="space-y-4">

        <Input
          label="Nombre de sucursal"
          value={form.name}
          onChange={set("name")}
          error={errors.name}
          disabled={readOnly}
        />

        <Input
          label="Dirección"
          value={form.address}
          onChange={set("address")}
          error={errors.address}
          disabled={readOnly}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Responsable"
            value={form.manager}
            onChange={set("manager")}
            error={errors.manager}
            disabled={readOnly}
          />
          <Input
            label="Teléfono"
            value={form.phone}
            onChange={set("phone")}
            disabled={readOnly}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Productos"
            type="number"
            min="0"
            value={form.products}
            onChange={set("products")}
            disabled={readOnly}
          />
          <Input
            label="Personal"
            type="number"
            min="0"
            value={form.staff}
            onChange={set("staff")}
            disabled={readOnly}
          />
          <div className="w-full">
            <label
              htmlFor="branch-status"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Estado
            </label>
            <select
              id="branch-status"
              value={form.status}
              onChange={set("status")}
              disabled={readOnly}
              className="
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
              "
            >
              {BRANCH_STATUSES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {readOnly ? "Cerrar" : "Cancelar"}
          </Button>
          {!readOnly && (
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          )}
        </div>

      </form>

    </Modal>

  );

}
