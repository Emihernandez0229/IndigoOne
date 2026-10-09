import { useState } from "react";
import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { onlyLetters, onlyDigits, alphanumericDotSpaces, isValidPhone } from "../../../shared/utils/textInput";


const ADDRESS_MAX = 50;
const NAME_MAX = 40;


function formFromBranch(branch) {
  return {
    address: branch?.address ?? "",
    phone: branch?.phone ?? "",
    managerPhone: branch?.managerPhone ?? "",
    subManager: branch?.subManager ?? "",
    subManagerPhone: branch?.subManagerPhone ?? "",
  };
}


/**
 * Edicion acotada de "Mi sucursal" para Gerente/Subgerente: solo pueden
 * tocar direccion, telefono de la sucursal, su propio telefono y los
 * datos del subgerente - nunca nombre, ubicacion ni responsable (eso es
 * exclusivo del Dueño via BranchFormModal).
 */
export default function MyBranchEditModal({ open, branch, onClose, onSubmit }) {

  const [form, setForm] = useState(() => formFromBranch(branch));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadedBranch, setLoadedBranch] = useState(branch);

  if (open && branch !== loadedBranch) {
    setLoadedBranch(branch);
    setForm(formFromBranch(branch));
    setErrors({});
  }

  const set = (field, transform) => (event) => {
    const raw = event?.target ? event.target.value : event;
    const value = transform ? transform(raw ?? "") : raw;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const address = form.address.trim();
    const phone = form.phone.trim();
    const managerPhone = form.managerPhone.trim();
    const subManager = form.subManager.trim();
    const subManagerPhone = form.subManagerPhone.trim();

    const nextErrors = {};

    if (!address) nextErrors.address = "La dirección es obligatoria.";
    if (!isValidPhone(phone)) nextErrors.phone = "Escribe un teléfono válido de 10 dígitos.";
    if (managerPhone && !isValidPhone(managerPhone)) nextErrors.managerPhone = "El teléfono debe tener 10 dígitos.";
    if (subManagerPhone && !isValidPhone(subManagerPhone)) nextErrors.subManagerPhone = "El teléfono debe tener 10 dígitos.";
    if (subManager && !subManagerPhone) nextErrors.subManagerPhone = "Escribe el teléfono del subgerente.";
    if (subManagerPhone && !subManager) nextErrors.subManager = "Escribe el nombre del subgerente.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      await onSubmit({ address, phone, managerPhone, subManager, subManagerPhone });
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Teléfono de la sucursal"
            value={form.phone}
            onChange={set("phone", (v) => onlyDigits(v, 10))}
            error={errors.phone}
          />
          <Input
            label="Tu teléfono (gerente)"
            value={form.managerPhone}
            onChange={set("managerPhone", (v) => onlyDigits(v, 10))}
            error={errors.managerPhone}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre del subgerente"
            value={form.subManager}
            onChange={set("subManager", (v) => onlyLetters(v, NAME_MAX))}
            error={errors.subManager}
          />
          <Input
            label="Teléfono del subgerente"
            value={form.subManagerPhone}
            onChange={set("subManagerPhone", (v) => onlyDigits(v, 10))}
            error={errors.subManagerPhone}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </div>

      </form>

    </Modal>
  );

}
