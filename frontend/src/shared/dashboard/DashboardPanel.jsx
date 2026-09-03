export default function DashboardPanel({
  title,
  subtitle,
  action,
  children,
  className = "",
}) {

  return (

    <section
      className={`
        rounded-2xl
        border
        border-gray-200
        bg-surface
        p-5
        shadow-sm
        ${className}
      `}
    >


      {
        (title || subtitle || action) && (

          <header
            className="
              mb-5
              flex
              items-start
              justify-between
              gap-4
            "
          >

            <div>

              {
                title && (

                  <h2
                    className="
                      text-base
                      font-semibold
                      text-text-primary
                    "
                  >
                    {title}
                  </h2>

                )
              }


              {
                subtitle && (

                  <p
                    className="
                      mt-1
                      text-sm
                      text-text-secondary
                    "
                  >
                    {subtitle}
                  </p>

                )
              }

            </div>


            {
              action && (

                <div className="shrink-0">
                  {action}
                </div>

              )
            }

          </header>

        )
      }


      {children}


    </section>

  );

}