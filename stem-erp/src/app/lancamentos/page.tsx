import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { requireModuleAccess } from "@/services/auth-service";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { TransactionsDataTable } from "@/components/tables/transactions-data-table";
import { CreateTransactionDialog } from "@/components/modals/create-transaction-dialog";

export const dynamic = "force-dynamic";

export default async function LancamentosPage() {
  const [, metrics] = await Promise.all([
    requireModuleAccess("finance"),
    getDashboardMetricsAction(),
  ]);

  return (
    <DashboardShell
      title="Livro Caixa"
      subtitle="Registro e conciliação de receitas, despesas e fluxo financeiro da temporada"
      currentUser={metrics.currentUser}
      activeTeam={metrics.activeTeam}
      availableTeams={metrics.availableTeams}
      categories={metrics.categories}
      budgetResources={metrics.budgetResources}
      seasonMonths={metrics.seasonMonths}
      headerAction={
        <CreateTransactionDialog
          categories={metrics.categories}
          budgetResources={metrics.budgetResources}
          sponsors={metrics.sponsors}
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
