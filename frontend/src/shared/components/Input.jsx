// Componente Input reutilizable

export default function Input({
  label,
  error,
  endAdornment,
  className = "",
  id,
  ...props
}) {
  return (
    <div className="w-full">

      {/* LABEL */}

      {label && (
        <label
          htmlFor={id}
          className="
            mb-2
            block
            text-sm
            font-medium
            text-text-primary
          "
        >
          {label}
        </label>
      )}

      {/* INPUT + ADORNO OPCIONAL (ej. ojito de contraseña) */}

      <div className="relative">

        <input
          id={id}
          className={`
            w-full
            rounded-xl
            border
            bg-surface
            px-4
            py-3
            text-text-primary
            outline-none
            transition
            placeholder:text-text-secondary

            ${endAdornment ? "pr-12" : ""}

            ${
              error
                ? "border-error focus:ring-2 focus:ring-error/20"
                : "border-gray-200 focus:border-indigo-primary focus:ring-2 focus:ring-indigo-light"
            }

            disabled:cursor-not-allowed
            disabled:opacity-50

            ${className}
          `}
          {...props}
        />

        {endAdornment && (
          <div
            className="
              absolute
              right-3
              top-1/2
              -translate-y-1/2
            "
          >
            {endAdornment}
          </div>
        )}

      </div>

      {/* MENSAJE DE ERROR */}

      {error && (
        <p
          className="
            mt-1.5
            text-sm
            text-error
          "
        >
          {error}
        </p>
      )}

    </div>
  )
}
