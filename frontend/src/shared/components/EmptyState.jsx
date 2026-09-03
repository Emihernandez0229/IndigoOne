import {
    Inbox
} from "lucide-react";


export default function EmptyState({
    title = "Sin información",
    description = "No existen registros disponibles.",
    icon: Icon = Inbox,
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
                border-gray-200
                bg-surface
                p-8
                text-center
            "
        >


            <div
                className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    bg-indigo-light
                "
            >

                <Icon
                    className="
                        h-6
                        w-6
                        text-indigo-primary
                    "
                />

            </div>



            <h3
                className="
                    mt-4
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