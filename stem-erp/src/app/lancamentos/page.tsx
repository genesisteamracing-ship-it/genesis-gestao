import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { AppHeader } from "@/components/layout/app-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { TransactionsDataTable } from "@/components/tables/transactions-data-table";
import { CreateTransactionDialog } from "@/components/modals/create-transaction-dialog";

export const dynamic = "force-dynamic";

export default async function LancamentosPage() {
  const metrics = await getDashboardMetricsAction();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        categories={metrics.categories}
        budgetResources={metrics.budgetResources}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Livro Caixa Auditável (Realizado)
            </h1>
            <p className="text-sm text-slate-600">
              Registro comprobatório de Origens (Receitas/Patrocínios) e Aplicações
              (Despesas) para auditoria STEM Racing.
            </p>
          </div>
          <CreateTransactionDialog
            categories={metrics.categories}
            budgetResources={metrics.budgetResources}
            triggerLabel="+ Novo Lançamento Financeiro"
          />
        </div>

        <KpiCards kpis={metrics.kpis} />

        <TransactionsDataTable transactions={metrics.transactions} />
      </main>
    </div>
  );
}
