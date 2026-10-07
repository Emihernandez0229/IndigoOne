import DashboardPanel from "../../../shared/dashboard/DashboardPanel";

import StatusBadge from "../../../shared/components/StatusBadge";


export default function LaboratoryQueue({
    data = null,
}) {


    if (!data) {

        return (
            <DashboardPanel

                title="Trabajos laboratorio"

                subtitle="Seguimiento de producción."

            >

                <p className="text-sm text-text-secondary">
                    No hay trabajos disponibles.
                </p>


            </DashboardPanel>
        );

    }


    return (

        <DashboardPanel

            title="Trabajos laboratorio"

            subtitle="Seguimiento de producción."

        >


            <div className="space-y-3">


                {
                    data.map((job) => (

                        <div
                            key={job.id}
                            className="
                                rounded-xl
                                bg-background
                                p-4
                            "
                        >


                            <div

                                className="
                                    flex
                                    items-center
                                    justify-between
                                "

                            >


                                <div>


                                    <p

                                        className="
                                            font-medium
                                            text-text-primary
                                        "

                                    >

                                        {job.order}

                                    </p>


                                    <p

                                        className="
                                            text-sm
                                            text-text-secondary
                                        "

                                    >

                                        {job.customer}

                                    </p>


                                </div>



                                <StatusBadge

                                    status={job.status}

                                />


                            </div>


                        </div>


                    ))

                }


            </div>


        </DashboardPanel>


    );


}