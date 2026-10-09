import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ClipboardList, Info } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import Input from "../../shared/components/Input";
import Button from "../../shared/components/Button";
import StatusBadge from "../../shared/components/StatusBadge";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";
import { useAuth } from "../../shared/context/AuthContext";
import { ROLES } from "../../shared/security/roles";
import { onlyDigits } from "../../shared/utils/textInput";

import useLaboratoryJobs from "../laboratory/hooks/useLaboratoryJobs";
import useBranches from "../branches/hooks/useBranches";
import useClients from "../clients/hooks/useClients";
import useUsers from "../users/hooks/useUsers";
import { BISEL_TYPES, SERVICE_TYPES } from "../laboratory/constants";


const EMPTY = {
  clientId: "",
  sellerId: "",
  serviceType: "",
  biselType: "",
  quantity: "1",
  urgent: false,
  deliveryDate: "",
  deliveryTime: "",
};


function pad2(n) {
  return String(n).padStart(2, "0");
}

function todayDateValue() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function nowTimeValue() {
  const d = new Date();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}


const selectClass = `
  w-full rounded-xl border border-gray-200 bg-surface px-4 py-3 text-text-primary
  outline-none transition focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light
`;


export default function NewJobPage() {

  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { loading: loadingJobs, error: errorJobs, create } = useLaboratoryJobs();
  const { branches, loading: loadingBranches, error: errorBranches } = useBranches();
  const { clients, loading: loadingClients, error: errorClients } = useClients();
  const { users, loading: loadingUsers, error: errorUsers } = useUsers();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [lastFolio, setLastFolio] = useState(null);

  const myBranch = useMemo(
    () => branches.find((b) => b.id === currentUser?.sucursalId),
    [branches, currentUser?.sucursalId]
  );

  const clientOptions = useMemo(() => {
    return clients
      .filter((c) => c.status === "active" && (c.branches ?? []).some((b) => b.indigoBranchId === myBranch?.id))
      .map((c) => ({ value: c.id, label: c.name }));
  }, [clients, myBranch]);

  const sellerOptions = useMemo(() => {
    const sellers = users.filter((u) => u.branchId === myBranch?.id && u.role === ROLES.INDIGO_EMPLEADO_VENTAS);
    return sellers
      .map((u) => ({ value: u.id, label: u.id === currentUser?.id ? `${u.name} (yo)` : u.name }))
      .sort((a, b) => (a.value === currentUser?.id ? -1 : b.value === currentUser?.id ? 1 : 0));
  }, [users, myBranch, currentUser?.id]);

  const set = (field, transform) => (event) => {
    const raw = event?.target ? event.target.value : event;
    const value = transform ? transform(raw ?? "") : raw;
    setForm((prev) => ({ ...prev, [field]: value ?? "" }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const loading = loadingJobs || loadingBranches || loadingClients || loadingUsers;
  const error = errorJobs || errorBranches || errorClients || errorUsers;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  const selectedClient = clientOptions.find((c) => c.value === form.clientId);
  const selectedSeller = sellerOptions.find((s) => s.value === form.sellerId);

  const today = todayDateValue();
  const minTime = form.deliveryDate === today ? nowTimeValue() : undefined;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};
    if (!form.clientId) nextErrors.clientId = "Selecciona un cliente.";
    if (!form.sellerId) nextErrors.sellerId = "Selecciona un vendedor.";
    if (!form.serviceType) nextErrors.serviceType = "Selecciona el tipo de servicio.";
    if (!form.biselType) nextErrors.biselType = "Selecciona el tipo de bisel.";
    if (!form.quantity || Number(form.quantity) < 1) nextErrors.quantity = "La cantidad debe ser al menos 1.";
    if (!form.deliveryDate) nextErrors.deliveryDate = "Selecciona la fecha de entrega.";
    if (!form.deliveryTime) nextErrors.deliveryTime = "Selecciona la hora de entrega.";

    if (!nextErrors.deliveryDate && form.deliveryDate < today) {
      nextErrors.deliveryDate = "No puedes elegir una fecha anterior a hoy.";
    }

    if (!nextErrors.deliveryDate && !nextErrors.deliveryTime) {
      const deliveryAt = new Date(`${form.deliveryDate}T${form.deliveryTime}`);
      if (deliveryAt < new Date()) {
        nextErrors.deliveryTime = "La fecha y hora de entrega no pueden ser anteriores a ahora.";
      }
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const seller = users.find((u) => u.id === form.sellerId);

    try {
      setSaving(true);
      const created = await create({
        branchId: myBranch?.id,
        clientName: clients.find((c) => c.id === form.clientId)?.name,
        sellerName: seller?.name,
        serviceType: form.serviceType,
        biselType: form.biselType,
        quantity: Number(form.quantity),
        urgent: form.urgent,
        deliveryDate: form.deliveryDate,
        deliveryTime: form.deliveryTime,
        registeredByName: currentUser?.name,
        registeredById: currentUser?.id,
      });
      setLastFolio(created.folio);
      setForm(EMPTY);
    } finally {
      setSaving(false);
    }
  };

  return (

    <PageContainer
      title="Nuevo trabajo"
      description="Registra la orden para que el laboratorio la acepte y la procese."
      actions={
        <Button variant="outline" className="inline-flex items-center gap-2 py-2.5 text-sm" onClick={() => navigate("/indigo/trabajos")}>
          <ArrowLeft className="h-4 w-4" />
          Trabajos u órdenes
        </Button>
      }
    >

      {lastFolio && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          <span>
            Trabajo <strong>{lastFolio}</strong> registrado. Quedó como «Pendiente» hasta que laboratorio lo acepte.
          </span>
          <Link to="/indigo/trabajos" className="font-medium underline">Ver mis trabajos</Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-gray-200 bg-surface p-6 lg:col-span-2">

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">Cliente (óptica) *</label>
              <select value={form.clientId} onChange={set("clientId")} className={selectClass}>
                <option value="">Selecciona un cliente...</option>
                {clientOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {errors.clientId && <p className="mt-1.5 text-sm text-error">{errors.clientId}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">Vendedor *</label>
              <select value={form.sellerId} onChange={set("sellerId")} className={selectClass}>
                <option value="">Selecciona un vendedor...</option>
                {sellerOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <p className="mt-1.5 text-xs text-text-secondary">
                Elige quién hizo la venta realmente. Si usas la cuenta de otra persona, el sistema guarda también quién registró.
              </p>
              {errors.sellerId && <p className="mt-1.5 text-sm text-error">{errors.sellerId}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">Tipo de servicio *</label>
              <select value={form.serviceType} onChange={set("serviceType")} className={selectClass}>
                <option value="">Selecciona el tipo de servicio</option>
                {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {errors.serviceType && <p className="mt-1.5 text-sm text-error">{errors.serviceType}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">Tipo de bisel *</label>
              <select value={form.biselType} onChange={set("biselType")} className={selectClass}>
                <option value="">Selecciona el tipo de bisel</option>
                {BISEL_TYPES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
              {errors.biselType && <p className="mt-1.5 text-sm text-error">{errors.biselType}</p>}
            </div>
          </div>

          <Input
            label="Cantidad *"
            type="number"
            min="1"
            value={form.quantity}
            onChange={set("quantity", (v) => onlyDigits(v, 3))}
            error={errors.quantity}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-text-primary">Prioridad *</label>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, urgent: false }))}
                className={`rounded-xl border-2 p-4 text-left transition ${!form.urgent ? "border-indigo-primary bg-indigo-light/40" : "border-gray-200 hover:bg-background"}`}
              >
                <p className="font-semibold text-text-primary">Normal</p>
                <p className="text-sm text-text-secondary">Tiempo de entrega estándar</p>
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, urgent: true }))}
                className={`rounded-xl border-2 p-4 text-left transition ${form.urgent ? "border-error bg-error/5" : "border-gray-200 hover:bg-background"}`}
              >
                <p className="font-semibold text-text-primary">Urgente</p>
                <p className="text-sm text-text-secondary">Laboratorio lo prioriza</p>
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Fecha de entrega *"
              type="date"
              min={today}
              value={form.deliveryDate}
              onChange={set("deliveryDate")}
              error={errors.deliveryDate}
            />
            <Input
              label="Hora de entrega *"
              type="time"
              min={minTime}
              value={form.deliveryTime}
              onChange={set("deliveryTime")}
              error={errors.deliveryTime}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate("/indigo/trabajos")}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? "Registrando..." : "Registrar trabajo"}</Button>
          </div>

        </form>

        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-text-primary">
            <ClipboardList className="h-4 w-4 text-indigo-primary" />
            Al registrar
          </h3>

          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Estado inicial</dt>
              <dd><StatusBadge status="pending" label="Pendiente" /></dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Registrado por</dt>
              <dd className="font-medium text-text-primary">{currentUser?.name}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Fecha de ingreso</dt>
              <dd className="font-medium text-text-primary">Automática</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Prioridad</dt>
              <dd className="font-medium text-text-primary">{form.urgent ? "Urgente" : "Normal"}</dd>
            </div>
          </dl>

          {(selectedClient || selectedSeller) && (
            <dl className="mt-3 space-y-2 border-t border-gray-100 pt-3 text-sm">
              {selectedClient && (
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Cliente</dt>
                  <dd className="font-medium text-text-primary">{selectedClient.label}</dd>
                </div>
              )}
              {selectedSeller && (
                <div className="flex items-center justify-between">
                  <dt className="text-text-secondary">Vendedor</dt>
                  <dd className="font-medium text-text-primary">{selectedSeller.label}</dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-xl bg-indigo-light/40 px-3 py-3 text-xs text-indigo-primary">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Después podrás consultar el avance en Trabajos u órdenes. No podrás aceptar, terminar ni registrar mermas; eso lo hace laboratorio.
          </div>

        </div>

      </div>

    </PageContainer>
  );
}
