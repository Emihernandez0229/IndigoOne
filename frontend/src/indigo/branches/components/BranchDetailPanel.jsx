import { useState } from "react";
import { Building2, Users, UserCog, Package, FlaskConical, Info, UserCircle, LayoutGrid } from "lucide-react";

import StatusBadge from "../../../shared/components/StatusBadge";
import TabBar from "../../../shared/components/TabBar";
import { kpiColors } from "../../../shared/constants/kpiColors";


const TABS = [
  { value: "info", label: "Información general" },
  { value: "staff", label: "Personal" },
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


function MiniKpi({ icon: Icon, label, value, color }) {
  const palette = kpiColors[color] ?? kpiColors.blue;
  return (
    <div className="rounded-xl bg-background p-4">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${palette.bg}`}>
        <Icon className={`h-5 w-5 ${palette.text}`} />
      </div>
      <p className="text-xl font-bold text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary">{label}</p>
    </div>
  );
}


export default function BranchDetailPanel({ branch }) {

  const [tab, setTab] = useState("info");

  if (!branch) return null;

  return (
    <div className="space-y-6">

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-light">
          <Building2 className="h-6 w-6 text-indigo-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">{branch.name}</h2>
          <StatusBadge status={branch.status} />
        </div>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {tab === "info" && (
        <div className="space-y-6">

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionTitle icon={Info}>Datos de la sucursal</SectionTitle>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div className="col-span-2">
                <Field label="Dirección" value={branch.address} />
              </div>
              <Field label="País" value={branch.country} />
              <Field label="Estado" value={branch.state} />
              <Field label="Municipio" value={branch.municipality} />
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionTitle icon={UserCircle}>Responsable</SectionTitle>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Field label="Gerente de sucursal" value={branch.manager} />
              <Field label="Teléfono del gerente" value={branch.managerPhone} />
              <Field label="Subgerente" value={branch.subManager} />
              <Field label="Teléfono del subgerente" value={branch.subManagerPhone} />
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionTitle icon={LayoutGrid}>Resumen de la sucursal</SectionTitle>
            <div className="grid grid-cols-2 gap-4">
              <MiniKpi icon={Users} label="Clientes" value={branch.customers ?? 0} color="purple" />
              <MiniKpi icon={UserCog} label="Personal" value={branch.staff ?? 0} color="blue" />
              <MiniKpi icon={Package} label="Productos" value={branch.products ?? 0} color="orange" />
              <MiniKpi icon={FlaskConical} label="Trabajos de laboratorio" value={branch.labJobs ?? 0} color="pink" />
            </div>
          </div>

        </div>
      )}

      {tab === "staff" && (
        <div className="rounded-2xl border border-gray-200 bg-surface p-5">
          {(branch.staffList ?? []).length === 0 ? (
            <p className="text-sm text-text-secondary">Sin personal asignado.</p>
          ) : (
            <div className="space-y-3">
              {branch.staffList.map((person, index) => (
                <div key={index} className="flex items-center justify-between rounded-xl bg-background px-4 py-3">
                  <span className="font-medium text-text-primary">{person.name}</span>
                  <span className="text-sm text-text-secondary">{person.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );

}
