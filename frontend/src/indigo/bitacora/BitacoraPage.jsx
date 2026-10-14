import { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";

import PageContainer from "../../shared/layouts/PageContainer";
import KpiRow from "../../shared/components/KpiRow";
import SearchInput from "../../shared/components/SearchInput";
import FilterBar from "../../shared/filters/FilterBar";
import SelectFilter from "../../shared/filters/SelectFilter";
import LoadingSpinner from "../../shared/components/LoadingSpinner";
import ErrorState from "../../shared/components/ErrorState";

import useBitacora from "./hooks/useBitacora";
import { BITACORA_TYPES, BITACORA_TYPE_FILTERS, BITACORA_PERIODS } from "./constants";
import { USER_ROLE_LABELS } from "../users/constants";
import BitacoraDetailPanel from "./components/BitacoraDetailPanel";


function formatTime(value) {
  return new Date(value).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
}


const WEEKDAYS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];


function dayKey(value) {
  const d = new Date(value);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}


function dayHeader(value) {
  const d = new Date(value);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const base = `${WEEKDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`.toUpperCase();

  if (dayKey(value) === dayKey(today)) return `HOY · ${base}`;
  if (dayKey(value) === dayKey(yesterday)) return `AYER · ${base}`;
  return base;
}


function buildSentence(entry) {
  const meta = BITACORA_TYPES[entry.tipo];
  const targetRoleLabel = USER_ROLE_LABELS[entry.targetRole] ?? entry.targetRole;

  let suffix = "";
  if (entry.tipo === "alta_usuario") {
    suffix = ` como ${targetRoleLabel}${entry.targetBranchName ? ` en Sucursal ${entry.targetBranchName}` : ""}`;
  }

  return { verb: meta?.verb ?? "", suffix };
}


export default function BitacoraPage() {

  const { entries, loading, error } = useBitacora();

  const [query, setQuery] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("7");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const actorOptions = useMemo(() => {
    const names = [...new Set(entries.map((e) => e.actorName).filter(Boolean))];
    return names.sort().map((name) => ({ value: name, label: name }));
  }, [entries]);

  const branchOptions = useMemo(() => {
    const names = [...new Set(entries.map((e) => e.targetBranchName).filter(Boolean))];
    return names.sort().map((name) => ({ value: name, label: name }));
  }, [entries]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const periodDays = periodFilter ? Number(periodFilter) : null;
    let cutoff = null;
    if (periodDays) {
      cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - periodDays);
    }

    return entries.filter((e) => {
      const matchesQuery = !q || (e.targetName ?? "").toLowerCase().includes(q) || (e.targetUsername ?? "").toLowerCase().includes(q);
      const matchesActor = !actorFilter || e.actorName === actorFilter;
      const matchesBranch = !branchFilter || e.targetBranchName === branchFilter;
      const matchesType = !typeFilter || e.tipo === typeFilter;
      const matchesPeriod = !cutoff || new Date(e.at) >= cutoff;
      return matchesQuery && matchesActor && matchesBranch && matchesType && matchesPeriod;
    });
  }, [entries, query, actorFilter, branchFilter, typeFilter, periodFilter]);

  const grouped = useMemo(() => {
    const groups = [];
    let currentKey = null;
    filtered.forEach((entry) => {
      const key = dayKey(entry.at);
      if (key !== currentKey) {
        groups.push({ key, header: dayHeader(entry.at), entries: [] });
        currentKey = key;
      }
      groups[groups.length - 1].entries.push(entry);
    });
    return groups;
  }, [filtered]);

  const kpis = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const last7 = entries.filter((e) => new Date(e.at) >= cutoff);
    const count = (tipo) => last7.filter((e) => e.tipo === tipo).length;

    return [
      { id: "total", type: "orders", title: "Acciones · 7 días", color: "purple", value: String(last7.length) },
      { id: "altas", type: "team", title: "Altas", color: "green", value: String(count("alta_usuario")) },
      { id: "bajas", type: "team", title: "Bajas", color: "red", value: String(count("baja")) },
      { id: "ediciones", type: "team", title: "Ediciones", color: "blue", value: String(count("edicion")) },
      { id: "reseteos", type: "team", title: "Reseteos", color: "orange", value: String(count("reseteo_contrasena") + count("reactivacion")) },
    ];
  }, [entries]);

  const selectedEntry = filtered.find((e) => e.id === selectedId) ?? filtered[0] ?? null;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;

  return (

    <PageContainer
      title="Bitácora"
      description={
        <span className="flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4" />
          Historial de acciones sobre cuentas. Solo lectura: los registros no se pueden editar ni borrar.
        </span>
      }
    >

      <div className="space-y-6">

        <KpiRow items={kpis} columns={5} dense />

        <FilterBar>
          <SearchInput
            className="w-full sm:max-w-xs"
            value={query}
            onChange={setQuery}
            placeholder="Nombre de usuario o empleado"
          />
          <SelectFilter label="Realizado por" value={actorFilter} onChange={setActorFilter} placeholder="Cualquiera" options={actorOptions} />
          <SelectFilter label="Sucursal" value={branchFilter} onChange={setBranchFilter} placeholder="Todas" options={branchOptions} />
          <SelectFilter label="Periodo" value={periodFilter} onChange={setPeriodFilter} options={BITACORA_PERIODS} />
        </FilterBar>

        <div className="flex flex-wrap gap-2">
          {BITACORA_TYPE_FILTERS.map((t) => {
            const meta = BITACORA_TYPES[t.value];
            const active = typeFilter === t.value;
            return (
              <button
                key={t.value || "all"}
                type="button"
                onClick={() => setTypeFilter(t.value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  active ? "border-indigo-primary bg-indigo-primary text-white" : "border-gray-200 bg-surface text-text-secondary hover:bg-background"
                }`}
              >
                {meta && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? "#fff" : meta.color }} />}
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">

          <div className="space-y-6">
            {grouped.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 bg-surface p-6 text-center text-sm text-text-secondary">
                No hay registros que coincidan con los filtros.
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.key}>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">{group.header}</p>
                  <div className="space-y-2">
                    {group.entries.map((entry) => {
                      const meta = BITACORA_TYPES[entry.tipo];
                      const Icon = meta?.icon;
                      const { verb, suffix } = buildSentence(entry);
                      const isSelected = selectedEntry?.id === entry.id;

                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => setSelectedId(entry.id)}
                          className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition ${
                            isSelected ? "border-indigo-primary bg-indigo-light/40" : "border-gray-200 bg-surface hover:bg-background"
                          }`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${meta?.color}1A` }}>
                            {Icon && <Icon className="h-4 w-4" style={{ color: meta?.color }} />}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-text-primary">
                              <strong className="font-semibold">{entry.actorName}</strong> {verb} <strong className="font-semibold">[{entry.targetName}]</strong>{suffix}
                            </p>
                            <div className="mt-1.5 flex items-center gap-2">
                              <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${meta?.color}1A`, color: meta?.color }}>
                                {meta?.label}
                              </span>
                              {entry.targetBranchName && <span className="text-xs text-text-secondary">Sucursal {entry.targetBranchName}</span>}
                            </div>
                          </div>

                          <span className="shrink-0 text-xs text-text-secondary">{formatTime(entry.at)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div>
            <BitacoraDetailPanel entry={selectedEntry} />
          </div>

        </div>

      </div>

    </PageContainer>

  );

}
