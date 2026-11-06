import { useState } from "react";
import { Save, Phone, Mail, Building2, Lock, User, Briefcase, ShieldCheck } from "lucide-react";

import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import SectionTitle from "../../../shared/components/SectionTitle";
import { onlyLetters, onlyDigits, isValidPhone } from "../../../shared/utils/textInput";
import { isValidEmail } from "../../../shared/utils/validators";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";
import { USER_ROLE_LABELS } from "../constants";


const NAME_MAX = 40;


function formFromUser(user) {
  return {
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
  };
}


/**
 * Edición de personal - el back solo permite modificar nombre/teléfono/
 * correo (ver actualizarUsuarioSchema): ni el puesto ni la sucursal se
 * pueden cambiar desde aquí, así que se muestran de solo lectura.
 */
export default function EditPersonnelModal({
  open, user, title = "Editar personal", onClose, onSubmit,
}) {

  const [form, setForm] = useState(() => formFromUser(user));
  const { errors, validate, clearError, resetErrors, setErrors } = useFormValidation();
  const [saving, setSaving] = useState(false);
  const [loadedUser, setLoadedUser] = useState(user);

  if (open && user !== loadedUser) {
    setLoadedUser(user);
    setForm(formFromUser(user));
    resetErrors();
  }

  if (!open) return null;

  const set = (field, transform) => (event) => {
    const raw = event?.target ? event.target.value : event;
    const value = transform ? transform(raw ?? "") : raw;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    clearError(field);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isValid = validate([
      ["name", !form.name.trim(), "El nombre es obligatorio."],
      ["phone", !isValidPhone(form.phone), "El teléfono debe tener exactamente 10 dígitos."],
      ["email", !form.email.trim() || !isValidEmail(form.email), "Escribe un correo electrónico válido."],
    ]);
    if (!isValid) return;

    try {
      setSaving(true);
      await onSubmit({ name: form.name.trim(), phone: form.phone, email: form.email.trim() });
      onClose();
    } catch {
      setErrors((prev) => ({ ...prev, submit: "No se pudo guardar el personal. Intenta de nuevo." }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={title} size="xl">

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <div>
            <SectionTitle icon={User} step={1} subtitle="Datos básicos de la persona.">
              Información personal
            </SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nombre completo *"
                value={form.name}
                onChange={set("name", (v) => onlyLetters(v, NAME_MAX))}
                error={errors.name}
              />
              <Input
                label="Teléfono *"
                value={form.phone}
                onChange={set("phone", (v) => onlyDigits(v, 10))}
                error={errors.phone}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Correo electrónico *"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  error={errors.email}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <SectionTitle icon={Briefcase} step={2} subtitle="El puesto y la sucursal no se pueden cambiar desde aquí.">
              Información laboral
            </SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Puesto / Rol</label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-background px-4 py-3 text-text-secondary">
                  <Briefcase className="h-4 w-4" />
                  {USER_ROLE_LABELS[user?.role] ?? user?.role ?? "—"}
                  <Lock className="ml-auto h-3.5 w-3.5" />
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Sucursal</label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-background px-4 py-3 text-text-secondary">
                  <Building2 className="h-4 w-4" />
                  {user?.branchName ?? "—"}
                  <Lock className="ml-auto h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>

          {errors.submit && <p className="text-sm text-error">{errors.submit}</p>}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="inline-flex items-center gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>

        </div>

        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-text-primary">
            <ShieldCheck className="h-4 w-4 text-indigo-primary" />
            Resumen
          </h3>

          <dl className="space-y-2 text-sm">
            <PreviewRow icon={User} label="Nombre" value={form.name} />
            <PreviewRow icon={Phone} label="Teléfono" value={form.phone} />
            <PreviewRow icon={Mail} label="Correo" value={form.email} />
          </dl>

          <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Puesto / Rol</span>
              <span className="font-medium text-text-primary">{USER_ROLE_LABELS[user?.role] ?? user?.role ?? "—"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-text-secondary">Sucursal</span>
              <span className="inline-flex items-center gap-1 font-medium text-text-primary">{user?.branchName ?? "—"}</span>
            </div>
          </div>

        </div>

      </form>

    </Modal>
  );

}


function PreviewRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-text-secondary">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="font-medium text-text-primary">{value || "-"}</span>
    </div>
  );
}
