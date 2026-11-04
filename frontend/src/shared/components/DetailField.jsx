// Par etiqueta/valor reutilizable para paneles de detalle (dt/dd) - se
// copiaba igual en cada panel. `icon` es opcional (MyBranchPage lo usaba
// con icono a la izquierda).

export default function DetailField({ icon: Icon, label, value }) {
  if (Icon) {
    return (
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
          <dd className="mt-0.5 text-sm font-bold text-text-primary">{value || "—"}</dd>
        </div>
      </div>
    );
  }

  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-text-secondary">{label}</dt>
      <dd className="mt-1 text-sm font-bold text-text-primary">{value || "—"}</dd>
    </div>
  );
}
