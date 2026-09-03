// Variantes visuales disponibles para los botones

const variants = {
  primary:
    "bg-indigo-primary text-white hover:bg-indigo-dark",

  secondary:
    "bg-indigo-light text-indigo-primary hover:bg-indigo-secondary hover:text-white",

  outline:
    "border border-indigo-primary bg-transparent text-indigo-primary hover:bg-indigo-light",

  danger:
    "bg-error text-white hover:opacity-90",
}

// Componente Button reutilizable

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  return (
    <button
      className={`
        cursor-pointer
        rounded-xl
        px-5
        py-3
        font-semibold
        transition
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variants[variant] || variants.primary}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  )
}