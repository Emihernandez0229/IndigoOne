import { useState } from "react";
import { Save, Phone, Mail, Building2, Lock, User, Briefcase, ShieldCheck } from "lucide-react";

import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import { onlyLetters, onlyDigits, isValidEmail, isValidPhone } from "../../../shared/utils/textInput";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";
import { OPTICAS_PERSONAL_ROLES } from "../constants";


const NAME_MAX = 40;


function formFromUser(user) {
  return {
    name: user?.name ?? "",
    username: user?.username ?? "",
    phone: user?.phone ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "",
    branchId: user?.branchId ?? "",
  };
}


function SectionTitle({ icon: Icon, children, subtitle, step }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-light text-sm font-bold text-indigo-primary">
        {step}
      </span>
      <div>
        <h3 className="flex items-center gap-2 text-base font-bold text-text-primary">
          <Icon className="h-4 w-4 text-indigo-primary" />
          {children}
        </h3>
        {subtitle && <p className="text-sm text-text-secondary">{subtitle}</p>}
      </div>
    </div>
  );
}


const selectClass = `
  w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary
  outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light
`;


/**
 * Edición de personal para el Dueño de óptica - mismo patrón que
 * EditPersonnelModal de Indigo (módulo "Personal"): sucursal reasignable
 * entre todas las de la óptica, usuario editable.
 */
export default function EditPersonnelModal({
  open, user, branch, branches, roleOptions = OPTICAS_PERSONAL_ROLES, allowUsernameEdit = true,
  title = "Editar personal", onClose, onSubmit,
}) {

  const branchLocked = Boolean(branch);

  const [form, setForm] = useState(() => formFromUser(user));
  const { errors, validate, clearError, resetErrors } = useFormValidation();
  const [saving, setSaving] = useState(false);
  const [loadedUser, setLoadedUser] = useState(user);

  if (open && user !== loadedUser) {
    setLoadedUser(user);
    setForm(formFromUser(user));
    resetErrors();
  }

  if (!open) return null;

  const selectedBranch = branchLocked ? branch : branches?.find((b) => b.id === form.branchId);

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
      ["username", allowUsernameEdit && !form.username.trim(), "El usuario es obligatorio."],
      ["phone", !isValidPhone(form.phone), "El teléfono debe tener exactamente 10 dígitos."],
      ["email", form.email && !isValidEmail(form.email), "Escribe un correo electrónico válido."],
      ["role", !form.role, "Selecciona un puesto."],
      ["branchId", !branchLocked && !form.branchId, "Selecciona una sucursal."],
    ]);
    if (!isValid) return;

    const payload = { name: form.name.trim(), phone: form.phone, email: form.email.trim(), role: form.role, branchId: form.branchId };
    if (allowUsernameEdit) payload.username = form.username.trim();

    try {
      setSaving(true);
      await onSubmit(payload);
      onClose();
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
              {allowUsernameEdit && (
                <Input
                  label="Usuario *"
                  value={form.username}
                  onChange={set("username")}
                  error={errors.username}
                />
              )}
              <Input
                label="Teléfono *"
                value={form.phone}
                onChange={set("phone", (v) => onlyDigits(v, 10))}
                error={errors.phone}
              />
              <div className={allowUsernameEdit ? "" : "sm:col-span-2"}>
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  error={errors.email}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <SectionTitle icon={Briefcase} step={2} subtitle="Puesto que ocupará y sucursal donde trabaja.">
              Información laboral
            </SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Puesto / Rol *</label>
                <select value={form.role} onChange={set("role")} className={selectClass}>
                  <option value="">Selecciona un puesto...</option>
                  {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {errors.role && <p className="mt-1.5 text-sm text-error">{errors.role}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Sucursal {!branchLocked ? "*" : ""}</label>
                {branchLocked ? (
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-background px-4 py-3 text-text-secondary">
                    <Building2 className="h-4 w-4" />
                    {branch?.name ?? user?.branchName ?? "—"}
                    <Lock className="ml-auto h-3.5 w-3.5" />
                  </div>
                ) : (
                  <>
                    <select value={form.branchId} onChange={set("branchId")} className={selectClass}>
                      <option value="">Selecciona una sucursal...</option>
                      {branches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    {errors.branchId && <p className="mt-1.5 text-sm text-error">{errors.branchId}</p>}
                  </>
                )}
              </div>
            </div>
          </div>

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
              <span className="font-medium text-text-primary">
                {roleOptions.find((r) => r.value === form.role)?.label ?? "Selecciona un puesto..."}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-text-secondary">Sucursal</span>
              <span className="inline-flex items-center gap-1 font-medium text-text-primary">
                {selectedBranch?.name ?? "—"}
              </span>
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
