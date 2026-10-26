import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { CashFlowTimeline } from "@/components/dashboard/cash-flow-timeline";
import { PhysicalFinancialSchedule } from "@/components/dashboard/physical-financial-schedule";
import { CreateBudgetResourceDialog } from "@/components/modals/create-budget-resource-dialog";
import { CreateTransactionDialog } from "@/components/modals/create-transaction-dialog";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const metrics = await getDashboardMetricsAction();

  return (
    <DashboardShell
      title="Dashboard"
      currentUser={metrics.currentUser}
      activeTeam={metrics.activeTeam}
      availableTeams={metrics.availableTeams}
      categories={metrics.categories}
      budgetResources={metrics.budgetResources}
      headerAction={
        <div className="flex flex-wrap items-center gap-2.5">
          <CreateBudgetResourceDialog
            categories={metrics.categories}
            currentUser={metrics.currentUser}
            triggerLabel="+ Planejar Recurso"
          />
          <CreateTransactionDialog
            categories={metrics.categories}
            budgetResources={metrics.budgetResources}
            currentUser={metrics.currentUser}
            triggerLabel="+ Lançar Transação"
          />
        </div>
      }
    >
      {/* Topo: 4 KPI Cards no estilo DashStack */}
      <KpiCards kpis={metrics.kpis} />

      {/* Visão 1: Fluxo de Caixa na Linha do Tempo */}
      <CashFlowTimeline cashFlow={metrics.cashFlow} />

      {/* Visão 2: Cronograma Físico-Financeiro */}
      <PhysicalFinancialSchedule schedule={metrics.schedule} />
    </DashboardShell>
  );
}
