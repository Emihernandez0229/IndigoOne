export default function TodayAppointments({

  appointments = []

}) {


  return (

    <div className="space-y-3">


      {

        appointments.map((item)=>(


          <div

            key={item.id}

            className="
              rounded-xl
              bg-background
              p-4
            "

          >


            <div

              className="
                flex
                justify-between
              "

            >


              <span

                className="
                  font-medium
                  text-text-primary
                "

              >

                {item.patient}

              </span>



              <span

                className="
                  text-sm
                  text-indigo-primary
                "

              >

                {item.time}

              </span>



            </div>



            <p

              className="
                mt-1
                text-sm
                text-text-secondary
              "

            >

              {item.service}

            </p>



          </div>


        ))

      }


    </div>

  );


}