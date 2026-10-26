"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { Download, FileText, PackageCheck, RotateCcw, Search } from "lucide-react";
import {
  ACQUISITION_STRATEGY_LABELS,
  DELIVERY_GROUP_LABELS,
  PROJECT_MONTH_LABELS,
} from "@/lib/constants";
import {
  acquisitionStrategyValues,
  deliveryGroupValues,
} from "@/lib/validations/financial";
import { downloadCsvFile, triggerPortfolioPdfPrint } from "@/lib/export-utils";
import { cn, formatCurrencyFromCents } from "@/lib/utils";
import type { BudgetResourceDTO } from "@/types/financial";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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

interface ResourcesDataTableProps {
  resources: BudgetResourceDTO[];
}

export function ResourcesDataTable({ resources }: ResourcesDataTableProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = React.useMemo<ColumnDef<BudgetResourceDTO>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Código",
        cell: ({ row }) => (
          <span className="rounded bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-900">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "deliveryGroup",
        header: "Grupo de Entrega",
        filterFn: "equalsString",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-slate-900">
              {DELIVERY_GROUP_LABELS[row.original.deliveryGroup]}
            </div>
            <div className="text-xs text-slate-500">{row.original.categoryName}</div>
          </div>
        ),
      },
      {
        accessorKey: "resourceName",
        header: "Recurso & Responsável",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-slate-900">
              {row.original.resourceName}
            </div>
            <div className="text-xs text-slate-500">
              Alocado: <span className="font-medium">{row.original.allocatedTo}</span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "acquisitionStrategy",
        header: "Estratégia de Aquisição",
        filterFn: "equalsString",
        cell: ({ row }) => {
          const strategy = row.original.acquisitionStrategy;
          return (
            <Badge
              variant={
                strategy === "BARTER_PARTNERSHIP"
                  ? "secondary"
                  : strategy === "FINANCIAL_SPONSOR"
                  ? "success"
                  : "outline"
              }
            >
              {ACQUISITION_STRATEGY_LABELS[strategy]}
            </Badge>
          );
        },
      },
      {
        accessorKey: "plannedMonth",
        header: "Mês",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono">
            {PROJECT_MONTH_LABELS[row.original.plannedMonth] ??
              `Mês ${row.original.plannedMonth}`}
          </Badge>
        ),
      },
      {
        accessorKey: "utilizationForecast",
        header: "% Utilização",
        cell: ({ row }) => (
          <div className="w-28 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-slate-700">
                {row.original.utilizationForecast}%
              </span>
            </div>
            <Progress
              value={row.original.utilizationForecast}
              indicatorClassName="bg-slate-800"
            />
          </div>
        ),
      },
      {
        accessorKey: "plannedAmountCents",
        header: () => <div className="text-right">Orçado vs. Realizado</div>,
        cell: ({ row }) => {
          const planned = row.original.plannedAmountCents;
          const realized = row.original.realizedAmountCents;
          const over = realized > planned;
          return (
            <div className="text-right font-mono text-xs">
              <div className="font-bold text-slate-900">
                Prev: {formatCurrencyFromCents(planned)}
              </div>
              <div
                className={cn(
                  "text-[11px]",
                  over
                    ? "font-bold text-red-600"
                    : realized > 0
                    ? "text-emerald-700"
                    : "text-slate-400"
                )}
              >
                Real: {formatCurrencyFromCents(realized)}
              </div>
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: resources,
    columns,
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const selectedDeliveryGroup =
    (table.getColumn("deliveryGroup")?.getFilterValue() as string) ?? "ALL";
  const selectedStrategy =
    (table.getColumn("acquisitionStrategy")?.getFilterValue() as string) ?? "ALL";

  function handleExportCsv() {
    const filteredRows = table.getFilteredRowModel().rows.map((r) => r.original);
    downloadCsvFile(
      "stem-racing-plano-recursos.csv",
      [
        "Codigo",
        "Grupo de Entrega",
        "Categoria",
        "Recurso",
        "Estrategia de Aquisicao",
        "Responsavel",
        "Mes Planejado",
        "Utilizacao (%)",
        "Valor Previsto (R$)",
        "Valor Realizado (R$)",
      ],
      filteredRows.map((item) => [
        item.code,
        DELIVERY_GROUP_LABELS[item.deliveryGroup],
        item.categoryName,
        item.resourceName,
        ACQUISITION_STRATEGY_LABELS[item.acquisitionStrategy],
        item.allocatedTo,
        `Mês ${item.plannedMonth}`,
        item.utilizationForecast,
        formatCurrencyFromCents(item.plannedAmountCents),
        formatCurrencyFromCents(item.realizedAmountCents),
      ])
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <PackageCheck className="h-5 w-5 text-slate-800" />
              <span>Plano de Recursos e Orçamento (Previsto)</span>
            </CardTitle>
            <CardDescription>
              Gerenciamento de aquisição, alocação de responsáveis e taxa de
              utilização por Grupo de Entrega.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv}>
              <Download className="h-3.5 w-3.5" />
              <span>Exportar CSV</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={triggerPortfolioPdfPrint}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Relatório PDF</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por código, recurso, categoria ou responsável..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={selectedDeliveryGroup}
            onValueChange={(val) =>
              table
                .getColumn("deliveryGroup")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar Grupo de Entrega" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Grupos de Entrega</SelectItem>
              {deliveryGroupValues.map((group) => (
                <SelectItem key={group} value={group}>
                  {DELIVERY_GROUP_LABELS[group]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Select
              value={selectedStrategy}
              onValueChange={(val) =>
                table
                  .getColumn("acquisitionStrategy")
                  ?.setFilterValue(val === "ALL" ? undefined : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filtrar Estratégia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Estratégias</SelectItem>
                {acquisitionStrategyValues.map((strategy) => (
                  <SelectItem key={strategy} value={strategy}>
                    {ACQUISITION_STRATEGY_LABELS[strategy]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(columnFilters.length > 0 || globalFilter) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setColumnFilters([]);
                  setGlobalFilter("");
                }}
                title="Limpar filtros"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabela @tanstack/react-table */}
        <div className="rounded-lg border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
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
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
                    className="h-24 text-center text-slate-500"
                  >
                    Nenhum recurso planejado encontrado para os filtros aplicados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
