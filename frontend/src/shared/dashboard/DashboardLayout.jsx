import DashboardKpi from "./DashboardKpi";


export default function DashboardLayout({
  title,
  subtitle,
  kpis = [],
  actions,
  children,
}) {

  const hasKpis = kpis.length > 0;


  return (

    <div className="space-y-6">


      {/* ENCABEZADO */}

      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-start
          sm:justify-between
        "
      >

        <div>

          <h1
            className="
              text-2xl
              font-semibold
              text-text-primary
            "
          >
            {title}
          </h1>


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
          actions && (

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

          )
        }

      </div>



      {/* KPIS */}

      {
        hasKpis && (

          <div
            className="
              grid
              grid-cols-1
              gap-5
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >

            {
              kpis.map((kpi) => (

                <DashboardKpi
                  key={kpi.id ?? kpi.title}
                  {...kpi}
                />

              ))
            }

          </div>

        )
      }



      {/* CONTENIDO */}

      {
        children && (

          <div>
            {children}
          </div>

        )
      }


    </div>

  );

}