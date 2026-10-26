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
      headerAction={
        <CreateBudgetResourceDialog
          categories={metrics.categories}
          currentUser={metrics.currentUser}
          triggerLabel="+ Planejar Recurso"
        />
      }
    >
      <ResourcesDataTable resources={metrics.budgetResources} />
    </DashboardShell>
  );
}
