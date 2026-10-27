"use client";

import * as React from "react";
import { formatCurrencyFromCents } from "@/lib/utils";
import { useSeasonMonths } from "@/providers/season-provider";
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
  const seasonMonths = useSeasonMonths();

  return (
    <Card
      id="cronograma"
      className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)] dark:shadow-none"
    >
      <CardHeader className="p-4 sm:p-6 lg:p-7 pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
              Cronograma Físico-Financeiro (Previsto vs. Realizado)
            </CardTitle>
            <CardDescription className="mt-1 text-xs text-muted-foreground">
              Comparativo mensal por Grupo de Entrega com variação orçamentária e
              status de auditoria.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 lg:p-7 pt-2">
        <div className="relative w-full overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader className="bg-muted [&_tr]:border-0">
              <TableRow className="hover:bg-muted">
                <TableHead className="min-w-[200px] py-3.5 px-4 sm:px-5 text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                  Grupo de Entrega
                </TableHead>
                <TableHead className="w-[100px] py-3.5 px-3 sm:px-4 text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                  Visão
                </TableHead>
                {seasonMonths.map((m) => (
                  <TableHead
                    key={m.index}
                    className="py-3.5 px-3 text-right text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap"
                  >
                    {m.label}
                  </TableHead>
                ))}
                <TableHead className="py-3.5 px-4 text-right text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                  Total
                </TableHead>
                <TableHead className="min-w-[220px] py-3.5 px-4 sm:px-5 text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
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
                    {/* Sub-linha 1: PREVISTO */}
                    <TableRow className="border-b border-border/50 bg-card hover:bg-muted/30">
                      <TableCell
                        rowSpan={2}
                        className="border-r border-border py-3.5 sm:py-4 px-4 sm:px-5 align-middle font-bold text-foreground whitespace-nowrap"
                      >
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-foreground">
                            {groupRow.label}
                          </div>
                          <div className="text-xs font-normal text-muted-foreground">
                            Variação:{" "}
                            <span
                              className={`font-mono font-bold ${
                                groupRow.varianceCents >= 0
                                  ? "text-success"
                                  : "text-destructive"
                              }`}
                            >
                              {formatCurrencyFromCents(groupRow.varianceCents)}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 px-3 sm:px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">
                        Previsto
                      </TableCell>
                      {groupRow.months.map((m) => (
                        <TableCell
                          key={`plan-${groupRow.deliveryGroup}-${m.month}`}
                          className="py-3 px-3 text-right font-mono text-xs text-muted-foreground whitespace-nowrap"
                        >
                          {m.plannedCents > 0
                            ? formatCurrencyFromCents(m.plannedCents)
                            : "-"}
                        </TableCell>
                      ))}
                      <TableCell className="bg-muted/30 py-3 px-3 sm:px-4 text-right font-mono text-xs font-semibold text-foreground whitespace-nowrap">
                        {formatCurrencyFromCents(groupRow.totalPlannedCents)}
                      </TableCell>
                      <TableCell
                        rowSpan={2}
                        className="border-l border-border py-3.5 sm:py-4 px-4 sm:px-5 align-middle whitespace-nowrap"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-foreground">
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
                            indicatorClassName={
                              isOverBudget
                                ? "bg-destructive"
                                : isWarning
                                ? "bg-warning"
                                : "bg-success"
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Sub-linha 2: REALIZADO */}
                    <TableRow className="border-b-2 border-border bg-muted/20 hover:bg-muted/40">
                      <TableCell className="py-3 px-3 sm:px-4 text-xs font-bold uppercase tracking-wide text-foreground whitespace-nowrap">
                        Realizado
                      </TableCell>
                      {groupRow.months.map((m) => {
                        const cellExceeded =
                          m.realizedCents > m.plannedCents && m.realizedCents > 0;
                        return (
                          <TableCell
                            key={`real-${groupRow.deliveryGroup}-${m.month}`}
                            className={`py-3 px-3 text-right font-mono text-xs font-semibold whitespace-nowrap ${
                              cellExceeded
                                ? "text-destructive"
                                : m.realizedCents > 0
                                ? "text-foreground"
                                : "text-muted-foreground/40"
                            }`}
                          >
                            {m.realizedCents > 0
                              ? formatCurrencyFromCents(m.realizedCents)
                              : "-"}
                          </TableCell>
                        );
                      })}
                      <TableCell
                        className={`bg-muted/40 py-3 px-3 sm:px-4 text-right font-mono text-xs font-bold whitespace-nowrap ${
                          isOverBudget ? "text-destructive" : "text-foreground"
                        }`}
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
