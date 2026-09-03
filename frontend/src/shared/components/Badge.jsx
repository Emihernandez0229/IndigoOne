import { statusStyles } from "../constants/statusStyles";


export default function Badge({

  status

}) {


  const style = statusStyles[status];


  if (!style) {

    return null;

  }



  return (

    <span

      className={`

        inline-flex
        items-center
        rounded-full
        px-3
        py-1
        text-xs
        font-medium

        ${style.className}

      `}

    >

      {style.label}


    </span>

  );


}