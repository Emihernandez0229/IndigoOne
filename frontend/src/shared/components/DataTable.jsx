export default function DataTable({

  columns = [],

  data = [],

  emptyMessage = "No existen registros."

}) {



  if(data.length === 0){

    return (

      <div

        className="
          rounded-xl
          border
          border-gray-200
          bg-surface
          p-6
          text-center
          text-sm
          text-text-secondary
        "

      >

        {emptyMessage}

      </div>

    );

  }




  return (

    <div

      className="
        overflow-hidden
        rounded-2xl
        border
        border-gray-200
        bg-surface
      "

    >


      <div

        className="
          overflow-x-auto
        "

      >


        <table

          className="
            min-w-full
            divide-y
            divide-gray-200
          "

        >


          <thead

            className="
              bg-background
            "

          >

            <tr>


              {
                columns.map((column)=>(


                  <th

                    key={column.key}

                    className="
                      px-5
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-text-secondary
                    "

                  >

                    {column.label}


                  </th>


                ))
              }


            </tr>


          </thead>





          <tbody

            className="
              divide-y
              divide-gray-100
            "

          >


            {
              data.map((row,index)=>(


                <tr

                  key={row.id ?? index}

                  className="
                    transition
                    hover:bg-background
                  "

                >


                  {
                    columns.map((column)=>(


                      <td

                        key={column.key}

                        className="
                          px-5
                          py-4
                          text-sm
                          text-text-primary
                        "

                      >

                        {
                          column.render
                          ? column.render(row)
                          : row[column.key]
                        }


                      </td>


                    ))
                  }


                </tr>


              ))
            }


          </tbody>


        </table>


      </div>


    </div>


  );

}