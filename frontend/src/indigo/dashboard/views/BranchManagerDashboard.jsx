import { useState } from "react";

import DashboardLayout from "../../../shared/dashboard/DashboardLayout";
import DashboardGrid from "../../../shared/dashboard/DashboardGrid";
import DashboardPanel from "../../../shared/dashboard/DashboardPanel";

import ChartContainer from "../../../shared/charts/ChartContainer";
import BarChart from "../../../shared/charts/BarChart";
import DonutChart from "../../../shared/charts/DonutChart";

import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import ErrorState from "../../../shared/components/ErrorState";
import EmptyState from "../../../shared/components/EmptyState";

import Can from "../../../shared/security/Can";

import useIndigoDashboard from "../hooks/useIndigoDashboard";

import LaboratoryQueue from "../components/LaboratoryQueue";


const SALES_PERIODS = [
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
];


export default function BranchManagerDashboard() {

  const { data, loading, error } = useIndigoDashboard();
  const [salesPeriod, setSalesPeriod] = useState("month");


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;
  if (!data || Object.keys(data).length === 0) return <EmptyState />;

  const laboratoryByStatus = (data.laboratoryByStatus ?? []).filter(
    (status) => status.label !== "Cancelados"
  );
  const salesByPeriod = data.salesByPeriod?.[salesPeriod] ?? [];

  return (

    <DashboardLayout
      title="Dashboard Sucursal"
      subtitle={data.branchName ?? "Resumen de tu sucursal."}
      kpis={data.kpis}
    >

      <DashboardGrid>

        <div className="col-span-12 xl:col-span-7">

          <ChartContainer
            title="Ventas"
            subtitle="Por período."
            action={
              <div className="inline-flex rounded-lg bg-background p-1">
                {SALES_PERIODS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSalesPeriod(option.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      salesPeriod === option.value
                        ? "bg-surface text-text-primary shadow-sm"
                        : "text-text-secondary"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            }
          >
            <BarChart
              data={salesByPeriod}
              dataKey="sales"
              labelKey="name"
            />
          </ChartContainer>

        </div>

        <div className="col-span-12 xl:col-span-5">

          <ChartContainer
            title="Órdenes de laboratorio"
            subtitle="Por estado."
          >
            <DonutChart data={laboratoryByStatus} centerLabel="Órdenes" />

            <div className="mt-4 flex items-center justify-between rounded-xl bg-background px-4 py-3 text-sm">
              <span className="text-text-secondary">Mermas registradas</span>
              <span className="font-semibold text-text-primary">{data.mermasRegistradas ?? 0}</span>
            </div>
          </ChartContainer>

        </div>

        <div className="col-span-12 xl:col-span-5">
          <LaboratoryQueue data={data.laboratory ?? []} />
        </div>

        <Can permission="user.view">
          <div className="col-span-12 xl:col-span-7">

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
