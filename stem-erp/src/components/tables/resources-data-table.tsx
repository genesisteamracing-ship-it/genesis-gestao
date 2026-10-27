"use client";

import * as React from "react";
import { flexRender, type ColumnDef } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  RotateCcw,
  Search,
} from "lucide-react";
import {
  ACQUISITION_STRATEGY_LABELS,
  DELIVERY_GROUP_LABELS,
  PROJECT_MONTHS,
  PROJECT_MONTH_LABELS,
} from "@/lib/constants";
import {
  acquisitionStrategyValues,
  deliveryGroupValues,
} from "@/lib/validations/financial";
import { formatCurrencyFromCents } from "@/lib/utils";
import type { BudgetResourceDTO, CategoryDTO } from "@/types/financial";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StateView } from "@/components/ui/state-view";
import { useResourcesTable } from "@/components/tables/use-resources-table";
import { ResourceRowActions } from "@/components/tables/resource-row-actions";

interface ResourcesDataTableProps {
  resources: BudgetResourceDTO[];
  categories?: CategoryDTO[];
  isLoading?: boolean;
}

function getStrategyBadgeVariant(
  strategy: BudgetResourceDTO["acquisitionStrategy"]
): BadgeProps["variant"] {
  switch (strategy) {
    case "FINANCIAL_SPONSOR":
      return "success";
    case "DIRECT_PURCHASE":
      return "purple";
    case "BARTER_PARTNERSHIP":
      return "warning";
    case "OWN_FUNDS_RAFFLE":
      return "magenta";
    default:
      return "secondary";
  }
}

