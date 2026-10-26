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
      title="Livro Caixa & Auditoria"
      subtitle="Rastreamento detalhado de receitas e despesas por categoria e método comprobatório"
      categories={metrics.categories}
      budgetResources={metrics.budgetResources}
      headerAction={
        <CreateTransactionDialog
          categories={metrics.categories}
          budgetResources={metrics.budgetResources}
          triggerLabel="+ Novo Lançamento Financeiro"
        />
      }
    >
      <TransactionsDataTable transactions={metrics.transactions} />

      <KpiCards kpis={metrics.kpis} />
    </DashboardShell>
  );
}
