export default function SelectFilter({
    label,
    value,
    options = [],
    onChange,
    placeholder,
}) {


    return (
        <div className="space-y-1">


            {
                label && (

                    <label
                        className="
                            text-sm
                            font-medium
                            text-text-secondary
                        "
                    >

                        {label}

                    </label>

                )
            }





            <select
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                className="
                    w-full
                    rounded-xl
                    border
                    border-gray-200
                    bg-surface
                    px-4
                    py-2
                    text-sm
                    text-text-primary
                    outline-none
                    focus:ring-2
                    focus:ring-indigo-primary
                "
            >



                {
                    placeholder && (

                        <option value="">

                            {placeholder}

                        </option>

                    )
                }





                {
                    options.map(option => (

                        <option
                            key={option.value}
                            value={option.value}
                        >

                            {option.label}

                        </option>



                    ))
                }





            </select>



        </div>
    );


}