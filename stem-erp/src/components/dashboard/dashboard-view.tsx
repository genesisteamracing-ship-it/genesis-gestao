"use client";

import * as React from "react";
import type { DashboardMetricsDTO } from "@/types/financial";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { CashFlowTimeline } from "@/components/dashboard/cash-flow-timeline";
import { PhysicalFinancialSchedule } from "@/components/dashboard/physical-financial-schedule";
import { CreateBudgetResourceDialog } from "@/components/modals/create-budget-resource-dialog";
import { CreateTransactionDialog } from "@/components/modals/create-transaction-dialog";

interface DashboardViewProps {
  initialMetrics: DashboardMetricsDTO;
}

export function DashboardView({ initialMetrics }: DashboardViewProps) {
  const { metrics } = useDashboardMetrics({ initialData: initialMetrics });
  const data = metrics ?? initialMetrics;

  return (
    <DashboardShell
      title="Dashboard"
      currentUser={data.currentUser}
      activeTeam={data.activeTeam}
      availableTeams={data.availableTeams}
      categories={data.categories}
      budgetResources={data.budgetResources}
      seasonMonths={data.seasonMonths}
      headerAction={
        <div className="flex flex-wrap items-center gap-2.5">
          <CreateBudgetResourceDialog
            categories={data.categories}
            teamMembers={data.teamMembers}
            currentUser={data.currentUser}
            triggerLabel="+ Planejar Recurso"
          />
          <CreateTransactionDialog
            categories={data.categories}
            budgetResources={data.budgetResources}
            sponsors={data.sponsors}
            currentUser={data.currentUser}
            triggerLabel="+ Lançar Transação"
          />
        </div>
      }
    >
      {/* Topo: 4 KPI Cards no estilo DashStack */}
      <KpiCards kpis={data.kpis} />

      {/* Visão 1: Fluxo de Caixa na Linha do Tempo */}
      <CashFlowTimeline cashFlow={data.cashFlow} />

      {/* Visão 2: Cronograma Físico-Financeiro */}
      <PhysicalFinancialSchedule schedule={data.schedule} />
    </DashboardShell>
  );
}
