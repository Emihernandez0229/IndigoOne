/**
 * Boton de accion compacto para filas de tabla (ver / editar / dar de baja).
 *   <IconButton icon={Eye} label="Ver" onClick={...} />
 *   <IconButton icon={Ban} label="Dar de baja" variant="danger" onClick={...} />
 */
const VARIANTS = {
  default: "text-text-secondary hover:bg-background hover:text-indigo-primary",
  danger: "text-text-secondary hover:bg-error/10 hover:text-error",
};


export default function IconButton({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
}) {

  return (

    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`
        inline-flex
        h-9
        w-9
        items-center
        justify-center
        rounded-lg
        transition
        disabled:cursor-not-allowed
        disabled:opacity-40
        ${VARIANTS[variant] ?? VARIANTS.default}
      `}
    >
      <Icon className="h-4 w-4" />
    </button>

  );

}
