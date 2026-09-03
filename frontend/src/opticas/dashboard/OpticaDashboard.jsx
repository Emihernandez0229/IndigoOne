import DashboardLayout from "../../shared/dashboard/DashboardLayout";

import DashboardGrid from "../../shared/dashboard/DashboardGrid";

import DashboardPanel from "../../shared/dashboard/DashboardPanel";


import SalesChart from "./components/SalesChart";

import TodayAppointments from "./components/TodayAppointments";

import RecentSales from "./components/RecentSales";

import LaboratoryOrders from "./components/LaboratoryOrders";


import useOpticaDashboard from "./hooks/useOpticaDashboard";



export default function OpticaDashboard() {


  const {
    data,
    loading,
    error,

  } = useOpticaDashboard();





  if (loading) {

    return (

      <div
        className="
          flex
          h-64
          items-center
          justify-center
          text-text-secondary
        "
      >

        Cargando dashboard...

      </div>

    );

  }





  if (error) {


    return (

      <div
        className="
          rounded-xl
          bg-error/10
          p-5
          text-error
        "
      >

        Error al cargar información.

      </div>

    );

  }





  return (


    <DashboardLayout

      title="Dashboard"

      subtitle="Resumen de la actividad de tu óptica."

      kpis={data.kpis}

    >



      <DashboardGrid>



        <div
          className="
            col-span-12
            xl:col-span-8
          "
        >

          <DashboardPanel

            title="Ventas"

            subtitle="Comportamiento de ventas"

          >

            <SalesChart

              data={data.sales}

            />


          </DashboardPanel>


        </div>





        <div

          className="
            col-span-12
            xl:col-span-4
          "

        >

          <DashboardPanel

            title="Próximas citas"

          >

            <TodayAppointments

              appointments={data.appointments}

            />


          </DashboardPanel>


        </div>





        <div

          className="
            col-span-12
            xl:col-span-7
          "

        >

          <DashboardPanel

            title="Ventas recientes"

            subtitle="Últimas operaciones"

          >

            <RecentSales

              sales={data.recentSales}

            />


          </DashboardPanel>


        </div>





        <div

          className="
            col-span-12
            xl:col-span-5
          "

        >

          <DashboardPanel

            title="Órdenes de laboratorio"

            subtitle="Seguimiento de trabajos"

          >

            <LaboratoryOrders

              orders={data.laboratory}

            />


          </DashboardPanel>


        </div>



      </DashboardGrid>



    </DashboardLayout>


  );


}