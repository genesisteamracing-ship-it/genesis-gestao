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
      className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4"
    >
      {/* Card 1: Orçamento Total Previsto */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                Orçamento Previsto
              </p>
              <p className="mt-2 text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight text-foreground truncate">
                {formatCurrencyFromCents(kpis.totalPlannedBudgetCents)}
              </p>
            </div>
            <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl sm:rounded-[22px] bg-chart-4/15 text-chart-4">
              <Users className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
          </div>

          <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 shrink-0 text-success" />
            <span className="font-semibold text-success">
              {kpis.totalResourcesCount} itens
            </span>
            <span className="text-muted-foreground">planejados na temporada</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Total Arrecadado / Origens */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                Total Arrecadado (Origens)
              </p>
              <p className="mt-2 text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight text-foreground truncate">
                {formatCurrencyFromCents(kpis.totalOriginsCents)}
              </p>
            </div>
            <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl sm:rounded-[22px] bg-chart-2/20 text-success">
              <LineChart className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
          </div>

          <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
            <TrendingUp className="h-4 w-4 shrink-0 text-success" />
            <span className="font-semibold text-success">
              {fundingCoveragePercentage}%
            </span>
            <span className="text-muted-foreground">de cobertura do orçamento</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Total Gasto / Aplicações */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                Total Gasto (Aplicações)
              </p>
              <p className="mt-2 text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight text-foreground truncate">
                {formatCurrencyFromCents(kpis.totalApplicationsCents)}
              </p>
            </div>
            <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl sm:rounded-[22px] bg-warning/20 text-warning">
              <Box className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
          </div>

          <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
            <TrendingDown className="h-4 w-4 shrink-0 text-destructive" />
            <span className="font-semibold text-destructive">
              {executionPercentage}%
            </span>
            <span className="text-muted-foreground">executado do orçamento</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Saldo em Caixa Atual */}
      <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                Saldo em Caixa Atual
              </p>
              <p
                className={`mt-2 text-xl sm:text-2xl lg:text-[26px] font-bold tracking-tight truncate ${
                  isPositiveBalance ? "text-success" : "text-destructive"
                }`}
              >
                {formatCurrencyFromCents(kpis.currentCashBalanceCents)}
              </p>
            </div>
            <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl sm:rounded-[22px] bg-peach/20 text-peach">
              <Clock className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
          </div>

          <div className="mt-4 sm:mt-5 flex flex-wrap items-center gap-1.5 text-xs sm:text-sm">
            {isPositiveBalance ? (
              <TrendingUp className="h-4 w-4 shrink-0 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 shrink-0 text-destructive" />
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
