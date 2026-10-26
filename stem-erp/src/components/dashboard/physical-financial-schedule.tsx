import * as React from "react";
import { Layers } from "lucide-react";
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
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <Layers className="h-5 w-5 text-slate-800" />
            <span>Cronograma Físico-Financeiro (Previsto vs. Realizado)</span>
          </CardTitle>
          <CardDescription>
            Acompanhamento mensal de execução orçamentária por Grupo de Entrega da
            competição STEM Racing.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="min-w-[200px] font-bold text-slate-800">
                  Grupo de Entrega
                </TableHead>
                <TableHead className="w-[100px] font-bold text-slate-700">
                  Visão
                </TableHead>
                {PROJECT_MONTHS.map((m) => (
                  <TableHead key={m} className="text-right font-semibold">
                    {PROJECT_MONTH_LABELS[m]}
                  </TableHead>
                ))}
                <TableHead className="bg-slate-100/80 text-right font-bold text-slate-900">
                  Total
                </TableHead>
                <TableHead className="min-w-[220px] font-bold text-slate-800">
                  Execução & Status de Auditoria
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
                    <TableRow className="bg-white hover:bg-slate-50/40">
                      <TableCell
                        rowSpan={2}
                        className="border-r border-slate-200 align-middle font-bold text-slate-900"
                      >
                        <div className="space-y-1">
                          <div>{groupRow.label}</div>
                          <div className="text-xs font-normal text-slate-500">
                            Desvio:{" "}
                            <span
                              className={cn(
                                "font-mono font-semibold",
                                groupRow.varianceCents >= 0
                                  ? "text-emerald-700"
                                  : "text-red-600"
                              )}
                            >
                              {formatCurrencyFromCents(groupRow.varianceCents)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Previsto
                      </TableCell>
                      {groupRow.months.map((m) => (
                        <TableCell
                          key={`plan-${groupRow.deliveryGroup}-${m.month}`}
                          className="text-right font-mono text-xs text-slate-600"
                        >
                          {m.plannedCents > 0
                            ? formatCurrencyFromCents(m.plannedCents)
                            : "—"}
                        </TableCell>
                      ))}
                      <TableCell className="bg-slate-50/60 text-right font-mono text-xs font-semibold text-slate-800">
                        {formatCurrencyFromCents(groupRow.totalPlannedCents)}
                      </TableCell>
                      <TableCell
                        rowSpan={2}
                        className="border-l border-slate-200 align-middle"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {groupRow.executionPercentage}% executado
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
                                ? "bg-red-600"
                                : isWarning
                                ? "bg-amber-500"
                                : "bg-emerald-600"
                            )}
                          />
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Sub-linha 2: REALIZADO (fundo levemente destacado) */}
                    <TableRow className="border-b-2 border-slate-200 bg-slate-50/80 hover:bg-slate-100/70">
                      <TableCell className="text-xs font-bold uppercase tracking-wide text-slate-800">
                        Realizado
                      </TableCell>
                      {groupRow.months.map((m) => {
                        const cellExceeded =
                          m.realizedCents > m.plannedCents && m.realizedCents > 0;
                        return (
                          <TableCell
                            key={`real-${groupRow.deliveryGroup}-${m.month}`}
                            className={cn(
                              "text-right font-mono text-xs font-semibold",
                              cellExceeded
                                ? "text-red-600"
                                : m.realizedCents > 0
                                ? "text-slate-900"
                                : "text-slate-400"
                            )}
                          >
                            {m.realizedCents > 0
                              ? formatCurrencyFromCents(m.realizedCents)
                              : "—"}
                          </TableCell>
                        );
                      })}
                      <TableCell
                        className={cn(
                          "bg-slate-100/90 text-right font-mono text-xs font-bold",
                          isOverBudget ? "text-red-600" : "text-slate-900"
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
