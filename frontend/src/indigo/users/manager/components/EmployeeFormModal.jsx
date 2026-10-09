import { useState } from "react";
import { UserPlus, Phone, Mail, Briefcase, Building2, User, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

import Modal from "../../../../shared/components/Modal";
import Input from "../../../../shared/components/Input";
import Button from "../../../../shared/components/Button";
import { onlyLetters, onlyDigits, isValidEmail, isValidPhone } from "../../../../shared/utils/textInput";
import { EMPLOYEE_ROLES } from "../../constants";




const NAME_MAX = 40;


function rolePrefix(role) {
  if (role === "indigo:subgerente") return "SUB";
  if (role === "indigo:empleado_laboratorio") return "LAB";
  return "VTA";
}


function generateUsername(role, existingUsers) {
  const prefix = rolePrefix(role);
  const sameRoleCount = existingUsers.filter((u) => u.role === role).length;
  return `${prefix}-${String(sameRoleCount + 1).padStart(5, "0")}`;
}


function generatePassword() {
  return Math.random().toString(36).slice(-8);
}


const EMPTY = { name: "", phone: "", email: "", role: "" };


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


export default function EmployeeFormModal({ open, branch, existingUsers = [], roleOptions = EMPLOYEE_ROLES, onClose, onSubmit }) {

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState(() => generatePassword());
  const [wasOpen, setWasOpen] = useState(open);

  if (open && !wasOpen) {
    setWasOpen(true);
    setForm(EMPTY);
    setErrors({});
    setRequirePasswordChange(true);
    setCredentials(generatePassword());
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  if (!open) return null;

  const username = form.role ? generateUsername(form.role, existingUsers) : "—";

  const set = (field, transform) => (event) => {
    const raw = event?.target ? event.target.value : event;
    const value = transform ? transform(raw ?? "") : raw;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "El nombre es obligatorio.";
    if (!isValidPhone(form.phone)) nextErrors.phone = "El teléfono debe tener exactamente 10 dígitos.";
    if (form.email && !isValidEmail(form.email)) nextErrors.email = "Escribe un correo electrónico válido.";
    if (!form.role) nextErrors.role = "Selecciona un puesto.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      await onSubmit({
        name: form.name.trim(),
        phone: form.phone,
        email: form.email.trim(),
        role: form.role,
        username,
        password: credentials,
        passwordChangeRequired: requirePasswordChange,
        branchId: branch?.id,
        branchName: branch?.name,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Nuevo empleado" size="xl">

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <div>
            <SectionTitle icon={User} step={1} subtitle="Datos básicos del empleado.">
              Información personal
            </SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nombre completo *"
                placeholder="Ej. Juan Pérez García"
                value={form.name}
                onChange={set("name", (v) => onlyLetters(v, NAME_MAX))}
                error={errors.name}
              />
              <Input
                label="Teléfono *"
                placeholder="Ej. 961 123 4567"
                value={form.phone}
                onChange={set("phone", (v) => onlyDigits(v, 10))}
                error={errors.phone}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Correo electrónico"
                  placeholder="Ej. juan@ejemplo.com"
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  error={errors.email}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <SectionTitle icon={Briefcase} step={2} subtitle="Puesto que ocupará y sucursal donde trabajará.">
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
                <label className="mb-2 block text-sm font-medium text-text-primary">Sucursal</label>
                <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-background px-4 py-3 text-text-secondary">
                  <Building2 className="h-4 w-4" />
                  {branch?.name ?? "—"}
                  <Lock className="ml-auto h-3.5 w-3.5" />
                </div>
                <p className="mt-1.5 text-xs text-text-secondary">Asignada automáticamente según tu sucursal.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <SectionTitle icon={Lock} step={3} subtitle="Credenciales para que el empleado pueda ingresar.">
              Acceso al sistema
            </SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Nombre de usuario *</label>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-background px-4 py-3">
                  <span className="flex items-center gap-2 text-text-primary"><User className="h-4 w-4 text-text-secondary" />{username}</span>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Generado automáticamente</span>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Contraseña temporal *</label>
                <div className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-background px-4 py-3">
                  <span className="flex items-center gap-2 text-text-primary">
                    <Lock className="h-4 w-4 text-text-secondary" />
                    {showPassword ? credentials : "•".repeat(credentials.length)}
                  </span>
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-text-secondary hover:text-text-primary">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <label className="mt-4 flex items-start gap-2 rounded-xl bg-indigo-light/40 px-4 py-3 text-sm text-text-primary">
              <input
                type="checkbox"
                checked={requirePasswordChange}
                onChange={(e) => setRequirePasswordChange(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-primary focus:ring-indigo-light"
              />
              El empleado deberá cambiar su contraseña al iniciar sesión por primera vez.
            </label>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="inline-flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {saving ? "Creando..." : "Crear empleado"}
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
                {branch?.name}
                <Lock className="h-3 w-3 text-text-secondary" />
              </span>
            </div>
            <p className="mt-1 text-right text-xs text-text-secondary">(Asignada automáticamente)</p>
          </div>

          <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Usuario</span>
              <span className="inline-flex items-center gap-1 font-medium text-text-primary">
                {username}
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">Generado</span>
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-text-secondary">Contraseña</span>
              <span className="flex items-center gap-1 font-medium text-text-primary">
                {showPassword ? credentials : "•".repeat(credentials.length)}
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-text-secondary hover:text-text-primary">
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-indigo-light/40 px-3 py-3 text-xs text-indigo-primary">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            El empleado podrá acceder al sistema con estas credenciales. Puedes compartirlas con él después de crear la cuenta.
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
