import { useState } from "react";
import { UserPlus, Phone, Mail, Briefcase, Building2, User, Lock, ShieldCheck, Copy, Check, Info } from "lucide-react";

import Modal from "../../../shared/components/Modal";
import Input from "../../../shared/components/Input";
import Select from "../../../shared/components/Select";
import Button from "../../../shared/components/Button";
import SectionTitle from "../../../shared/components/SectionTitle";
import { useFormValidation } from "../../../shared/hooks/useFormValidation";
import { onlyLetters, onlyDigits, isValidPhone } from "../../../shared/utils/textInput";
import { isValidEmail } from "../../../shared/utils/validators";
import { ROLES } from "../../../shared/security/roles";
import { OPTICAS_PERSONAL_ROLES } from "../constants";


const NAME_MAX = 40;


const EMPTY = { name: "", phone: "", email: "", role: "", branchId: "" };


/**
 * Alta de personal para el Dueño/Jefe de sucursal de óptica. El usuario y
 * la contraseña temporal ya NO se generan aquí: los genera el back al
 * crear (POST /gerentes o /empleados) y los regresa una sola vez en
 * `credencial_provisional` - por eso, al guardar, el formulario se
 * reemplaza por una pantalla de "credenciales generadas" en vez de
 * cerrarse de inmediato.
 */
export default function PersonnelFormModal({
  open, branch, branches, roleOptions = OPTICAS_PERSONAL_ROLES,
  title = "Nuevo personal", submitLabel = "Crear personal",
  onClose, onSubmit,
}) {

  const branchLocked = Boolean(branch);

  const [form, setForm] = useState(() => ({ ...EMPTY, branchId: branch?.id ?? "" }));
  const { errors, validate, clearError, resetErrors, setErrors } = useFormValidation();
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState(null);
  const [wasOpen, setWasOpen] = useState(open);

  if (open && !wasOpen) {
    setWasOpen(true);
    setForm({ ...EMPTY, branchId: branch?.id ?? "" });
    resetErrors();
    setCreated(null);
  } else if (!open && wasOpen) {
    setWasOpen(false);
  }

  if (!open) return null;

  const handleClose = () => {
    setCreated(null);
    onClose();
  };

  if (created) {
    return (
      <Modal isOpen={open} onClose={handleClose} title={title} size="sm">
        <CredentialsReveal user={created} onDone={handleClose} />
      </Modal>
    );
  }

  const needsBranch = form.role === ROLES.OPTICA_EMPLEADO;
  const selectedBranch = branchLocked ? branch : branches?.find((b) => b.id === form.branchId);

  const set = (field, transform) => (event) => {
    const raw = event?.target ? event.target.value : event;
    const value = transform ? transform(raw ?? "") : raw;
    setForm((prev) => ({
      ...prev,
      [field]: value ?? "",
      // Si cambia a Jefe de sucursal, la sucursal no aplica (se asigna
      // después desde Sucursales) - se limpia para no mandarla por error.
      ...(field === "role" && value !== ROLES.OPTICA_EMPLEADO ? { branchId: "" } : {}),
    }));
    clearError(field);
    if (field === "role") clearError("branchId");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const isValid = validate([
      ["name", !form.name.trim(), "El nombre es obligatorio."],
      ["phone", !isValidPhone(form.phone), "El teléfono debe tener exactamente 10 dígitos."],
      ["email", !form.email.trim() || !isValidEmail(form.email), "Escribe un correo electrónico válido."],
      ["role", !form.role, "Selecciona un puesto."],
      ["branchId", needsBranch && !branchLocked && !form.branchId, "Selecciona una sucursal."],
    ]);
    if (!isValid) return;

    try {
      setSaving(true);
      const resultado = await onSubmit({
        name: form.name.trim(),
        phone: form.phone,
        email: form.email.trim(),
        role: form.role,
        branchId: branchLocked ? branch.id : form.branchId,
      });
      if (resultado?.credencialProvisional) {
        setCreated(resultado);
      } else {
        handleClose();
      }
    } catch {
      setErrors((prev) => ({ ...prev, submit: "No se pudo crear el personal. Intenta de nuevo." }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title={title} size="xl">

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <div>
            <SectionTitle icon={User} step={1} subtitle="Datos básicos de la persona.">
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
                  label="Correo electrónico *"
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
            <SectionTitle icon={Briefcase} step={2} subtitle="Puesto que ocupará y, si aplica, sucursal donde trabajará.">
              Información laboral
            </SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Puesto / Rol *</label>
                <Select value={form.role} onChange={set("role")}>
                  <option value="">Selecciona un puesto...</option>
                  {roleOptions.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </Select>
                {errors.role && <p className="mt-1.5 text-sm text-error">{errors.role}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Sucursal {needsBranch && !branchLocked ? "*" : ""}</label>
                {branchLocked ? (
                  <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-background px-4 py-3 text-text-secondary">
                    <Building2 className="h-4 w-4" />
                    {branch?.name ?? "—"}
                    <Lock className="ml-auto h-3.5 w-3.5" />
                  </div>
                ) : form.role === ROLES.OPTICA_ENCARGADO ? (
                  <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-background px-4 py-3 text-sm text-text-secondary">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    Se asigna después, desde "Sucursales".
                  </div>
                ) : (
                  <>
                    <Select value={form.branchId} onChange={set("branchId")} disabled={!needsBranch}>
                      <option value="">{needsBranch ? "Selecciona una sucursal..." : "Selecciona un puesto primero"}</option>
                      {branches?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </Select>
                    {errors.branchId && <p className="mt-1.5 text-sm text-error">{errors.branchId}</p>}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-indigo-light/40 px-4 py-3 text-sm text-indigo-primary">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            El usuario y la contraseña temporal se generan automáticamente al guardar, y se mostrarán una sola vez para que los compartas con la persona.
          </div>

          {errors.submit && <p className="text-sm text-error">{errors.submit}</p>}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="inline-flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {saving ? "Creando..." : submitLabel}
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
                {form.role === ROLES.OPTICA_ENCARGADO ? "Se asigna después" : selectedBranch?.name ?? "—"}
              </span>
            </div>
          </div>

        </div>

      </form>

    </Modal>
  );

}


function CredentialsReveal({ user, onDone }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Usuario: ${user.username}\nContraseña temporal: ${user.credencialProvisional}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: no es crítico, las credenciales ya se ven en pantalla.
    }
  };

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
        <ShieldCheck className="h-7 w-7 text-success" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-text-primary">¡{user.name} fue registrado!</h3>
        <p className="mt-1 text-sm text-text-secondary">
          Esta es la única vez que se mostrará la contraseña. Compártela con la persona antes de cerrar.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-gray-200 bg-background p-4 text-left">
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Usuario</span>
          <span className="font-mono text-sm font-bold text-text-primary">{user.username}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-text-secondary">Contraseña temporal</span>
          <span className="font-mono text-sm font-bold text-text-primary">{user.credencialProvisional}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" className="inline-flex flex-1 items-center justify-center gap-2" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
        <Button type="button" className="flex-1" onClick={onDone}>Entendido, cerrar</Button>
      </div>
    </div>
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
