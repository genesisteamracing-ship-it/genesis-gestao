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
    <Card
      id="fluxo-caixa"
      className="rounded-2xl border-0 bg-white dark:bg-[#1B1D21] shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none"
    >
      <CardHeader className="p-7 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-[#202224] dark:text-[#F5F6FA]">
              Fluxo de Caixa na Linha do Tempo
            </CardTitle>
            <CardDescription className="mt-1 text-xs text-[#606060] dark:text-[#9CA3AF]">
              Origens (Verde) vs. Aplicações (Vermelho) e evolução do Saldo Acumulado
              (Linha Azul DashStack)
            </CardDescription>
          </div>

          <div className="inline-flex items-center gap-4 rounded-lg border border-[#D5D5D5]/80 dark:border-[#2E3138] bg-[#FCFDFD] dark:bg-[#202226] px-4 py-2 text-xs font-semibold text-[#202224]/80 dark:text-[#F5F6FA]/80">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#00B69B]" />
              (+) Origens
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F93C65]" />
              (-) Aplicações
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#4880FF]" />
              (=) Saldo Acumulado
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-7 p-7 pt-3">
        {/* Gráfico Recharts ComposedChart */}
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 16, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#EAEAEA"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#202224", opacity: 0.65 }}
                axisLine={{ stroke: "#EAEAEA" }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(val: number) =>
                  `R$ ${val.toLocaleString("pt-BR")}`
                }
                tick={{ fontSize: 12, fill: "#202224", opacity: 0.65 }}
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
                  borderColor: "#E8E8E8",
                  boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Bar
                dataKey="Origens"
                name="(+) Origens"
                fill="#00B69B"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="Aplicacoes"
                name="(-) Aplicações"
                fill="#F93C65"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
              />
              <Line
                type="monotone"
                dataKey="SaldoAcumulado"
                name="(=) Saldo Acumulado"
                stroke="#4880FF"
                strokeWidth={3}
                dot={{ r: 5, fill: "#4880FF", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 7, fill: "#4880FF" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Tabela Matricial estilo Deals Details */}
        <div className="overflow-hidden rounded-xl border border-[#E8E8E8]/80 dark:border-[#2E3138]">
          <Table>
            <TableHeader className="bg-[#F1F4F9] dark:bg-[#202226] [&_tr]:border-0">
              <TableRow className="hover:bg-[#F1F4F9] dark:hover:bg-[#202226]">
                <TableHead className="min-w-[180px] py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-[#202224] dark:text-[#F5F6FA]">
                  Estrutura do Fluxo
                </TableHead>
                {cashFlow.months.map((m) => (
                  <TableHead
                    key={m.month}
                    className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-[#202224] dark:text-[#F5F6FA]"
                  >
                    {m.monthLabel}
                  </TableHead>
                ))}
                <TableHead className="py-3.5 px-5 text-right text-xs font-bold uppercase tracking-wider text-[#202224] dark:text-[#F5F6FA]">
                  Total / Final
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* (+) Origens */}
              <TableRow className="border-b border-[#E8E8E8]/70 dark:border-[#2E3138]">
                <TableCell className="py-4 px-5 font-semibold text-[#00B69B]">
                  (+) Origens
                </TableCell>
                {cashFlow.months.map((m) => (
                  <TableCell
                    key={m.month}
                    className="py-4 px-4 text-right font-mono text-xs font-medium text-[#00B69B]"
                  >
                    {formatCurrencyFromCents(m.originsCents)}
                  </TableCell>
                ))}
                <TableCell className="bg-[#00B69B]/5 py-4 px-5 text-right font-mono text-xs font-bold text-[#00B69B]">
                  {formatCurrencyFromCents(cashFlow.totalOriginsCents)}
                </TableCell>
              </TableRow>

              {/* (-) Aplicações */}
              <TableRow className="border-b border-[#E8E8E8]/70 dark:border-[#2E3138]">
                <TableCell className="py-4 px-5 font-semibold text-[#F93C65]">
                  (-) Aplicações
                </TableCell>
                {cashFlow.months.map((m) => (
                  <TableCell
                    key={m.month}
                    className="py-4 px-4 text-right font-mono text-xs font-medium text-[#F93C65]"
                  >
                    {formatCurrencyFromCents(m.applicationsCents)}
                  </TableCell>
                ))}
                <TableCell className="bg-[#F93C65]/5 py-4 px-5 text-right font-mono text-xs font-bold text-[#F93C65]">
                  {formatCurrencyFromCents(cashFlow.totalApplicationsCents)}
                </TableCell>
              </TableRow>

              {/* (=) Saldo Mensal */}
              <TableRow className="border-b border-[#E8E8E8]/70 dark:border-[#2E3138] bg-[#FAFBFD] dark:bg-[#202226]">
                <TableCell className="py-4 px-5 font-semibold text-[#202224] dark:text-[#F5F6FA]">
                  (=) Saldo Mensal
                </TableCell>
                {cashFlow.months.map((m) => (
                  <TableCell
                    key={m.month}
                    className={cn(
                      "py-4 px-4 text-right font-mono text-xs font-medium",
                      m.netBalanceCents >= 0 ? "text-[#202224] dark:text-[#F5F6FA]" : "text-[#F93C65]"
                    )}
                  >
                    {formatCurrencyFromCents(m.netBalanceCents)}
                  </TableCell>
                ))}
                <TableCell
                  className={cn(
                    "py-4 px-5 text-right font-mono text-xs font-bold",
                    cashFlow.totalNetBalanceCents >= 0
                      ? "text-[#00B69B]"
                      : "text-[#F93C65]"
                  )}
                >
                  {formatCurrencyFromCents(cashFlow.totalNetBalanceCents)}
                </TableCell>
              </TableRow>

              {/* (=) Saldo Acumulado */}
              <TableRow className="bg-[#4880FF]/5">
                <TableCell className="py-4 px-5 font-bold text-[#4880FF]">
                  (=) Saldo Acumulado
                </TableCell>
                {cashFlow.months.map((m) => (
                  <TableCell
                    key={m.month}
                    className={cn(
                      "py-4 px-4 text-right font-mono text-xs font-bold",
                      m.accumulatedBalanceCents >= 0
                        ? "text-[#4880FF]"
                        : "text-[#F93C65]"
                    )}
                  >
                    {formatCurrencyFromCents(m.accumulatedBalanceCents)}
                  </TableCell>
                ))}
                <TableCell
                  className={cn(
                    "bg-[#4880FF]/10 py-4 px-5 text-right font-mono text-xs font-extrabold",
                    cashFlow.finalAccumulatedBalanceCents >= 0
                      ? "text-[#4880FF]"
                      : "text-[#F93C65]"
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
