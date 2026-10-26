import * as React from "react";
import { PROJECT_MONTHS, PROJECT_MONTH_LABELS } from "@/lib/constants";
import { cn, formatCurrencyFromCents } from "@/lib/utils";
import type { DeliveryGroupScheduleRow } from "@/types/financial";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PhysicalFinancialScheduleProps {
  schedule: DeliveryGroupScheduleRow[];
}

export function PhysicalFinancialSchedule({
  schedule,
}: PhysicalFinancialScheduleProps) {
  return (
    <Card
      id="cronograma"
      className="rounded-2xl border-0 bg-white dark:bg-[#1B1D21] shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none"
    >
      <CardHeader className="p-7 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-[#202224] dark:text-[#F5F6FA]">
              Cronograma Físico-Financeiro (Previsto vs. Realizado)
            </CardTitle>
            <CardDescription className="mt-1 text-xs text-[#606060] dark:text-[#9CA3AF]">
              Comparativo mensal por Grupo de Entrega com variação orçamentária e
              status de auditoria.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-7 pt-2">
        <div className="overflow-hidden rounded-xl border border-[#E8E8E8]/80 dark:border-[#2E3138]">
          <Table>
            <TableHeader className="bg-[#F1F4F9] dark:bg-[#202226] [&_tr]:border-0">
              <TableRow className="hover:bg-[#F1F4F9] dark:hover:bg-[#202226]">
                <TableHead className="min-w-[200px] py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-[#202224] dark:text-[#F5F6FA]">
                  Grupo de Entrega
                </TableHead>
                <TableHead className="w-[100px] py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-[#202224] dark:text-[#F5F6FA]">
                  Visão
                </TableHead>
                {PROJECT_MONTHS.map((m) => (
                  <TableHead
                    key={m}
                    className="py-3.5 px-3 text-right text-xs font-bold uppercase tracking-wider text-[#202224] dark:text-[#F5F6FA]"
                  >
                    {PROJECT_MONTH_LABELS[m]}
                  </TableHead>
                ))}
                <TableHead className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-[#202224] dark:text-[#F5F6FA]">
                  Total
                </TableHead>
                <TableHead className="min-w-[230px] py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-[#202224] dark:text-[#F5F6FA]">
                  Execução & Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.map((groupRow) => {
                const isOverBudget = groupRow.status === "DESTRUCTIVE";
                const isWarning = groupRow.status === "WARNING";

                return (
                  <React.Fragment key={groupRow.deliveryGroup}>
                    {/* Sub-linha 1: PREVISTO (fundo neutro) */}
                    <TableRow className="border-b border-[#E8E8E8]/50 dark:border-[#2E3138] bg-white dark:bg-[#1B1D21] hover:bg-[#FAFBFD] dark:hover:bg-[#23262B]">
                      <TableCell
                        rowSpan={2}
                        className="border-r border-[#E8E8E8]/70 dark:border-[#2E3138] py-4 px-5 align-middle font-bold text-[#202224] dark:text-[#F5F6FA]"
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-[#202224] dark:text-[#F5F6FA]">
                            {groupRow.label}
                          </div>
                          <div className="text-xs font-normal text-[#606060] dark:text-[#9CA3AF]">
                            Variação:{" "}
                            <span
                              className={cn(
                                "font-mono font-bold",
                                groupRow.varianceCents >= 0
                                  ? "text-[#00B69B]"
                                  : "text-[#EF3826]"
                              )}
                            >
                              {formatCurrencyFromCents(groupRow.varianceCents)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5 px-4 text-xs font-semibold uppercase tracking-wide text-[#606060] dark:text-[#9CA3AF]">
                        Previsto
                      </TableCell>
                      {groupRow.months.map((m) => (
                        <TableCell
                          key={`plan-${groupRow.deliveryGroup}-${m.month}`}
                          className="py-3.5 px-3 text-right font-mono text-xs text-[#606060] dark:text-[#9CA3AF]"
                        >
                          {m.plannedCents > 0
                            ? formatCurrencyFromCents(m.plannedCents)
                            : "-"}
                        </TableCell>
                      ))}
                      <TableCell className="bg-[#FAFBFD] dark:bg-[#202226] py-3.5 px-4 text-right font-mono text-xs font-semibold text-[#202224] dark:text-[#F5F6FA]">
                        {formatCurrencyFromCents(groupRow.totalPlannedCents)}
                      </TableCell>
                      <TableCell
                        rowSpan={2}
                        className="border-l border-[#E8E8E8]/70 dark:border-[#2E3138] py-4 px-5 align-middle"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-[#202224] dark:text-[#F5F6FA]">
                              {groupRow.executionPercentage}%
                            </span>
                            <Badge
                              variant={
                                isOverBudget
                                  ? "destructive"
                                  : isWarning
                                  ? "warning"
                                  : "success"
                              }
                            >
                              {groupRow.statusLabel}
                            </Badge>
                          </div>
                          <Progress
                            value={Math.min(groupRow.executionPercentage, 100)}
                            indicatorClassName={cn(
                              isOverBudget
                                ? "bg-[#EF3826]"
                                : isWarning
                                ? "bg-[#FFA756]"
                                : "bg-[#00B69B]"
                            )}
                          />
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Sub-linha 2: REALIZADO (fundo levemente destacado) */}
                    <TableRow className="border-b-2 border-[#E8E8E8] dark:border-[#2E3138] bg-[#F9F9FB] dark:bg-[#202226] hover:bg-[#F1F4F9]/60 dark:hover:bg-[#23262B]">
                      <TableCell className="py-3.5 px-4 text-xs font-bold uppercase tracking-wide text-[#202224] dark:text-[#F5F6FA]">
                        Realizado
                      </TableCell>
                      {groupRow.months.map((m) => {
                        const cellExceeded =
                          m.realizedCents > m.plannedCents && m.realizedCents > 0;
                        return (
                          <TableCell
                            key={`real-${groupRow.deliveryGroup}-${m.month}`}
                            className={cn(
                              "py-3.5 px-3 text-right font-mono text-xs font-semibold",
                              cellExceeded
                                ? "text-[#EF3826]"
                                : m.realizedCents > 0
                                ? "text-[#202224] dark:text-[#F5F6FA]"
                                : "text-[#202224]/30 dark:text-[#F5F6FA]/30"
                            )}
                          >
                            {m.realizedCents > 0
                              ? formatCurrencyFromCents(m.realizedCents)
                              : "-"}
                          </TableCell>
                        );
                      })}
                      <TableCell
                        className={cn(
                          "bg-[#F1F4F9]/70 dark:bg-[#202226] py-3.5 px-4 text-right font-mono text-xs font-bold",
                          isOverBudget ? "text-[#EF3826]" : "text-[#202224] dark:text-[#F5F6FA]"
                        )}
                      >
                        {formatCurrencyFromCents(groupRow.totalRealizedCents)}
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
