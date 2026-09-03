export default function ChartContainer({
    title,
    subtitle,
    children,
    action,
}) {


    return (
        <section
            className="
                rounded-2xl
                border
                border-gray-200
                bg-surface
                p-5
            "
        >


            <header
                className="
                    mb-5
                    flex
                    items-start
                    justify-between
                    gap-4
                "
            >


                <div>


                    <h2
                        className="
                            text-base
                            font-semibold
                            text-text-primary
                        "
                    >

                        {title}

                    </h2>


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
                    action && (

                        <div>

                            {action}

                        </div>

                    )
                }



            </header>




            {children}





        </section>
    );


}