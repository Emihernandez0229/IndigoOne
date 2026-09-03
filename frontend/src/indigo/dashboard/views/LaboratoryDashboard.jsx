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


export default function LaboratoryDashboard() {

  const { data, loading, error } = useIndigoDashboard();


  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorState />;
  if (!data || Object.keys(data).length === 0) return <EmptyState />;


  const queue = data.queue ?? [];


  return (

    <DashboardLayout
      title="Dashboard Laboratorio"
      subtitle="Control de trabajos de producción."
      kpis={data.kpis}
    >

      <DashboardGrid>

        <div className="col-span-12">

          <DashboardPanel
            title="Cola de trabajos"
            subtitle="Ordenados por prioridad."
          >
            <div className="space-y-3">

              {queue.length === 0 && (
                <p className="text-sm text-text-secondary">
                  No hay trabajos en cola.
                </p>
              )}

              {queue.map((job) => (

                <div
                  key={job.id}
                  className="
                    flex
                    flex-col
                    gap-3
                    rounded-xl
                    bg-background
                    p-4
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >

                  <div>
                    <p className="font-medium text-text-primary">
                      {job.order}
                      {job.priority === "urgent" && (
                        <span className="ml-2 text-xs font-semibold text-error">
                          URGENTE
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {job.customer}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">

                    <StatusBadge status={job.status} />

                    <Can permission="laboratory.job.accept">
                      {job.status === "pending" && (
                        <Button className="py-1.5 text-xs">
                          Aceptar
                        </Button>
                      )}
                    </Can>

                    <Can permission="laboratory.job.update">
                      {job.status === "processing" && (
                        <Button variant="outline" className="py-1.5 text-xs">
                          Actualizar
                        </Button>
                      )}
                    </Can>

                  </div>

                </div>

              ))}

            </div>
          </DashboardPanel>

        </div>

      </DashboardGrid>

    </DashboardLayout>

  );

}
