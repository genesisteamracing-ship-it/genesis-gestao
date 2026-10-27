import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ResourcesDataTable } from "@/components/tables/resources-data-table";
import { CreateBudgetResourceDialog } from "@/components/modals/create-budget-resource-dialog";

export const dynamic = "force-dynamic";

export default async function PlanejamentoPage() {
  const metrics = await getDashboardMetricsAction();

  return (
    <DashboardShell
      title="Planejamento"
      currentUser={metrics.currentUser}
      activeTeam={metrics.activeTeam}
      availableTeams={metrics.availableTeams}
      categories={metrics.categories}
      budgetResources={metrics.budgetResources}
      seasonMonths={metrics.seasonMonths}
      headerAction={
        <CreateBudgetResourceDialog
          categories={metrics.categories}
          teamMembers={metrics.teamMembers}
          currentUser={metrics.currentUser}
          triggerLabel="+ Planejar Recurso"
        />
      }
    >
      <ResourcesDataTable
        resources={metrics.budgetResources}
        categories={metrics.categories}
        teamMembers={metrics.teamMembers}
      />
    </DashboardShell>
  );
}
