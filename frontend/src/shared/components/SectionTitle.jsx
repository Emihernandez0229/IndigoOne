// Encabezado de seccion reutilizable - cubre las dos variantes que se
// copiaban en cada formulario/panel: simple (icono + titulo) y numerada
// (circulo con el numero de paso + titulo + subtitulo), segun si se le
// pasa `step`.
//
// La variante simple trae "mb-4" por default (lo que casi todos los
// llamadores querian); los que ya envuelven el titulo en su propio
// contenedor con margen (ej. junto a un boton en la misma fila) pasan
// className="" para no duplicar el espaciado.

export default function SectionTitle({ icon: Icon, children, subtitle, step, className = "mb-4" }) {
  if (step != null) {
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

  return (
    <h3 className={`flex items-center gap-2 text-base font-bold text-text-primary ${className}`}>
      <Icon className="h-4 w-4 text-indigo-primary" />
      {children}
    </h3>
  );
}
