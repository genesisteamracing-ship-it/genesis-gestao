import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TransactionsDataTable } from "@/components/tables/transactions-data-table";
import { CreateTransactionDialog } from "@/components/modals/create-transaction-dialog";

export const dynamic = "force-dynamic";

export default async function LancamentosPage() {
  const metrics = await getDashboardMetricsAction();

  return (
    <DashboardShell
      title="Livro Caixa"
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
          triggerLabel="+ Lançar Transação"
        />
      }
    >
      <TransactionsDataTable
        transactions={metrics.transactions}
        categories={metrics.categories}
        budgetResources={metrics.budgetResources}
      />
    </DashboardShell>
  );
}
