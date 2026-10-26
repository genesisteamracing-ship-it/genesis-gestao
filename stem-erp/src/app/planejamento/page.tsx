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
      title={`Planejamento — ${metrics.activeTeam.name}`}
      subtitle={`Orçamento e recursos planejados nos 5 setores internos da ${metrics.activeTeam.name}`}
      currentUser={metrics.currentUser}
      activeTeam={metrics.activeTeam}
      availableTeams={metrics.availableTeams}
      categories={metrics.categories}
      budgetResources={metrics.budgetResources}
      headerAction={
        <CreateBudgetResourceDialog
          categories={metrics.categories}
          currentUser={metrics.currentUser}
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
