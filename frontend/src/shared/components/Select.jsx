// Componente Select reutilizable - mismo patron visual que Input.jsx,
// reemplaza el `selectClass` que se copiaba en cada formulario.

export default function Select({
  label,
  error,
  className = "",
  id,
  children,
  ...props
}) {
  return (
    <div className="w-full">

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

      <select
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
      >
        {children}
      </select>

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
  );
}
