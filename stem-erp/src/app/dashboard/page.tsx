import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { AppHeader } from "@/components/layout/app-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { CashFlowTimeline } from "@/components/dashboard/cash-flow-timeline";
import { PhysicalFinancialSchedule } from "@/components/dashboard/physical-financial-schedule";
import { ResourcesDataTable } from "@/components/tables/resources-data-table";
import { TransactionsDataTable } from "@/components/tables/transactions-data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const metrics = await getDashboardMetricsAction();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader
        categories={metrics.categories}
        budgetResources={metrics.budgetResources}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Topo: 4 KPI Cards */}
        <KpiCards kpis={metrics.kpis} />

        {/* Visão 1: Fluxo de Caixa na Linha do Tempo */}
        <CashFlowTimeline cashFlow={metrics.cashFlow} />

        {/* Visão 2: Cronograma Físico-Financeiro */}
        <PhysicalFinancialSchedule schedule={metrics.schedule} />

        {/* Visão 3: Plano de Recursos e Auditoria */}
        <section aria-label="Plano de Recursos e Livro Caixa Auditável">
          <Tabs defaultValue="auditoria" className="w-full">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <TabsList>
                <TabsTrigger value="auditoria">
                  Livro Caixa & Auditoria ({metrics.transactions.length})
                </TabsTrigger>
                <TabsTrigger value="recursos">
                  Plano de Recursos Orçados ({metrics.budgetResources.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="auditoria">
              <TransactionsDataTable transactions={metrics.transactions} />
            </TabsContent>

            <TabsContent value="recursos">
              <ResourcesDataTable resources={metrics.budgetResources} />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
