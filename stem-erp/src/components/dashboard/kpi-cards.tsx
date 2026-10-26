import {
  Box,
  Clock,
  LineChart,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn, formatCurrencyFromCents } from "@/lib/utils";
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
      {/* Card 1: Orçamento Total Previsto (Estilo Total User - Lilás) */}
      <Card className="rounded-2xl border-0 bg-white dark:bg-[#1B1D21] shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#202224]/70 dark:text-[#F5F6FA]/70">
                Orçamento Previsto
              </p>
              <p className="mt-2.5 text-[26px] font-bold tracking-tight text-[#202224] dark:text-[#F5F6FA]">
                {formatCurrencyFromCents(kpis.totalPlannedBudgetCents)}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[#8280FF]/18 text-[#8280FF]">
              <Users className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5 text-sm">
            <TrendingUp className="h-4 w-4 text-[#00B69B]" />
            <span className="font-semibold text-[#00B69B]">
              {kpis.totalResourcesCount} itens
            </span>
            <span className="text-[#606060] dark:text-[#9CA3AF]">planejados em 6 meses</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Total Arrecadado / Origens (Estilo Total Sales - Verde Menta) */}
      <Card className="rounded-2xl border-0 bg-white dark:bg-[#1B1D21] shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#202224]/70 dark:text-[#F5F6FA]/70">
                Total Arrecadado (Origens)
              </p>
              <p className="mt-2.5 text-[26px] font-bold tracking-tight text-[#202224] dark:text-[#F5F6FA]">
                {formatCurrencyFromCents(kpis.totalOriginsCents)}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[#4AD991]/20 text-[#00B69B]">
              <LineChart className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5 text-sm">
            <TrendingUp className="h-4 w-4 text-[#00B69B]" />
            <span className="font-semibold text-[#00B69B]">
              {fundingCoveragePercentage}%
            </span>
            <span className="text-[#606060] dark:text-[#9CA3AF]">de cobertura do orçamento</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 3: Total Gasto / Aplicações (Estilo Total Order - Amarelo/Âmbar) */}
      <Card className="rounded-2xl border-0 bg-white dark:bg-[#1B1D21] shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#202224]/70 dark:text-[#F5F6FA]/70">
                Total Gasto (Aplicações)
              </p>
              <p className="mt-2.5 text-[26px] font-bold tracking-tight text-[#202224] dark:text-[#F5F6FA]">
                {formatCurrencyFromCents(kpis.totalApplicationsCents)}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[#FEC53D]/22 text-[#E5A400]">
              <Box className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5 text-sm">
            <TrendingDown className="h-4 w-4 text-[#F93C65]" />
            <span className="font-semibold text-[#F93C65]">
              {executionPercentage}%
            </span>
            <span className="text-[#606060] dark:text-[#9CA3AF]">executado do orçamento</span>
          </div>
        </CardContent>
      </Card>

      {/* Card 4: Saldo em Caixa Atual (Estilo Total Pending - Pêssego/Coral) */}
      <Card className="rounded-2xl border-0 bg-white dark:bg-[#1B1D21] shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#202224]/70 dark:text-[#F5F6FA]/70">
                Saldo em Caixa Atual
              </p>
              <p
                className={cn(
                  "mt-2.5 text-[26px] font-bold tracking-tight",
                  isPositiveBalance ? "text-[#00B69B]" : "text-[#F93C65]"
                )}
              >
                {formatCurrencyFromCents(kpis.currentCashBalanceCents)}
              </p>
            </div>
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[#FF9066]/20 text-[#FF9066]">
              <Clock className="h-7 w-7" />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-1.5 text-sm">
            {isPositiveBalance ? (
              <TrendingUp className="h-4 w-4 text-[#00B69B]" />
            ) : (
              <TrendingDown className="h-4 w-4 text-[#F93C65]" />
            )}
            <span
              className={cn(
                "font-semibold",
                isPositiveBalance ? "text-[#00B69B]" : "text-[#F93C65]"
              )}
            >
              {marginPercentage}%
            </span>
            <span className="text-[#606060] dark:text-[#9CA3AF]">
              {isPositiveBalance ? "Margem positiva em caixa" : "Déficit acumulado"}
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
