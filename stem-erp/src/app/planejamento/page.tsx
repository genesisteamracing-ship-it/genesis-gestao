import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PhysicalFinancialSchedule } from "@/components/dashboard/physical-financial-schedule";
import { ResourcesDataTable } from "@/components/tables/resources-data-table";
import { CreateBudgetResourceDialog } from "@/components/modals/create-budget-resource-dialog";

export const dynamic = "force-dynamic";

export default async function PlanejamentoPage() {
  const metrics = await getDashboardMetricsAction();

  return (
    <DashboardShell
      title="Planejamento de Recursos"
      subtitle="Gerenciamento de aquisição, alocação de responsáveis e orçamento por Grupo de Entrega"
      categories={metrics.categories}
      budgetResources={metrics.budgetResources}
      headerAction={
        <CreateBudgetResourceDialog
          categories={metrics.categories}
          triggerLabel="+ Novo Recurso Planejado"
        />
      }
    >
      <ResourcesDataTable resources={metrics.budgetResources} />

      <KpiCards kpis={metrics.kpis} />

      <PhysicalFinancialSchedule schedule={metrics.schedule} />
    </DashboardShell>
  );
}
