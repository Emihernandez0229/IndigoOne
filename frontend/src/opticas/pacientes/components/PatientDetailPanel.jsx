import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Info, Building2, Stethoscope } from "lucide-react";

import StatusBadge from "../../../shared/components/StatusBadge";
import TabBar from "../../../shared/components/TabBar";
import SectionTitle from "../../../shared/components/SectionTitle";
import Field from "../../../shared/components/DetailField";
import Button from "../../../shared/components/Button";
import Can from "../../../shared/security/Can";
import { listVentas } from "../../ventas/services/ventaService";
import useConsultas from "../../consultas/hooks/useConsultas";


const TABS = [
  { value: "info", label: "Información general" },
  { value: "history", label: "Historial" },
  { value: "consultas", label: "Consultas" },
];


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

  const navigate = useNavigate();
  const [tab, setTab] = useState("info");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { consultas, loading: loadingConsultas } = useConsultas({
    branchId: patient?.branchId,
    patientId: patient?.id,
  });

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

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-light text-lg font-bold text-indigo-primary">
            {(patient.name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">{patient.name}</h2>
            <StatusBadge status={patient.active ? "active" : "inactive"} label={patient.active ? "Activo" : "Inactivo"} />
          </div>
        </div>

        <Can permission="optica.consulta.manage">
          <Button
            className="inline-flex shrink-0 items-center gap-1.5 py-2 text-sm"
            onClick={() => navigate(`/opticas/pacientes/${patient.id}/consultas/nueva`)}
          >
            <Stethoscope className="h-4 w-4" />
            Nueva consulta
          </Button>
        </Can>
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

      {tab === "consultas" && (
        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          {loadingConsultas ? (
            <p className="text-sm text-text-secondary">Cargando consultas...</p>
          ) : consultas.length === 0 ? (
            <p className="text-sm text-text-secondary">Sin consultas registradas.</p>
          ) : (
            <div className="space-y-3">
              {consultas.map((consulta) => (
                <div key={consulta.id} className="rounded-xl bg-background px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                      <Stethoscope className="h-4 w-4 text-indigo-primary" />
                      {formatDate(consulta.examDate, { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-text-secondary sm:grid-cols-4">
                    <div><dt className="font-medium text-text-primary">OD Esfera</dt><dd>{consulta.od.esfera || "—"}</dd></div>
                    <div><dt className="font-medium text-text-primary">OD Cilindro</dt><dd>{consulta.od.cilindro || "—"}</dd></div>
                    <div><dt className="font-medium text-text-primary">OI Esfera</dt><dd>{consulta.oi.esfera || "—"}</dd></div>
                    <div><dt className="font-medium text-text-primary">OI Cilindro</dt><dd>{consulta.oi.cilindro || "—"}</dd></div>
                  </dl>
                  {consulta.notes && <p className="mt-2 text-sm text-text-secondary">{consulta.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );

}
