import { useMemo, useState } from "react";
import { User, Users as UsersIcon, Lock, IdCard, Shield, CheckCircle2, Building2, MapPin, Calendar, Pencil, Eye, EyeOff, Info } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import Input from "../../shared/components/Input";
import Button from "../../shared/components/Button";
import StatusBadge from "../../shared/components/StatusBadge";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import { useAuth } from "../../shared/context/AuthContext";
import { getRoleConfig } from "../../shared/security/roleConfig";

import useUsers from "../users/hooks/useUsers";
import { onlyLetters, onlyDigits, isValidEmail, isValidPhone } from "../../shared/utils/textInput";
import { useFormValidation } from "../../shared/hooks/useFormValidation";


function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}


function InfoChip({ icon: Icon, label, value, valueNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-background px-4 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-light">
        <Icon className="h-4 w-4 text-indigo-primary" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="truncate text-sm font-bold text-text-primary">{valueNode ?? value}</p>
      </div>
    </div>
  );
}


function FormField({ label, value, editing, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-text-primary">{label}</label>
      {editing ? children : (
        <div className="w-full truncate rounded-xl border border-gray-200 bg-background px-4 py-3 text-text-primary">
          {value || "—"}
        </div>
      )}
    </div>
  );
}


export default function ProfilePage() {

  const { user: currentUser } = useAuth();
  const { users, loading, error, updateMyProfile, updateMyEmergencyContact, changeMyPassword } = useUsers();

  const me = useMemo(() => users.find((u) => u.id === currentUser?.id), [users, currentUser?.id]);

  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState(null);
  const { errors: infoErrors, validate: validateInfo, resetErrors: resetInfoErrors } = useFormValidation();
  const [savingInfo, setSavingInfo] = useState(false);

  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState(null);
  const { errors: contactErrors, validate: validateContact, resetErrors: resetContactErrors } = useFormValidation();
  const [savingContact, setSavingContact] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  if (loading) return <LoadingSpinner />;
  if (error || !me) return <ErrorState />;

  const roleLabel = getRoleConfig(me.role)?.label ?? me.role;

  const initials = (me.name ?? "Usuario")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function startEditingInfo() {
    setInfoForm({ name: me.name ?? "", username: me.username ?? "", phone: me.phone ?? "", email: me.email ?? "" });
    resetInfoErrors();
    setEditingInfo(true);
  }

  function setInfoField(field, transform) {
    return (e) => setInfoForm((f) => ({ ...f, [field]: transform ? transform(e.target.value) : e.target.value }));
  }

  async function saveInfo() {
    const isValid = validateInfo([
      ["name", !infoForm.name.trim(), "Requerido."],
      ["username", !infoForm.username.trim(), "Requerido."],
      ["phone", infoForm.phone && !isValidPhone(infoForm.phone), "Debe tener 10 dígitos."],
      ["email", infoForm.email && !isValidEmail(infoForm.email), "Correo inválido."],
    ]);
    if (!isValid) return;

    setSavingInfo(true);
    try {
      await updateMyProfile(me.id, infoForm);
      setEditingInfo(false);
    } finally {
      setSavingInfo(false);
    }
  }

  function startEditingContact() {
    setContactForm({
      name: me.emergencyContact?.name ?? "",
      phone: me.emergencyContact?.phone ?? "",
      relation: me.emergencyContact?.relation ?? "",
    });
    resetContactErrors();
    setEditingContact(true);
  }

  function setContactField(field, transform) {
    return (e) => setContactForm((f) => ({ ...f, [field]: transform ? transform(e.target.value) : e.target.value }));
  }

  async function saveContact() {
    const isValid = validateContact([
      ["phone", contactForm.phone && !isValidPhone(contactForm.phone), "Debe tener 10 dígitos."],
    ]);
    if (!isValid) return;

    setSavingContact(true);
    try {
      await updateMyEmergencyContact(me.id, contactForm);
      setEditingContact(false);
    } finally {
      setSavingContact(false);
    }
  }

  function toggleShowPassword(field) {
    setShowPassword((s) => ({ ...s, [field]: !s[field] }));
  }

  async function submitPasswordChange(e) {
    e.preventDefault();
    setPasswordSuccess("");

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword) {
      setPasswordError("Ingresa tu contraseña actual.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (!/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
      setPasswordError("Incluye letras, números y un carácter especial.");
      return;
    }
    if (newPassword.toLowerCase().includes((me.name ?? "").toLowerCase().split(" ")[0]?.toLowerCase() || "\0")) {
      setPasswordError("No uses tu nombre como contraseña.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setPasswordError("");
    setSavingPassword(true);
    try {
      await changeMyPassword(me.id, { currentPassword, newPassword });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordSuccess("Contraseña actualizada correctamente.");
    } catch {
      setPasswordError("No se pudo actualizar la contraseña.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (

    <PageContainer title="Mi perfil" description="Tu información personal, de contacto y acceso.">

      <div className="space-y-6">

        <section className="rounded-2xl border border-gray-200 bg-surface p-6">
          <div className="flex flex-wrap items-center gap-6 lg:flex-nowrap">

            <div className="flex flex-1 items-center gap-6">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-indigo-primary text-4xl font-bold text-white">
                {initials}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl font-bold text-text-primary">{me.name}</h2>
                  <StatusBadge status={me.status} label={me.status === "active" ? "Activo" : "Inactivo"} />
                </div>
                <p className="text-lg text-text-secondary">{roleLabel}</p>
                <p className="mt-3 flex items-center gap-2 text-base text-text-secondary">
                  <MapPin className="h-5 w-5" />
                  {me.branchName || "Sin sucursal"}
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-base text-text-secondary">
                  <Calendar className="h-5 w-5" />
                  Ingreso: {formatDate(me.createdAt)}
                </p>
              </div>
            </div>

            <div className="hidden h-32 w-px bg-gray-200 lg:block" />

            <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto lg:min-w-[420px]">
              <InfoChip icon={IdCard} label="Usuario" value={me.username} />
              <InfoChip icon={Shield} label="Rol" value={roleLabel} />
              <InfoChip icon={CheckCircle2} label="Estado" valueNode={<StatusBadge status={me.status} label={me.status === "active" ? "Activo" : "Inactivo"} />} />
              <div className="sm:col-span-3">
                <InfoChip icon={Building2} label="Sucursal" value={me.branchName || "Sin sucursal"} />
              </div>
            </div>

          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          <div className="space-y-6">

            <section className="rounded-2xl border border-gray-200 bg-surface p-6">

              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-bold text-text-primary">
                  <User className="h-5 w-5 text-indigo-primary" />
                  Información personal
                </h3>

                {!editingInfo ? (
                  <Button variant="outline" className="inline-flex items-center gap-1.5 py-2 text-sm" onClick={startEditingInfo}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="py-2 text-sm" onClick={() => setEditingInfo(false)} disabled={savingInfo}>
                      Cancelar
                    </Button>
                    <Button className="py-2 text-sm" onClick={saveInfo} disabled={savingInfo}>
                      {savingInfo ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Nombre completo" value={me.name} editing={editingInfo}>
                  <Input value={infoForm?.name} onChange={setInfoField("name", (v) => onlyLetters(v, 40))} error={infoErrors.name} />
                </FormField>

                <FormField label="Usuario" value={me.username} editing={editingInfo}>
                  <Input value={infoForm?.username} onChange={setInfoField("username")} error={infoErrors.username} />
                </FormField>

                <FormField label="Teléfono" value={me.phone} editing={editingInfo}>
                  <Input value={infoForm?.phone} onChange={setInfoField("phone", (v) => onlyDigits(v, 10))} error={infoErrors.phone} />
                </FormField>

                <FormField label="Correo electrónico" value={me.email} editing={editingInfo}>
                  <Input type="email" value={infoForm?.email} onChange={setInfoField("email")} error={infoErrors.email} />
                </FormField>
              </div>

            </section>

            <section className="rounded-2xl border border-gray-200 bg-surface p-6">

              <div className="mb-5 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-base font-bold text-text-primary">
                  <UsersIcon className="h-5 w-5 text-indigo-primary" />
                  Información de contacto de emergencia
                </h3>

                {!editingContact ? (
                  <Button variant="outline" className="inline-flex items-center gap-1.5 py-2 text-sm" onClick={startEditingContact}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="py-2 text-sm" onClick={() => setEditingContact(false)} disabled={savingContact}>
                      Cancelar
                    </Button>
                    <Button className="py-2 text-sm" onClick={saveContact} disabled={savingContact}>
                      {savingContact ? "Guardando..." : "Guardar"}
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField label="Nombre" value={me.emergencyContact?.name} editing={editingContact}>
                  <Input value={contactForm?.name} onChange={setContactField("name", (v) => onlyLetters(v, 40))} />
                </FormField>

                <FormField label="Teléfono" value={me.emergencyContact?.phone} editing={editingContact}>
                  <Input value={contactForm?.phone} onChange={setContactField("phone", (v) => onlyDigits(v, 10))} error={contactErrors.phone} />
                </FormField>

                <FormField label="Parentesco" value={me.emergencyContact?.relation} editing={editingContact}>
                  <Input value={contactForm?.relation} onChange={setContactField("relation", (v) => onlyLetters(v, 30))} />
                </FormField>
              </div>

            </section>

          </div>

          <section className="rounded-2xl border border-gray-200 bg-surface p-6">

            <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-text-primary">
              <Lock className="h-5 w-5 text-indigo-primary" />
              Cambio de contraseña
            </h3>

            <form className="space-y-4" onSubmit={submitPasswordChange}>

              <Input
                label="Contraseña actual"
                type={showPassword.currentPassword ? "text" : "password"}
                placeholder="Ingresa tu contraseña actual"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
                endAdornment={
                  <button type="button" onClick={() => toggleShowPassword("currentPassword")} className="text-text-secondary">
                    {showPassword.currentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <Input
                label="Nueva contraseña"
                type={showPassword.newPassword ? "text" : "password"}
                placeholder="Ingresa tu nueva contraseña"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
                endAdornment={
                  <button type="button" onClick={() => toggleShowPassword("newPassword")} className="text-text-secondary">
                    {showPassword.newPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              <Input
                label="Confirmar nueva contraseña"
                type={showPassword.confirmPassword ? "text" : "password"}
                placeholder="Confirma tu nueva contraseña"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                endAdornment={
                  <button type="button" onClick={() => toggleShowPassword("confirmPassword")} className="text-text-secondary">
                    {showPassword.confirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {passwordError && <p className="text-sm text-error">{passwordError}</p>}
              {passwordSuccess && <p className="text-sm text-success">{passwordSuccess}</p>}

              <div className="flex items-start gap-3 rounded-xl bg-indigo-light p-4">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-primary" />
                <div className="text-sm text-text-primary">
                  <p className="font-semibold">Recomendaciones</p>
                  <ul className="mt-1 list-inside list-disc space-y-0.5 text-text-secondary">
                    <li>Mínimo 8 caracteres</li>
                    <li>Incluye letras, números y un carácter especial</li>
                    <li>No uses información personal</li>
                  </ul>
                </div>
              </div>

              <Button type="submit" className="inline-flex w-full items-center justify-center gap-2 py-3" disabled={savingPassword}>
                <Lock className="h-4 w-4" />
                {savingPassword ? "Actualizando..." : "Actualizar contraseña"}
              </Button>

            </form>

          </section>

        </div>

      </div>

    </PageContainer>

  );

}
