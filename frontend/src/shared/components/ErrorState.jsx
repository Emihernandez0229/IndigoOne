export default function ErrorState({
    title = "Ocurrió un error",
    description = "No fue posible cargar la información."
}) {


    return (
        <div
            className="
                flex
                flex-col
                items-center
                justify-center
                rounded-2xl
                border
                border-error/20
                bg-surface
                p-8
                text-center
            "
        >


            <h3
                className="
                    font-semibold
                    text-text-primary
                "
            >

                {title}

            </h3>




            <p
                className="
                    mt-2
                    text-sm
                    text-text-secondary
                "
            >

                {description}

            </p>



        </div>
    );


}