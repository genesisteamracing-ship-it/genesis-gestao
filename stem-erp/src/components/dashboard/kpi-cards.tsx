import {
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  Wallet,
} from "lucide-react";
import { cn, formatCurrencyFromCents } from "@/lib/utils";
import type { DashboardKPIsDTO } from "@/types/financial";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface KpiCardsProps {
  kpis: DashboardKPIsDTO;
}

export function KpiCards({ kpis }: KpiCardsProps) {
  const isPositiveBalance = kpis.currentCashBalanceCents >= 0;
  const executionRatio =
    kpis.totalPlannedBudgetCents > 0
      ? Math.round(
          (kpis.totalApplicationsCents / kpis.totalPlannedBudgetCents) * 100
        )
      : 0;

  return (
    <section
      aria-label="Indicadores Financeiros Principais"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {/* 1. Orçamento Total Previsto */}
      <Card className="border-slate-200/90">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Orçamento Total Previsto
          </CardTitle>
          <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
            <Calculator className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-slate-900">
            {formatCurrencyFromCents(kpis.totalPlannedBudgetCents)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {kpis.totalResourcesCount} recursos planejados no ciclo de 6 meses
          </p>
        </CardContent>
      </Card>

      {/* 2. Total Arrecadado (Origens) */}
      <Card className="border-emerald-200/70 bg-emerald-50/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Total Arrecadado (Origens)
          </CardTitle>
          <div className="rounded-lg bg-emerald-100 p-2 text-emerald-700">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-emerald-700">
            {formatCurrencyFromCents(kpis.totalOriginsCents)}
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Patrocínios financeiros, permutas e eventos
          </p>
        </CardContent>
      </Card>

      {/* 3. Total Gasto (Aplicações) */}
      <Card className="border-red-200/70 bg-red-50/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-red-800">
            Total Gasto (Aplicações)
          </CardTitle>
          <div className="rounded-lg bg-red-100 p-2 text-red-700">
            <ArrowDownRight className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-red-700">
            {formatCurrencyFromCents(kpis.totalApplicationsCents)}
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {executionRatio}% do orçamento previsto já executado
          </p>
        </CardContent>
      </Card>

      {/* 4. Saldo em Caixa Atual */}
      <Card
        className={cn(
          "border-2",
          isPositiveBalance
            ? "border-emerald-500/40 bg-emerald-50/40"
            : "border-red-500/50 bg-red-50/40"
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-700">
            Saldo em Caixa Atual
          </CardTitle>
          <div
            className={cn(
              "rounded-lg p-2",
              isPositiveBalance
                ? "bg-emerald-600 text-white"
                : "bg-red-600 text-white"
            )}
          >
            <Wallet className="h-4 w-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              "text-2xl font-bold tracking-tight",
              isPositiveBalance ? "text-emerald-700" : "text-red-600"
            )}
          >
            {formatCurrencyFromCents(kpis.currentCashBalanceCents)}
          </div>
          <p className="mt-1 text-xs text-slate-600">
            {isPositiveBalance
              ? "Fluxo superavitário (Origens ≥ Aplicações)"
              : "Atenção: Déficit de caixa acumulado"}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
