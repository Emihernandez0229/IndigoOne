import {
  X
} from "lucide-react";



export default function Modal({

  isOpen,

  onClose,

  title,

  children,

  size="md"

}) {



  if(!isOpen){

    return null;

  }



  const sizes = {


    sm:"max-w-md",

    md:"max-w-lg",

    lg:"max-w-3xl",

    xl:"max-w-5xl"


  };





  return (

    <div

      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/40
        p-4
      "

    >



      <div

        className={`
          flex
          max-h-[90vh]
          w-full
          flex-col
          rounded-2xl
          bg-surface
          shadow-xl
          ${sizes[size]}
        `}

      >



        <header

          className="
            flex
            shrink-0
            items-center
            justify-between
            border-b
            border-gray-200
            px-6
            py-4
          "

        >



          <h2

            className="
              text-lg
              font-semibold
              text-text-primary
            "

          >

            {title}


          </h2>




          <button

            type="button"

            onClick={onClose}

            className="
              rounded-lg
              p-2
              text-text-secondary
              transition
              hover:bg-background
            "

          >

            <X

              className="
                h-5
                w-5
              "

            />


          </button>



        </header>





        <div

          className="
            overflow-y-auto
            p-6
          "

        >

          {children}


        </div>



      </div>



    </div>


  );


}