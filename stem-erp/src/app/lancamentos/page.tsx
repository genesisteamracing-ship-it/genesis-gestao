import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { TransactionsDataTable } from "@/components/tables/transactions-data-table";
import { CreateTransactionDialog } from "@/components/modals/create-transaction-dialog";

export const dynamic = "force-dynamic";

export default async function LancamentosPage() {
  const metrics = await getDashboardMetricsAction();
  const isSuperAdmin = metrics.currentUser.role === "SUPER_ADMIN";

  return (
    <DashboardShell
      title="Livro Caixa & Auditoria"
      subtitle={
        isSuperAdmin
          ? "Rastreamento global de receitas e despesas de todas as equipes"
          : `Livro caixa exclusivo da equipe ${
              metrics.currentUser.deliveryGroup
                ? DELIVERY_GROUP_LABELS[metrics.currentUser.deliveryGroup]
                : ""
            }`
      }
      currentUser={metrics.currentUser}
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
