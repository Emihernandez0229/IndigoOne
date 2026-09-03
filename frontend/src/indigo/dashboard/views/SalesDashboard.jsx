import DashboardLayout from "../../../shared/dashboard/DashboardLayout";
import DashboardGrid from "../../../shared/dashboard/DashboardGrid";
import DashboardPanel from "../../../shared/dashboard/DashboardPanel";

import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";

import LoadingSpinner from "../../../shared/components/LoadingSpinner";
import ErrorState from "../../../shared/components/ErrorState";
import EmptyState from "../../../shared/components/EmptyState";

import Can from "../../../shared/security/Can";

import useIndigoDashboard from "../hooks/useIndigoDashboard";


export default function SalesDashboard() {

  const { data, loading, error } = useIndigoDashboard();


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;
  if (!data || Object.keys(data).length === 0) return <EmptyState />;


  const actions = (
    <div className="flex gap-3">

      <Can permission="sales.create">
        <Button className="py-2 text-sm">
          Nueva venta
        </Button>
      </Can>

      <Can permission="laboratory.job.create">
        <Button variant="outline" className="py-2 text-sm">
          Enviar a laboratorio
        </Button>
      </Can>

    </div>
  );


  return (

    <DashboardLayout
      title="Dashboard Ventas"
      subtitle="Gestión de clientes y ventas."
      kpis={data.kpis}
      actions={actions}
    >

      <DashboardGrid>

        <div className="col-span-12 xl:col-span-7">

          <DashboardPanel
            title="Ventas recientes"
            subtitle="Tus últimas operaciones."
          >
            <div className="space-y-3">

              {(data.recentSales ?? []).map((sale) => (

                <div
                  key={sale.id}
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    border
                    border-gray-100
                    p-4
                  "
                >
                  <span className="text-text-primary">
                    {sale.client}
                  </span>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={sale.status} />
                    <span className="font-semibold text-indigo-primary">
                      {sale.amount}
                    </span>
                  </div>
                </div>

              ))}

            </div>
          </DashboardPanel>

        </div>

        <div className="col-span-12 xl:col-span-5">

          <DashboardPanel
            title="Mis órdenes de laboratorio"
            subtitle="Trabajos que has enviado."
          >
            <div className="space-y-3">

              {(data.myLabOrders ?? []).map((order) => (

                <div
                  key={order.id}
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-xl
                    bg-background
                    p-4
                  "
                >
                  <span className="text-sm font-medium text-text-primary">
                    {order.order}
                  </span>
                  <StatusBadge status={order.status} />
                </div>

              ))}

            </div>
          </DashboardPanel>

        </div>

      </DashboardGrid>

    </DashboardLayout>

  );

}
