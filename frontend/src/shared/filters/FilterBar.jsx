export default function FilterBar({
    children,
}) {


    return (
        <div
            className="
                flex
                flex-col
                gap-4
                rounded-2xl
                border
                border-gray-200
                bg-surface
                p-4
                md:flex-row
                md:items-end
            "
        >


            {children}


        </div>
    );


}