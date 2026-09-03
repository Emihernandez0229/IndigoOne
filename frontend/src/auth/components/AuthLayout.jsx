import logoIndigo from "../../assets/indigologo.png"
import loginBackground from "../../assets/fondo-login.png"

// LAYOUT GENERAL DE AUTENTICACIÓN
// Se reutiliza en Login, recuperación y cambio de contraseña

const ALIGN_CLASSES = {
  end: "lg:justify-end",
  center: "lg:justify-center",
}

export default function AuthLayout({
  children,
  title,
  description,
  footer,
  backgroundImage = loginBackground,
  align = "end",
}) {
  return (
    <main
      className="
        h-screen
        overflow-hidden
        bg-cover
        bg-center
      "
      style={{
        backgroundImage: `url(${backgroundImage})`,
      }}
    >
      <section
        className={`
          flex
          min-h-screen
          items-center
          justify-center
          px-6
          py-6
          lg:px-16
          ${ALIGN_CLASSES[align]}
        `}
      >
        <div
          className={`
            w-full
            max-w-[580px]
            ${align === "end" ? "lg:mr-8" : ""}
          `}
        >
          {/* TARJETA PRINCIPAL */}

          <div
            className="
              w-full
              rounded-[24px]
              bg-white/95
              px-7
              py-6
              shadow-[0_18px_40px_rgba(23,32,79,0.18)]
              backdrop-blur-sm
              md:px-9
              md:py-8
            "
          >
            {/* LOGO */}

            <div
              className="
                mb-5
                border-b
                border-gray-200
                pb-5
              "
            >
              <img
                src={logoIndigo}
                alt="Indigo"
                className="
                  h-auto
                  w-44
                  md:w-48
                "
              />
            </div>

            {/* TÍTULO */}

            {title && (
              <h1
                className="
                  text-3xl
                  font-bold
                  text-indigo-dark
                  md:text-4xl
                "
              >
                {title}
              </h1>
            )}

            {/* DESCRIPCIÓN */}

            {description && (
              <p
                className="
                  mt-2
                  text-base
                  text-text-secondary
                  md:text-lg
                "
              >
                {description}
              </p>
            )}

            {/* CONTENIDO DE CADA PANTALLA */}

            {children}

            {/* CONTENIDO INFERIOR OPCIONAL */}

            {footer && (
              <>
                <div className="my-6 border-t border-gray-200" />

                {footer}
              </>
            )}
          </div>

          {/* PIE EXTERIOR */}

          <p
            className="
              mt-5
              text-center
              text-sm
              text-white
            "
          >
            <span className="font-semibold">
              Indigo One
            </span>

            {" · "}

            Sistema Integral de Gestión
          </p>
        </div>
      </section>
    </main>
  )
}