import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
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
    <DashboardShell
      title="Dashboard"
      categories={metrics.categories}
      budgetResources={metrics.budgetResources}
    >
      {/* Topo: 4 KPI Cards no estilo DashStack (financial.png) */}
      <KpiCards kpis={metrics.kpis} />

      {/* Visão 1: Fluxo de Caixa na Linha do Tempo */}
      <CashFlowTimeline cashFlow={metrics.cashFlow} />

      {/* Visão 2: Cronograma Físico-Financeiro */}
      <PhysicalFinancialSchedule schedule={metrics.schedule} />

      {/* Visão 3: Plano de Recursos e Auditoria com filtro segmentado e paginação */}
      <section aria-label="Plano de Recursos e Livro Caixa Auditável" className="space-y-4">
        <Tabs defaultValue="auditoria" className="w-full">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-[#202224]">
              Detalhamento Auditável
            </h2>
            <TabsList className="bg-white border border-[#D5D5D5]">
              <TabsTrigger
                value="auditoria"
                className="data-[state=active]:bg-[#4880FF] data-[state=active]:text-white font-semibold"
              >
                Livro Caixa & Auditoria ({metrics.transactions.length})
              </TabsTrigger>
              <TabsTrigger
                value="recursos"
                className="data-[state=active]:bg-[#4880FF] data-[state=active]:text-white font-semibold"
              >
                Plano de Recursos Orçados ({metrics.budgetResources.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="auditoria" className="mt-4">
            <TransactionsDataTable transactions={metrics.transactions} />
          </TabsContent>

          <TabsContent value="recursos" className="mt-4">
            <ResourcesDataTable resources={metrics.budgetResources} />
          </TabsContent>
        </Tabs>
      </section>
    </DashboardShell>
  );
}
