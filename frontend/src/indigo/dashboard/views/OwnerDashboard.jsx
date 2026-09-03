import { useState } from "react";

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

import DashboardFilters from "../components/DashboardFilters";
import LaboratoryQueue from "../components/LaboratoryQueue";


export default function OwnerDashboard() {

  const { data, loading, error } = useIndigoDashboard();

  const [branch, setBranch] = useState("");
  const [period, setPeriod] = useState("month");


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;
  if (!data || Object.keys(data).length === 0) return <EmptyState />;


  return (

    <DashboardLayout
      title="Dashboard Dueño"
      subtitle="Resumen general del negocio."
      kpis={data.kpis}
    >

      <div className="space-y-6">

        <DashboardFilters
          branches={data.branches ?? []}
          selectedBranch={branch}
          selectedPeriod={period}
          onBranchChange={setBranch}
          onPeriodChange={setPeriod}
        />

        <DashboardGrid>

          <div className="col-span-12 xl:col-span-8">

            <ChartContainer
              title="Ventas por sucursal"
              subtitle="Comparativo de rendimiento."
            >
              <BarChart
                data={data.salesByBranch ?? []}
                dataKey="sales"
                labelKey="name"
              />
            </ChartContainer>

          </div>

          <div className="col-span-12 xl:col-span-4">
            <LaboratoryQueue data={data.laboratory ?? []} />
          </div>

          <Can permission="reports.global">
            <div className="col-span-12">

              <DashboardPanel
                title="Reportes globales"
                subtitle="Consolidado de todas las sucursales."
              >
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">

                  <ReportTile label="Ventas" value={data.reports?.sales} />
                  <ReportTile label="Clientes" value={data.reports?.customers} />
                  <ReportTile label="Trabajos" value={data.reports?.jobs} />

                </div>
              </DashboardPanel>

            </div>
          </Can>

        </DashboardGrid>

      </div>

    </DashboardLayout>

  );

}


function ReportTile({ label, value }) {

  return (

    <div className="rounded-xl bg-background p-4">
      <p className="text-sm text-text-secondary">{label}</p>
      <p className="mt-2 text-xl font-bold text-text-primary">
        {value ?? "-"}
      </p>
    </div>

  );

}
