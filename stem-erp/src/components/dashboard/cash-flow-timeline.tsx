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
import { TrendingUp } from "lucide-react";
import { cn, formatCurrencyFromCents } from "@/lib/utils";
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
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <TrendingUp className="h-5 w-5 text-slate-800" />
              <span>Fluxo de Caixa na Linha do Tempo (Mês 1 a Mês 6)</span>
            </CardTitle>
            <CardDescription>
              Comparativo mensal entre Origens (Entradas), Aplicações (Saídas) e
              evolução do Saldo Acumulado.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" />
              (+) Origens
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-red-500" />
              (-) Aplicações
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-900" />
              (=) Saldo Acumulado
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Gráfico Recharts ComposedChart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#475569" }}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <YAxis
                tickFormatter={(val: number) =>
                  `R$ ${val.toLocaleString("pt-BR")}`
                }
                tick={{ fontSize: 12, fill: "#475569" }}
                axisLine={{ stroke: "#cbd5e1" }}
              />
              <Tooltip
                formatter={(value) => {
                  const numValue = typeof value === "number" ? value : Number(value ?? 0);
                  return formatCurrencyFromCents(Math.round(numValue * 100));
                }}
                contentStyle={{
                  borderRadius: "0.5rem",
                  borderColor: "#e2e8f0",
                  fontSize: "0.75rem",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
              <Bar
                dataKey="Origens"
                name="(+) Origens"
                fill="#059669"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
              <Bar
                dataKey="Aplicacoes"
                name="(-) Aplicações"
                fill="#ef4444"
                radius={[4, 4, 0, 0]}
                maxBarSize={38}
              />
              <Line
                type="monotone"
                dataKey="SaldoAcumulado"
                name="(=) Saldo Acumulado"
                stroke="#1e3a8a"
                strokeWidth={3}
                dot={{ r: 4, fill: "#1e3a8a", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela Matricial de Fluxo de Caixa */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="min-w-[180px] font-bold text-slate-800">
                  Estrutura do Fluxo
                </TableHead>
                {cashFlow.months.map((m) => (
                  <TableHead key={m.month} className="text-right font-semibold">
                    {m.monthLabel}
                  </TableHead>
                ))}
                <TableHead className="bg-slate-100/80 text-right font-bold text-slate-900">
                  Total / Final
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* (+) Origens */}
              <TableRow>
                <TableCell className="font-semibold text-emerald-700">
                  (+) Origens
                </TableCell>
                {cashFlow.months.map((m) => (
                  <TableCell
                    key={m.month}
                    className="text-right font-mono text-xs text-emerald-700"
                  >
                    {formatCurrencyFromCents(m.originsCents)}
                  </TableCell>
                ))}
                <TableCell className="bg-emerald-50/50 text-right font-mono text-xs font-bold text-emerald-800">
                  {formatCurrencyFromCents(cashFlow.totalOriginsCents)}
                </TableCell>
              </TableRow>

              {/* (-) Aplicações */}
              <TableRow>
                <TableCell className="font-semibold text-red-600">
                  (-) Aplicações
                </TableCell>
                {cashFlow.months.map((m) => (
                  <TableCell
                    key={m.month}
                    className="text-right font-mono text-xs text-red-600"
                  >
                    {formatCurrencyFromCents(m.applicationsCents)}
                  </TableCell>
                ))}
                <TableCell className="bg-red-50/50 text-right font-mono text-xs font-bold text-red-700">
                  {formatCurrencyFromCents(cashFlow.totalApplicationsCents)}
                </TableCell>
              </TableRow>

              {/* (=) Saldo Mensal */}
              <TableRow className="bg-slate-50/50">
                <TableCell className="font-semibold text-slate-800">
                  (=) Saldo Mensal
                </TableCell>
                {cashFlow.months.map((m) => (
                  <TableCell
                    key={m.month}
                    className={cn(
                      "text-right font-mono text-xs font-medium",
                      m.netBalanceCents >= 0 ? "text-slate-800" : "text-red-600"
                    )}
                  >
                    {formatCurrencyFromCents(m.netBalanceCents)}
                  </TableCell>
                ))}
                <TableCell
                  className={cn(
                    "bg-slate-100/70 text-right font-mono text-xs font-bold",
                    cashFlow.totalNetBalanceCents >= 0
                      ? "text-emerald-700"
                      : "text-red-600"
                  )}
                >
                  {formatCurrencyFromCents(cashFlow.totalNetBalanceCents)}
                </TableCell>
              </TableRow>

              {/* (=) Saldo Acumulado */}
              <TableRow className="border-t-2 border-slate-200 bg-blue-950/[0.03]">
                <TableCell className="font-bold text-blue-950">
                  (=) Saldo Acumulado
                </TableCell>
                {cashFlow.months.map((m) => (
                  <TableCell
                    key={m.month}
                    className={cn(
                      "text-right font-mono text-xs font-bold",
                      m.accumulatedBalanceCents >= 0
                        ? "text-blue-950"
                        : "text-red-600"
                    )}
                  >
                    {formatCurrencyFromCents(m.accumulatedBalanceCents)}
                  </TableCell>
                ))}
                <TableCell
                  className={cn(
                    "bg-blue-950/10 text-right font-mono text-xs font-extrabold",
                    cashFlow.finalAccumulatedBalanceCents >= 0
                      ? "text-blue-950"
                      : "text-red-600"
                  )}
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
