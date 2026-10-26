import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { AppHeader } from "@/components/layout/app-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { PhysicalFinancialSchedule } from "@/components/dashboard/physical-financial-schedule";
import { ResourcesDataTable } from "@/components/tables/resources-data-table";
import { CreateBudgetResourceDialog } from "@/components/modals/create-budget-resource-dialog";

export const dynamic = "force-dynamic";

export default async function PlanejamentoPage() {
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
              Planejamento de Recursos & Orçamento
            </h1>
            <p className="text-sm text-slate-600">
              Alocação de recursos, previsão de utilização (%) e orçamento por Grupo de
              Entrega (Mês 1 a Mês 6).
            </p>
          </div>
          <CreateBudgetResourceDialog
            categories={metrics.categories}
            triggerLabel="+ Novo Recurso Planejado"
          />
        </div>

        <KpiCards kpis={metrics.kpis} />

        <ResourcesDataTable resources={metrics.budgetResources} />

        <PhysicalFinancialSchedule schedule={metrics.schedule} />
      </main>
    </div>
  );
}
