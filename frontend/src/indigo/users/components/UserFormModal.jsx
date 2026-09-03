import { useState } from "react";

import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";

import { INDIGO_USER_ROLES } from "../constants";


const EMPTY = {
  name: "",
  username: "",
  role: "INDIGO_SALES",
  branchId: "",
};


/**
 * Alta / edicion de un usuario.
 * mode: "create" | "edit"
 */
export default function UserFormModal({
  open,
  mode = "create",
  user = null,
  branchOptions = [],
  onClose,
  onSubmit,
}) {

  // El padre remonta el modal (via prop key) al abrir / cambiar de usuario.
  const [form, setForm] = useState(
    () => (user ? { ...EMPTY, ...user } : EMPTY)
  );
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const title = mode === "edit" ? "Editar usuario" : "Nuevo usuario";


  const set = (field) => (event) => {
    const value = event?.target ? event.target.value : event;
    setForm((prev) => ({ ...prev, [field]: value }));
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "El nombre es obligatorio.";
    if (!form.username.trim()) nextErrors.username = "El usuario es obligatorio.";
    if (!form.branchId) nextErrors.branchId = "Selecciona una sucursal.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const branch = branchOptions.find(
      (option) => String(option.value) === String(form.branchId)
    );

    try {
      setSaving(true);
      await onSubmit({
        name: form.name.trim(),
        username: form.username.trim(),
        role: form.role,
        branchId: Number(form.branchId),
        branchName: branch?.label ?? "",
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };


  return (

    <Modal isOpen={open} onClose={onClose} title={title} size="lg">

      <form onSubmit={handleSubmit} className="space-y-4">

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            value={form.name}
            onChange={set("name")}
            error={errors.name}
          />
          <Input
            label="Usuario"
            value={form.username}
            onChange={set("username")}
            error={errors.username}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">

          <div className="w-full">
            <label
              htmlFor="user-role"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Rol
            </label>
            <select
              id="user-role"
              value={form.role}
              onChange={set("role")}
              className={selectClass}
            >
              {INDIGO_USER_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full">
            <label
              htmlFor="user-branch"
              className="mb-2 block text-sm font-medium text-text-primary"
            >
              Sucursal
            </label>
            <select
              id="user-branch"
              value={form.branchId}
              onChange={set("branchId")}
              className={selectClass}
            >
              <option value="">Selecciona...</option>
              {branchOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.branchId && (
              <p className="mt-1.5 text-sm text-error">{errors.branchId}</p>
            )}
          </div>

        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
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
