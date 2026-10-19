import { useEffect, useState } from "react";
import { Info, Building2 } from "lucide-react";

import StatusBadge from "../../../shared/components/StatusBadge";
import TabBar from "../../../shared/components/TabBar";
import { listVentas } from "../../ventas/services/ventaService";


const TABS = [
  { value: "info", label: "Información general" },
  { value: "history", label: "Historial" },
];


function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-base font-bold text-text-primary">
      <Icon className="h-4 w-4 text-indigo-primary" />
      {children}
    </h3>
  );
}


function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-text-primary">{value || "—"}</dd>
    </div>
  );
}


function formatDate(value, options) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-MX", options ?? { day: "numeric", month: "long", year: "numeric" });
}


function formatAmount(amount) {
  return Number(amount ?? 0).toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}


/**
 * Detalle de cliente para el Dueño de óptica - mismo patrón visual que
 * ClientDetailPanel de Indigo: pestañas Información general / Historial,
 * y una sección de sucursales de solo lectura (consultar, no editar ni
 * dar de baja desde aquí - eso vive en la tabla principal).
 */
export default function PatientDetailPanel({ patient }) {

  const [tab, setTab] = useState("info");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!patient?.branchId) {
      return;
    }

    let active = true;

    (async () => {
      try {
        setLoadingHistory(true);
        const ventas = await listVentas(patient.branchId);
        if (active) {
          setHistory(ventas.filter((v) => v.patientId === patient.id));
        }
      } catch (error) {
        console.error("Error al cargar el historial del cliente:", error);
        if (active) setHistory([]);
      } finally {
        if (active) setLoadingHistory(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [patient?.id, patient?.branchId]);

  if (!patient) return null;

  const branches = patient.branchId ? [{ id: patient.branchId, name: patient.branchName, active: patient.active }] : [];
  const sortedHistory = [...history].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="space-y-6">

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-light text-lg font-bold text-indigo-primary">
          {(patient.name || "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{patient.name}</h2>
          <StatusBadge status={patient.active ? "active" : "inactive"} label={patient.active ? "Activo" : "Inactivo"} />
        </div>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "info" && (
        <div className="space-y-6">

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionTitle icon={Info}>Datos del cliente</SectionTitle>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div className="col-span-2">
                <Field label="Nombre" value={patient.name} />
              </div>
              <Field label="Teléfono" value={patient.phone} />
              <div className="col-span-2">
                <Field label="Correo electrónico" value={patient.email} />
              </div>
              <Field label="Fecha de nacimiento" value={formatDate(patient.birthDate)} />
              <Field label="Fecha de registro" value={formatDate(patient.createdAt)} />
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionTitle icon={Building2}>Sucursales ({branches.length})</SectionTitle>

            {branches.length === 0 ? (
              <p className="text-sm text-text-secondary">Sin sucursal asignada.</p>
            ) : (
              <div className="space-y-3">
                {branches.map((branch) => (
                  <div key={branch.id} className="flex items-center justify-between rounded-xl bg-background px-4 py-3">
                    <p className="font-medium text-text-primary">{branch.name || "—"}</p>
                    <StatusBadge status={branch.active ? "active" : "inactive"} label={branch.active ? "Activa" : "Inactiva"} />
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {tab === "history" && (
        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          {loadingHistory ? (
            <p className="text-sm text-text-secondary">Cargando historial...</p>
          ) : sortedHistory.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin compras registradas.</p>
          ) : (
            <div className="space-y-3">
              {sortedHistory.map((venta) => (
                <div key={venta.id} className="flex items-center justify-between rounded-xl bg-background px-4 py-3">
                  <span className="text-sm text-text-secondary">{formatDate(venta.createdAt)}</span>
                  <span className="font-semibold text-text-primary">{formatAmount(venta.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );

}
