export default function RecentSales({

  sales = []

}) {


  return (

    <div className="space-y-3">


      {

        sales.map((sale)=>(


          <div

            key={sale.id}

            className="
              flex
              justify-between
              rounded-xl
              border
              border-gray-100
              p-4
            "

          >


            <span

              className="
                text-text-primary
              "

            >

              {sale.client}

            </span>



            <span

              className="
                font-semibold
                text-indigo-primary
              "

            >

              {sale.amount}

            </span>



          </div>


        ))

      }


    </div>

  );


}