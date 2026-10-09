import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2, MapPin, Info, X, Lightbulb, UserPlus,
  Phone, Mail, FileText,
} from "lucide-react";

import PageContainer from "../../../shared/layouts/PageContainer";
import Input from "../../../shared/components/Input";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import ErrorState from "../../../shared/components/ErrorState";
import { useAuth } from "../../../shared/context/AuthContext";
import { COUNTRIES, getStatesForCountry, getMunicipalitiesForState } from "../../../shared/constants/locations";
import {
  onlyLetters, onlyLettersAndDots, onlyDigits, alphanumericSpaces, rfcInput,
  isValidEmail, isValidPhone, isValidPostalCode,
} from "../../../shared/utils/textInput";

import useClients from "../hooks/useClients";
import useBranches from "../../branches/hooks/useBranches";


const NAME_MAX = 30;
const BUSINESS_NAME_MAX = 30;
const RFC_MAX = 13;
const ADDRESS_MAX = 40;


const EMPTY = {
  name: "",
  businessName: "",
  rfc: "",
  phone: "",
  email: "",
  country: "México",
  state: "",
  municipality: "",
  address: "",
  postalCode: "",
  branchLocationName: "",
};


function formFromClient(client) {
  if (!client) return { ...EMPTY };
  return {
    ...EMPTY,
    name: client.name ?? "",
    businessName: client.businessName ?? "",
    rfc: client.rfc ?? "",
    phone: client.phone ?? "",
    email: client.email ?? "",
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
  disabled:cursor-not-allowed disabled:opacity-50
`;


export default function ClientFormPage() {

  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { user: currentUser } = useAuth();
  const { clients, loading: loadingClients, error: errorClients, create, update } = useClients();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  const existingClient = useMemo(
    () => (isEdit ? clients.find((c) => c.id === id) : null),
    [clients, id, isEdit]
  );

  const [form, setForm] = useState(() => formFromClient(existingClient));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [loadedClient, setLoadedClient] = useState(existingClient);

  if (existingClient && existingClient !== loadedClient) {
    setLoadedClient(existingClient);
    setForm(formFromClient(existingClient));
  }

  const stateOptions = getStatesForCountry(form.country);
  const municipalityOptions = getMunicipalitiesForState(form.country, form.state);

  const set = (field, transform) => (event) => {
    const raw = event?.target ? event.target.value : event;
    const value = transform ? transform(raw ?? "") : raw;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleCountryChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, country: value, state: "", municipality: "" }));
  };

  const handleStateChange = (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, state: value, municipality: "" }));
  };

  const loading = loadingClients || loadingBranches;
  const error = errorClients || errorBranches;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const required = ["name", "businessName", "rfc", "phone", "email", "country", "state", "municipality", "address", "postalCode", "branchLocationName"];
    const nextErrors = {};
    required.forEach((field) => {
      if (!String(form[field] ?? "").trim()) nextErrors[field] = "Este campo es obligatorio.";
    });

    if (!nextErrors.phone && !isValidPhone(form.phone)) {
      nextErrors.phone = "El teléfono debe tener exactamente 10 dígitos.";
    }
    if (!nextErrors.email && !isValidEmail(form.email)) {
      nextErrors.email = "Escribe un correo electrónico válido.";
    }
    if (!nextErrors.postalCode && !isValidPostalCode(form.postalCode)) {
      nextErrors.postalCode = "El código postal debe tener exactamente 5 dígitos.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setSaving(true);
      if (isEdit) {
        await update(id, form);
      } else {
        await create({ ...form, branchId: myBranch?.id, branchName: myBranch?.name });
      }
      navigate("/indigo/clientes");
    } finally {
      setSaving(false);
    }
  };

  const fiscalAddressPreview = [form.address, form.municipality, form.state].filter(Boolean).join(", ");

  return (

    <PageContainer
      title={isEdit ? "Editar cliente" : "Nuevo cliente"}
      description={isEdit ? "Actualiza la información de la óptica." : "Registra una nueva óptica cliente en tu sucursal."}
    >

      {showBanner && (
        <div className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-indigo-light bg-indigo-light/50 px-4 py-3 text-sm text-indigo-primary">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            La sucursal y la distribuidora se asignarán automáticamente según tu perfil de gerente de sucursal.
          </div>
          <button type="button" onClick={() => setShowBanner(false)} className="shrink-0 text-indigo-primary/70 hover:text-indigo-primary">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-6 lg:col-span-2">

          <div className="rounded-2xl border border-gray-200 bg-surface p-6">
            <SectionTitle icon={Building2} step={1} subtitle="Datos generales de la óptica.">
              Información del cliente
            </SectionTitle>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nombre comercial *" value={form.name} onChange={set("name", (v) => onlyLetters(v, NAME_MAX))} error={errors.name} />
              <Input label="Razón social *" value={form.businessName} onChange={set("businessName", (v) => onlyLettersAndDots(v, BUSINESS_NAME_MAX))} error={errors.businessName} />
              <Input label="RFC *" value={form.rfc} onChange={set("rfc", (v) => rfcInput(v, RFC_MAX))} error={errors.rfc} />
              <Input label="Teléfono *" value={form.phone} onChange={set("phone", (v) => onlyDigits(v, 10))} error={errors.phone} />
              <div className="sm:col-span-2">
                <Input label="Correo electrónico *" type="email" value={form.email} onChange={set("email")} error={errors.email} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-surface p-6">
            <SectionTitle icon={MapPin} step={2} subtitle="Dirección fiscal de la óptica.">
              Ubicación
            </SectionTitle>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">País *</label>
                <select value={form.country} onChange={handleCountryChange} className={selectClass}>
                  {COUNTRIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Estado *</label>
                <select value={form.state} onChange={handleStateChange} className={selectClass}>
                  <option value="">Selecciona...</option>
                  {stateOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {errors.state && <p className="mt-1.5 text-sm text-error">{errors.state}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">Municipio *</label>
                <select value={form.municipality} onChange={set("municipality")} disabled={!form.state} className={selectClass}>
                  <option value="">{form.state ? "Selecciona..." : "Primero elige un estado"}</option>
                  {municipalityOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                {errors.municipality && <p className="mt-1.5 text-sm text-error">{errors.municipality}</p>}
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Input label="Dirección *" value={form.address} onChange={set("address", (v) => alphanumericSpaces(v, ADDRESS_MAX))} error={errors.address} />
              <Input label="Código postal *" value={form.postalCode} onChange={set("postalCode", (v) => onlyDigits(v, 5))} error={errors.postalCode} />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-surface p-6">
            <SectionTitle icon={Building2} step={3} subtitle="Selecciona la sucursal del cliente que registrarás en tu sistema.">
              Sucursal del cliente
            </SectionTitle>

            <Input
              label="Sucursal del cliente *"
              placeholder="Ej. Tapachula"
              value={form.branchLocationName}
              onChange={set("branchLocationName")}
              error={errors.branchLocationName}
            />
            <p className="mt-1.5 text-xs text-text-secondary">
              Si el cliente tiene más sucursales, podrás agregarlas después.
            </p>

            <div className="mt-4 flex items-center justify-between rounded-xl bg-background px-4 py-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-text-secondary">Indigo asignada</p>
                <p className="text-sm font-semibold text-text-primary">{myBranch?.name ?? "—"}</p>
              </div>
              <span className="text-xs text-text-secondary">Asignada automáticamente según tu sucursal.</span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate("/indigo/clientes")}>Cancelar</Button>
            <Button type="submit" disabled={saving} className="inline-flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear cliente"}
            </Button>
          </div>

        </div>

        <div className="space-y-6">

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionPreviewTitle icon={Building2}>Cliente</SectionPreviewTitle>
            <p className="mb-4 text-sm text-text-secondary">Resumen de la información capturada.</p>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-light text-sm font-bold text-indigo-primary">
                {(form.name || "?").slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-text-primary">{form.name || "Nombre comercial"}</p>
                <p className="truncate text-sm text-text-secondary">{form.businessName || "Razón social"}</p>
              </div>
              <StatusBadge status="active" label="Activo" />
            </div>

            <dl className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-sm">
              <PreviewRow icon={FileText} label="RFC" value={form.rfc} />
              <PreviewRow icon={Phone} label="Teléfono" value={form.phone} />
              <PreviewRow icon={Mail} label="Correo" value={form.email} />
            </dl>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Ubicación</p>
              <p className="flex items-start gap-2 text-sm text-text-primary">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
                {fiscalAddressPreview || "—"}
              </p>
            </div>

            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-secondary">Sucursal del cliente</p>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
                  <Building2 className="h-4 w-4 text-text-secondary" />
                  {form.branchLocationName || "—"}
                </span>
                {myBranch && (
                  <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                    {myBranch.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-background p-5">
            <div className="flex items-start gap-2">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Sugerencia</p>
                <p className="mt-1 text-sm text-text-secondary">
                  Si el cliente ya existe, puedes buscarlo antes de crear uno nuevo para evitar duplicados.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/indigo/clientes")}
                  className="mt-2 text-sm font-medium text-indigo-primary hover:underline"
                >
                  Buscar cliente existente →
                </button>
              </div>
            </div>
          </div>

        </div>

      </form>

    </PageContainer>
  );
}


function SectionPreviewTitle({ icon: Icon, children }) {
  return (
    <h3 className="mb-1 flex items-center gap-2 text-base font-bold text-text-primary">
      <Icon className="h-4 w-4 text-indigo-primary" />
      {children}
    </h3>
  );
}


function PreviewRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-text-secondary">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span className="font-medium text-text-primary">{value || "—"}</span>
    </div>
  );
}
