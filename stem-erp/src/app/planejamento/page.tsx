import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PhysicalFinancialSchedule } from "@/components/dashboard/physical-financial-schedule";
import { ResourcesDataTable } from "@/components/tables/resources-data-table";
import { CreateBudgetResourceDialog } from "@/components/modals/create-budget-resource-dialog";

export const dynamic = "force-dynamic";

export default async function PlanejamentoPage() {
  const metrics = await getDashboardMetricsAction();
  const isSuperAdmin = metrics.currentUser.role === "SUPER_ADMIN";

  return (
    <DashboardShell
      title="Planejamento de Recursos"
      subtitle={
        isSuperAdmin
          ? "Gerenciamento global de aquisição, alocação de responsáveis e orçamento de todas as equipes"
          : `Planejamento exclusivo da equipe ${
              metrics.currentUser.deliveryGroup
                ? DELIVERY_GROUP_LABELS[metrics.currentUser.deliveryGroup]
                : ""
            }`
      }
      currentUser={metrics.currentUser}
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