export function ResourcesDataTable({
  resources,
  categories = [],
  isLoading = false,
}: ResourcesDataTableProps) {
  const columns = React.useMemo<ColumnDef<BudgetResourceDTO>[]>(
    () => [
      {
        accessorKey: "code",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold text-foreground">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "resourceName",
        header: "RECURSO",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-foreground">
              {row.original.resourceName}
            </div>
            <div className="text-xs text-muted-foreground">
              Responsável: {row.original.allocatedTo}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "deliveryGroup",
        header: "GRUPO & CATEGORIA",
        filterFn: "equalsString",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-foreground">
              {DELIVERY_GROUP_LABELS[row.original.deliveryGroup]}
            </div>
            <div className="text-xs text-muted-foreground">
              {row.original.categoryName}
            </div>
          </div>
        ),
      },
      {
        id: "plannedMonth",
        accessorFn: (row) => String(row.plannedMonth),
        header: "CRONOGRAMA",
        filterFn: "equalsString",
        cell: ({ row }) => (
          <div className="text-sm text-foreground">
            {PROJECT_MONTH_LABELS[row.original.plannedMonth] ??
              `Mês ${row.original.plannedMonth}`}{" "}
            <span className="text-xs text-muted-foreground">
              ({row.original.utilizationForecast}% uso)
            </span>
          </div>
        ),
      },
      {
        accessorKey: "plannedAmountCents",
        header: "ORÇADO / REALIZADO",
        cell: ({ row }) => {
          const planned = row.original.plannedAmountCents;
          const realized = row.original.realizedAmountCents;
          const exceeded = realized > planned;
          return (
            <div className="space-y-0.5 font-mono text-xs">
              <div className="font-bold text-foreground">
                {formatCurrencyFromCents(planned)}
              </div>
              <div
                className={`text-[11px] ${
                  exceeded
                    ? "font-semibold text-destructive"
                    : realized > 0
                    ? "text-success"
                    : "text-muted-foreground/60"
                }`}
              >
                Real: {formatCurrencyFromCents(realized)}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "acquisitionStrategy",
        header: "STATUS / AQUISIÇÃO",
        filterFn: "equalsString",
        cell: ({ row }) => {
          const strategy = row.original.acquisitionStrategy;
          return (
            <Badge
              variant={getStrategyBadgeVariant(strategy)}
              className="min-w-[140px]"
            >
              {ACQUISITION_STRATEGY_LABELS[strategy]}
            </Badge>
          );
        },
      },
      {
        id: "actions",
        header: "AÇÕES",
        cell: ({ row }) => (
          <ResourceRowActions
            resource={row.original}
            categories={categories}
          />
        ),
      },
    ],
    [categories]
  );

  const {
    table,
    globalFilter,
    setGlobalFilter,
    selectedMonth,
    selectedDeliveryGroup,
    selectedStrategy,
    totalFiltered,
    startRow,
    formattedEndRow,
    handleExportCsv,
    triggerPdf,
    resetFilters,
  } = useResourcesTable(resources, columns);

  if (isLoading) {
    return <StateView state="loading" />;
  }

  return (
    <div id="tabela-recursos" className="space-y-4">
      {/* 1. Busca rápida + Exportação */}
      <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            placeholder="Buscar recurso ou código..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-11 w-full rounded-xl border-input bg-card pl-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={handleExportCsv}
            className="h-11 rounded-xl border-border bg-card font-semibold text-foreground hover:bg-muted px-4"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={triggerPdf}
            className="h-11 rounded-xl border-border bg-card font-semibold text-foreground hover:bg-muted px-4"
          >
            <FileText className="h-4 w-4" />
            <span>Relatório PDF</span>
          </Button>
        </div>
      </div>

      {/* 2. Barra de Filtros Segmentada */}
      <div className="flex w-full flex-wrap items-stretch overflow-hidden rounded-xl border border-border bg-muted/30 shadow-2xs">
        <div className="flex items-center justify-center border-r border-border bg-card px-5 py-3 shrink-0">
          <Filter className="h-4 w-4 text-foreground" />
        </div>

        <div className="flex items-center border-r border-border bg-card px-5 py-3 text-sm font-bold text-foreground shrink-0">
          Filtrar Por
        </div>

        <div className="flex flex-1 min-w-[140px] items-center border-r border-border bg-card">
          <Select
            value={selectedMonth}
            onValueChange={(val) =>
              table
                .getColumn("plannedMonth")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-full w-full rounded-none border-0 bg-card px-4 py-3 text-sm font-bold text-foreground shadow-none focus:ring-0">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Meses</SelectItem>
              {PROJECT_MONTHS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {PROJECT_MONTH_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 min-w-[170px] items-center border-r border-border bg-card">
          <Select
            value={selectedDeliveryGroup}
            onValueChange={(val) =>
              table
                .getColumn("deliveryGroup")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-full w-full rounded-none border-0 bg-card px-4 py-3 text-sm font-bold text-foreground shadow-none focus:ring-0">
              <SelectValue placeholder="Grupo de Entrega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Grupo de Entrega</SelectItem>
              {deliveryGroupValues.map((group) => (
                <SelectItem key={group} value={group}>
                  {DELIVERY_GROUP_LABELS[group]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 min-w-[170px] items-center border-r border-border bg-card">
          <Select
            value={selectedStrategy}
            onValueChange={(val) =>
              table
                .getColumn("acquisitionStrategy")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-full w-full rounded-none border-0 bg-card px-4 py-3 text-sm font-bold text-foreground shadow-none focus:ring-0">
              <SelectValue placeholder="Tipo de Aquisição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Status / Aquisição</SelectItem>
              {acquisitionStrategyValues.map((strategy) => (
                <SelectItem key={strategy} value={strategy}>
                  {ACQUISITION_STRATEGY_LABELS[strategy]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={resetFilters}
          className="flex items-center gap-2 bg-card px-5 py-3 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 cursor-pointer shrink-0"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Resetar Filtro</span>
        </button>
      </div>

      {/* 3. Tabela */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.03)]">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4 text-sm text-foreground">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="p-8 text-center"
                >
                  <StateView
                    state="empty"
                    title="Nenhum recurso encontrado"
                    description="Não há recursos cadastrados correspondentes aos filtros selecionados."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. Paginação */}
      <div className="flex items-center justify-between px-1 pt-1">
        <p className="text-sm font-medium text-muted-foreground">
          Mostrando {startRow}-{formattedEndRow} de {totalFiltered}
        </p>

        <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-2xs">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
            className="flex h-8 w-10 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Próxima página"
            className="flex h-8 w-10 items-center justify-center text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
