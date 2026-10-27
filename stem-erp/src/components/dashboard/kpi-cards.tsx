import {
  Box,
  Clock,
  LineChart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { formatCurrencyFromCents } from "@/lib/utils";
import type { DashboardKPIsDTO } from "@/types/financial";
import { Card, CardContent } from "@/components/ui/card";

interface KpiCardsProps {
  kpis: DashboardKPIsDTO;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const isPositiveBalance = kpis.currentCashBalanceCents >= 0;

  const executionPercentage =
    kpis.totalPlannedBudgetCents > 0
      ? ((kpis.totalApplicationsCents / kpis.totalPlannedBudgetCents) * 100).toFixed(1)
      : "0.0";

  const fundingCoveragePercentage =
    kpis.totalPlannedBudgetCents > 0
      ? ((kpis.totalOriginsCents / kpis.totalPlannedBudgetCents) * 100).toFixed(1)
      : "0.0";

  const marginPercentage =
    kpis.totalOriginsCents > 0
      ? ((kpis.currentCashBalanceCents / kpis.totalOriginsCents) * 100).toFixed(1)
      : "0.0";

  return (
    <section
      aria-label="Indicadores Financeiros Principais"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4"
    >
      {/* Card 1: Orçamento Total Previsto */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Orçamento Previsto
              </p>
              <p className="mt-2.5 text-[26px] font-bold tracking-tight text-foreground">
                {formatCurrencyFromCents(kpis.totalPlannedBudgetCents)}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-chart-4/15 text-chart-4">
              <Users className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5 text-sm">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="font-semibold text-success">
              {kpis.totalResourcesCount} itens
            </span>
            <span className="text-muted-foreground">planejados em 6 meses</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Total Arrecadado / Origens */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Arrecadado (Origens)
              </p>
              <p className="mt-2.5 text-[26px] font-bold tracking-tight text-foreground">
                {formatCurrencyFromCents(kpis.totalOriginsCents)}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-chart-2/20 text-success">
              <LineChart className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5 text-sm">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="font-semibold text-success">
              {fundingCoveragePercentage}%
            </span>
            <span className="text-muted-foreground">de cobertura do orçamento</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Total Gasto / Aplicações */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Gasto (Aplicações)
              </p>
              <p className="mt-2.5 text-[26px] font-bold tracking-tight text-foreground">
                {formatCurrencyFromCents(kpis.totalApplicationsCents)}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-warning/20 text-warning">
              <Box className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5 text-sm">
            <TrendingDown className="h-4 w-4 text-destructive" />
            <span className="font-semibold text-destructive">
              {executionPercentage}%
            </span>
            <span className="text-muted-foreground">executado do orçamento</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Saldo em Caixa Atual */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Saldo em Caixa Atual
              </p>
              <p
                className={`mt-2.5 text-[26px] font-bold tracking-tight ${
                  isPositiveBalance ? "text-success" : "text-destructive"
                }`}
              >
                {formatCurrencyFromCents(kpis.currentCashBalanceCents)}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-peach/20 text-peach">
              <Clock className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5 text-sm">
            {isPositiveBalance ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
            <span
              className={`font-semibold ${
                isPositiveBalance ? "text-success" : "text-destructive"
              }`}
            >
              {marginPercentage}%
            </span>
            <span className="text-muted-foreground">
              {isPositiveBalance ? "Margem positiva em caixa" : "Déficit acumulado"}
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
