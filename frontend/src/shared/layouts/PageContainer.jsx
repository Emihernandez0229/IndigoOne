// CONTENEDOR GENERAL DE LAS PÁGINAS

export default function PageContainer({
  title,
  description,
  children,
  actions,
  className = "",
}) {
  return (
    <div
      className={`
        mx-auto
        w-full
        max-w-[1600px]
        ${className}
      `}
    >
      {/* ENCABEZADO */}

      <div
        className="
          mb-7
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >
        <div>
          {/* TÍTULO */}

          <h1
            className="
              text-2xl
              font-bold
              text-text-primary
              lg:text-3xl
            "
          >
            {title}
          </h1>

          {/* DESCRIPCIÓN */}

          {description && (
            <p
              className="
                mt-1
                text-sm
                text-text-secondary
                lg:text-base
              "
            >
              {description}
            </p>
          )}
        </div>

        {/* ACCIONES OPCIONALES */}

        {actions && (
          <div
            className="
              flex
              shrink-0
              items-center
              gap-3
            "
          >
            {actions}
          </div>
        )}
      </div>

      {/* CONTENIDO DE LA PÁGINA */}

      {children}
    </div>
  )
}