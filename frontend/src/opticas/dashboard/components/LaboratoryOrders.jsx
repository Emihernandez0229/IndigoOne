import Badge from "../../../shared/components/Badge";

export default function LaboratoryOrders({

  orders = []

}) {



  return (

    <div className="space-y-3">


      {

        orders.map((order)=>(


          <div

            key={order.id}

            className="
              flex
              items-center
              justify-between
              rounded-xl
              bg-background
              p-4
            "

          >
            <span

              className="
                text-sm
                font-medium
                text-text-primary
              "

            >

              #{order.id}

            </span>



            <Badge

              status={order.status}

            />


          </div>


        ))

      }


    </div>

  );


}