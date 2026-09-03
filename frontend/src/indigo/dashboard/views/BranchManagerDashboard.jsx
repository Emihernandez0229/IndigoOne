import DashboardLayout from "../../../shared/dashboard/DashboardLayout";
import DashboardGrid from "../../../shared/dashboard/DashboardGrid";
import DashboardPanel from "../../../shared/dashboard/DashboardPanel";

import ChartContainer from "../../../shared/charts/ChartContainer";
import BarChart from "../../../shared/charts/BarChart";

import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import ErrorState from "../../../shared/components/ErrorState";
import EmptyState from "../../../shared/components/EmptyState";

import Can from "../../../shared/security/Can";

import useIndigoDashboard from "../hooks/useIndigoDashboard";

import LaboratoryQueue from "../components/LaboratoryQueue";


export default function BranchManagerDashboard() {

  const { data, loading, error } = useIndigoDashboard();


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;
  if (!data || Object.keys(data).length === 0) return <EmptyState />;


  return (

    <DashboardLayout
      title="Dashboard Sucursal"
      subtitle={data.branchName ?? "Resumen de tu sucursal."}
      kpis={data.kpis}
    >

      <DashboardGrid>

        <div className="col-span-12 xl:col-span-7">

          <ChartContainer
            title="Ventas por usuario"
            subtitle="Rendimiento del equipo."
          >
            <BarChart
              data={data.salesByEmployee ?? []}
              dataKey="sales"
              labelKey="name"
            />
          </ChartContainer>

        </div>

        <div className="col-span-12 xl:col-span-5">
          <LaboratoryQueue data={data.laboratory ?? []} />
        </div>

        <Can permission="user.view">
          <div className="col-span-12">

            <DashboardPanel
              title="Equipo"
              subtitle="Empleados de la sucursal."
            >
              <div className="space-y-3">

                {(data.team ?? []).map((member) => (

                  <div
                    key={member.id}
                    className="
                      flex
                      items-center
                      justify-between
                      rounded-xl
                      bg-background
                      p-4
                    "
                  >
                    <div>
                      <p className="font-medium text-text-primary">
                        {member.name}
                      </p>
                      <p className="text-sm text-text-secondary">
                        {member.role}
                      </p>
                    </div>

                    <p className="font-semibold text-indigo-primary">
                      {member.sales}
                    </p>
                  </div>

                ))}

              </div>
            </DashboardPanel>

          </div>
        </Can>

      </DashboardGrid>

    </DashboardLayout>

  );

}
