import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { TransactionsDataTable } from "@/components/tables/transactions-data-table";
import { CreateTransactionDialog } from "@/components/modals/create-transaction-dialog";

export const dynamic = "force-dynamic";

export default async function LancamentosPage() {
  const metrics = await getDashboardMetricsAction();

  return (
    <DashboardShell
      title={`Livro Caixa — ${metrics.activeTeam.name}`}
      subtitle={`Rastreamento auditável de receitas e despesas da ${metrics.activeTeam.name} em todos os seus setores`}
      currentUser={metrics.currentUser}
      activeTeam={metrics.activeTeam}
      availableTeams={metrics.availableTeams}
      categories={metrics.categories}
      budgetResources={metrics.budgetResources}
      headerAction={
        <CreateTransactionDialog
          categories={metrics.categories}
          budgetResources={metrics.budgetResources}
          currentUser={metrics.currentUser}
          triggerLabel="+ Novo Lançamento Financeiro"
        />
      }
    >
      <TransactionsDataTable transactions={metrics.transactions} />

      <KpiCards kpis={metrics.kpis} />
    </DashboardShell>
  );
}
