"use client";

import * as React from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrencyFromCents } from "@/lib/utils";
import type { CashFlowSummaryDTO } from "@/types/financial";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CashFlowTimelineProps {
  cashFlow: CashFlowSummaryDTO;
}

export function CashFlowTimeline({ cashFlow }: CashFlowTimelineProps) {
  const chartData = React.useMemo(
    () =>
      cashFlow.months.map((m) => ({
        name: m.monthLabel,
        Origens: m.originsCents / 100,
        Aplicacoes: m.applicationsCents / 100,
        SaldoAcumulado: m.accumulatedBalanceCents / 100,
      })),
    [cashFlow.months]
  );

  return (
    <Card
      id="fluxo-caixa"
      className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none"
    >
      <CardHeader className="p-4 sm:p-6 lg:p-7 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
              Fluxo de Caixa na Linha do Tempo
            </CardTitle>
            <CardDescription className="mt-1 text-xs text-muted-foreground">
              Origens (Verde) vs. Aplicações (Vermelho) e evolução do Saldo Acumulado
              (Linha Azul DashStack)
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 rounded-lg border border-border bg-card p-2 sm:px-4 sm:py-2 text-[11px] sm:text-xs font-semibold text-muted-foreground w-full sm:w-auto">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
              (+) Origens
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
              (-) Aplicações
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              (=) Saldo Acumulado
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 sm:space-y-7 p-4 sm:p-6 lg:p-7 pt-3">
        {/* Gráfico Recharts ComposedChart com Tokens CSS */}
        <div className="h-64 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 16, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val: number) =>
                  `R$ ${val.toLocaleString("pt-BR")}`
                }
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value) => {
                  const numValue =
                    typeof value === "number" ? value : Number(value ?? 0);
                  return formatCurrencyFromCents(Math.round(numValue * 100));
                }}
                contentStyle={{
                  borderRadius: "0.75rem",
                  borderColor: "var(--border)",
                  backgroundColor: "var(--card)",
                  color: "var(--foreground)",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Bar
                dataKey="Origens"
                name="(+) Origens"
                fill="var(--success)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="Aplicacoes"
                name="(-) Aplicações"
                fill="var(--destructive)"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Line
                type="monotone"
                dataKey="SaldoAcumulado"
                name="(=) Saldo Acumulado"
                stroke="var(--primary)"
                strokeWidth={3}
                dot={{ r: 5, fill: "var(--primary)", strokeWidth: 2, stroke: "var(--card)" }}
                activeDot={{ r: 7, fill: "var(--primary)" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela Matricial com Scroll Horizontal Suave */}
        <div className="relative w-full overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader className="bg-muted [&_tr]:border-0">
              <TableRow className="hover:bg-muted">
                <TableHead className="min-w-[180px] py-3.5 px-4 sm:px-5 text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                  Estrutura do Fluxo
                </TableHead>
                {cashFlow.months.map((m) => (
                  <TableHead
                    key={m.month}
                    className="py-3.5 px-3 sm:px-4 text-right text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap"
                  >
                    {m.monthLabel}
                  </TableHead>
                ))}
                <TableHead className="py-3.5 px-4 sm:px-5 text-right text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                  Total / Final
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* (+) Origens */}
              <TableRow className="border-b border-border">
                <TableCell className="py-3.5 sm:py-4 px-4 sm:px-5 font-semibold text-success whitespace-nowrap">
                  (+) Origens
                </TableCell>
                {cashFlow.months.map((m) => (
                  <TableCell
                    key={m.month}
                    className="py-3.5 sm:py-4 px-3 sm:px-4 text-right font-mono text-xs font-medium text-success whitespace-nowrap"
                  >
                    {formatCurrencyFromCents(m.originsCents)}
                  </TableCell>
                ))}
                <TableCell className="bg-success/5 py-3.5 sm:py-4 px-4 sm:px-5 text-right font-mono text-xs font-bold text-success whitespace-nowrap">
                  {formatCurrencyFromCents(cashFlow.totalOriginsCents)}
                </TableCell>
              </TableRow>

              {/* (-) Aplicações */}
              <TableRow className="border-b border-border">
                <TableCell className="py-3.5 sm:py-4 px-4 sm:px-5 font-semibold text-destructive whitespace-nowrap">
                  (-) Aplicações
                </TableCell>
                {cashFlow.months.map((m) => (
                  <TableCell
                    key={m.month}
                    className="py-3.5 sm:py-4 px-3 sm:px-4 text-right font-mono text-xs font-medium text-destructive whitespace-nowrap"
                  >
                    {formatCurrencyFromCents(m.applicationsCents)}
                  </TableCell>
                ))}
                <TableCell className="bg-destructive/5 py-3.5 sm:py-4 px-4 sm:px-5 text-right font-mono text-xs font-bold text-destructive whitespace-nowrap">
                  {formatCurrencyFromCents(cashFlow.totalApplicationsCents)}
                </TableCell>
              </TableRow>

              {/* (=) Saldo Mensal */}
              <TableRow className="border-b border-border bg-card">
                <TableCell className="py-3.5 sm:py-4 px-4 sm:px-5 font-semibold text-foreground whitespace-nowrap">
                  (=) Saldo Mensal
                </TableCell>
                {cashFlow.months.map((m) => (
                  <TableCell
                    key={m.month}
                    className={`py-3.5 sm:py-4 px-3 sm:px-4 text-right font-mono text-xs font-medium whitespace-nowrap ${
                      m.netBalanceCents >= 0 ? "text-foreground" : "text-destructive"
                    }`}
                  >
                    {formatCurrencyFromCents(m.netBalanceCents)}
                  </TableCell>
                ))}
                <TableCell
                  className={`py-3.5 sm:py-4 px-4 sm:px-5 text-right font-mono text-xs font-bold whitespace-nowrap ${
                    cashFlow.totalNetBalanceCents >= 0
                      ? "text-success"
                      : "text-destructive"
                  }`}
                >
                  {formatCurrencyFromCents(cashFlow.totalNetBalanceCents)}
                </TableCell>
              </TableRow>

              {/* (=) Saldo Acumulado */}
              <TableRow className="bg-primary/5">
                <TableCell className="py-3.5 sm:py-4 px-4 sm:px-5 font-bold text-primary whitespace-nowrap">
                  (=) Saldo Acumulado
                </TableCell>
                {cashFlow.months.map((m) => (
                  <TableCell
                    key={m.month}
                    className={`py-3.5 sm:py-4 px-3 sm:px-4 text-right font-mono text-xs font-bold whitespace-nowrap ${
                      m.accumulatedBalanceCents >= 0
                        ? "text-primary"
                        : "text-destructive"
                    }`}
                  >
                    {formatCurrencyFromCents(m.accumulatedBalanceCents)}
                  </TableCell>
                ))}
                <TableCell
                  className={`bg-primary/10 py-3.5 sm:py-4 px-4 sm:px-5 text-right font-mono text-xs font-extrabold whitespace-nowrap ${
                    cashFlow.finalAccumulatedBalanceCents >= 0
                      ? "text-primary"
                      : "text-destructive"
                  }`}
                >
                  {formatCurrencyFromCents(cashFlow.finalAccumulatedBalanceCents)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
