import { useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { alphanumericDotSpaces, onlyDigits, isValidPhone } from "../../../shared/utils/textInput";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";


const ADDRESS_MAX = 50;


function formFromBranch(branch) {
  return {
    address: branch?.address ?? "",
    phone: branch?.phone ?? "",
  };
}


/**
 * Edicion acotada de "Mi sucursal" para el Encargado: solo puede tocar
 * direccion y telefono - nunca nombre, ubicacion ni responsable (eso es
 * exclusivo del Dueño via BranchFormModal). Mismo patron que
 * MyBranchEditModal de Indigo.
 */
export default function MyBranchEditModal({ open, branch, onClose, onSubmit }) {

  const [form, setForm] = useState(() => formFromBranch(branch));
  const { errors, validate, clearError, resetErrors } = useFormValidation();
  const [saving, setSaving] = useState(false);
  const [loadedBranch, setLoadedBranch] = useState(branch);

  if (open && branch !== loadedBranch) {
    setLoadedBranch(branch);
    setForm(formFromBranch(branch));
    resetErrors();
  }

  const set = (field, transform) => (event) => {
    const raw = event?.target ? event.target.value : event;
    const value = transform ? transform(raw ?? "") : raw;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    clearError(field);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const address = form.address.trim();
    const phone = form.phone.trim();

    const isValid = validate([
      ["address", !address, "La dirección es obligatoria."],
      ["phone", !isValidPhone(phone), "Escribe un teléfono válido de 10 dígitos."],
    ]);
    if (!isValid) return;

    try {
      setSaving(true);
      await onSubmit({ address, phone });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Editar información de la sucursal" size="md">

      <form onSubmit={handleSubmit} className="space-y-4">

        <Input
          label="Dirección"
          value={form.address}
          onChange={set("address", (v) => alphanumericDotSpaces(v, ADDRESS_MAX))}
          error={errors.address}
        />

        <Input
          label="Teléfono de la sucursal"
          value={form.phone}
          onChange={set("phone", (v) => onlyDigits(v, 10))}
          error={errors.phone}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </div>

      </form>

    </Modal>
  );

}
