
// Actualmente usa datos simulados
// Posteriormente aqui se conectarq con el back

export async function getOpticaDashboardData() {


  return {


        kpis:[

        {
        title:"Ventas del día",
        value:"$4,320",
        description:"Ticket promedio $360",
        trend:"+8.4%",
        type:"sales"
        },

        {
        title:"Citas de hoy",
        value:"8",
        description:"3 pendientes",
        type:"appointments"
        },

        {
        title:"Laboratorio",
        value:"3",
        description:"Órdenes pendientes",
        type:"laboratory"
        },

        {
        title:"Pacientes",
        value:"14",
        description:"Atendidos hoy",
        type:"patients"
        }

        ],


    sales: [

      {
        day: "Lun",
        value: 1200,
      },


      {
        day: "Mar",
        value: 2400,
      },


      {
        day: "Mié",
        value: 1800,
      },


      {
        day: "Jue",
        value: 3200,
      },


      {
        day: "Vie",
        value: 4300,
      },


      {
        day: "Sáb",
        value: 3800,
      },

    ],




    appointments: [

      {
        id: 1,
        time: "10:00 AM",
        patient: "María López",
        service: "Valoración visual",
      },


      {
        id: 2,
        time: "11:30 AM",
        patient: "Carlos Pérez",
        service: "Entrega de lentes",
      },


      {
        id: 3,
        time: "01:00 PM",
        patient: "Ana Torres",
        service: "Examen visual",
      },

    ],




    recentSales: [

      {
        id: 1,
        client: "Juan Hernández",
        amount: "$850",
      },


      {
        id: 2,
        client: "Laura Gómez",
        amount: "$1,200",
      },


      {
        id: 3,
        client: "Pedro Ruiz",
        amount: "$540",
      },

    ],





    laboratory: [

      {
        id: 1024,
        status: "processing",
      },


      {
        id: 1025,
        status: "pending",
      },


      {
        id: 1026,
        status: "ready",
      },

    ],


  };


}