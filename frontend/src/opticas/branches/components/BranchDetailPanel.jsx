import { useState } from "react";
import { Building2, Users, UserCog, Package, Info, UserCircle, LayoutGrid, Pencil } from "lucide-react";

import StatusBadge from "../../../shared/components/StatusBadge";
import TabBar from "../../../shared/components/TabBar";
import SectionTitle from "../../../shared/components/SectionTitle";
import Field from "../../../shared/components/DetailField";
import { kpiColors } from "../../../shared/constants/kpiColors";
import { USER_ROLE_LABELS } from "../../users/constants";


const TABS = [
  { value: "info", label: "Información general" },
  { value: "staff", label: "Personal" },
];


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


export default function BranchDetailPanel({ branch, canManage = false, onAssignManager }) {

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
              <Field label="Teléfono" value={branch.phone} />
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle icon={UserCircle} className="">Responsable</SectionTitle>
              {canManage && (
                <button
                  type="button"
                  onClick={onAssignManager}
                  className="flex items-center gap-1.5 text-sm font-medium text-indigo-primary hover:underline"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {branch.managerId ? "Cambiar" : "Asignar"}
                </button>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-4">
              <Field label="Jefe de sucursal" value={branch.manager} />
              <Field label="Teléfono del jefe de sucursal" value={branch.managerPhone} />
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-surface p-5">
            <SectionTitle icon={LayoutGrid}>Resumen de la sucursal</SectionTitle>
            <div className="grid grid-cols-3 gap-4">
              <MiniKpi icon={Users} label="Pacientes" value={branch.customers ?? 0} color="purple" />
              <MiniKpi icon={UserCog} label="Personal" value={branch.staff ?? 0} color="blue" />
              <MiniKpi icon={Package} label="Productos" value={branch.products ?? 0} color="orange" />
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
                  <span className="text-sm text-text-secondary">{USER_ROLE_LABELS[person.role] ?? person.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );

}
