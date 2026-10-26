"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table";
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
import { downloadCsvFile, triggerPortfolioPdfPrint } from "@/lib/export-utils";
import { cn, formatCurrencyFromCents } from "@/lib/utils";
import type { BudgetResourceDTO } from "@/types/financial";
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

interface ResourcesDataTableProps {
  resources: BudgetResourceDTO[];
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

export function ResourcesDataTable({ resources }: ResourcesDataTableProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = React.useMemo<ColumnDef<BudgetResourceDTO>[]>(
    () => [
      {
        accessorKey: "code",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-sm font-semibold text-[#202224] dark:text-[#F5F6FA]">
            {row.original.code}
          </span>
        ),
      },
      {
        accessorKey: "resourceName",
        header: "RECURSO",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-[#202224] dark:text-[#F5F6FA]">
              {row.original.resourceName}
            </div>
            <div className="text-xs text-[#606060] dark:text-[#9CA3AF]">
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
            <div className="font-medium text-[#202224]">
              {DELIVERY_GROUP_LABELS[row.original.deliveryGroup]}
            </div>
            <div className="text-xs text-[#606060]">
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
          <div className="text-sm text-[#202224]">
            {PROJECT_MONTH_LABELS[row.original.plannedMonth] ??
              `Mês ${row.original.plannedMonth}`}{" "}
            <span className="text-xs text-[#606060]">
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
              <div className="font-bold text-[#202224]">
                {formatCurrencyFromCents(planned)}
              </div>
              <div
                className={cn(
                  "text-[11px]",
                  exceeded
                    ? "font-semibold text-[#EF3826]"
                    : realized > 0
                    ? "text-[#00B69B]"
                    : "text-[#202224]/40"
                )}
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
    ],
    []
  );

  const table = useReactTable({
    data: resources,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 9,
      },
    },
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedMonth =
    (table.getColumn("plannedMonth")?.getFilterValue() as string) ?? "ALL";
  const selectedDeliveryGroup =
    (table.getColumn("deliveryGroup")?.getFilterValue() as string) ?? "ALL";
  const selectedStrategy =
    (table.getColumn("acquisitionStrategy")?.getFilterValue() as string) ?? "ALL";

  const totalFiltered = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const startRow = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalFiltered);
  const formattedEndRow =
    endRow > 0 && endRow < 10 ? `0${endRow}` : String(endRow);

  function handleExportCsv() {
    const filteredRows = table.getFilteredRowModel().rows.map((r) => r.original);
    downloadCsvFile(
      "stem-racing-plano-recursos.csv",
      [
        "ID",
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
    <div id="tabela-recursos" className="space-y-4">
      {/* 1. Busca rápida + Exportação ocupando 100% da largura no topo */}
      <div className="flex w-full flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#202224]/40 dark:text-[#F5F6FA]/40" />
          <Input
            placeholder="Buscar recurso ou código..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="h-11 w-full rounded-xl border-[#D5D5D5] dark:border-[#2E3138] bg-white dark:bg-[#1B1D21] pl-10 text-sm"
          />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={handleExportCsv}
            className="h-11 rounded-xl border-[#D5D5D5] dark:border-[#2E3138] bg-white dark:bg-[#1B1D21] font-semibold text-[#202224] dark:text-[#F5F6FA] hover:bg-slate-50 dark:hover:bg-[#23262B] px-4"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </Button>
          <Button
            variant="outline"
            onClick={triggerPortfolioPdfPrint}
            className="h-11 rounded-xl border-[#D5D5D5] dark:border-[#2E3138] bg-white dark:bg-[#1B1D21] font-semibold text-[#202224] dark:text-[#F5F6FA] hover:bg-slate-50 dark:hover:bg-[#23262B] px-4"
          >
            <FileText className="h-4 w-4" />
            <span>Relatório PDF</span>
          </Button>
        </div>
      </div>

      {/* 2. Barra de Filtros Segmentada ocupando 100% da largura */}
      <div className="flex w-full flex-wrap items-stretch overflow-hidden rounded-xl border border-[#D5D5D5] dark:border-[#2E3138] bg-[#F9F9FB] dark:bg-[#1B1D21] shadow-2xs">
        {/* Ícone Funil */}
        <div className="flex items-center justify-center border-r border-[#D5D5D5] dark:border-[#2E3138] bg-white dark:bg-[#1B1D21] px-5 py-3 shrink-0">
          <Filter className="h-4 w-4 text-[#202224] dark:text-[#F5F6FA]" />
        </div>

        {/* Label Filter By */}
        <div className="flex items-center border-r border-[#D5D5D5] dark:border-[#2E3138] bg-white dark:bg-[#1B1D21] px-5 py-3 text-sm font-bold text-[#202224] dark:text-[#F5F6FA] shrink-0">
          Filtrar Por
        </div>

        {/* Select Mês */}
        <div className="flex flex-1 min-w-[140px] items-center border-r border-[#D5D5D5] dark:border-[#2E3138] bg-white dark:bg-[#1B1D21]">
          <Select
            value={selectedMonth}
            onValueChange={(val) =>
              table
                .getColumn("plannedMonth")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-full w-full rounded-none border-0 bg-white dark:bg-[#1B1D21] px-4 py-3 text-sm font-bold text-[#202224] dark:text-[#F5F6FA] shadow-none focus:ring-0">
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

        {/* Select Grupo de Entrega */}
        <div className="flex flex-1 min-w-[170px] items-center border-r border-[#D5D5D5] dark:border-[#2E3138] bg-white dark:bg-[#1B1D21]">
          <Select
            value={selectedDeliveryGroup}
            onValueChange={(val) =>
              table
                .getColumn("deliveryGroup")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-full w-full rounded-none border-0 bg-white dark:bg-[#1B1D21] px-4 py-3 text-sm font-bold text-[#202224] dark:text-[#F5F6FA] shadow-none focus:ring-0">
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

        {/* Select Estratégia */}
        <div className="flex flex-1 min-w-[170px] items-center border-r border-[#D5D5D5] dark:border-[#2E3138] bg-white dark:bg-[#1B1D21]">
          <Select
            value={selectedStrategy}
            onValueChange={(val) =>
              table
                .getColumn("acquisitionStrategy")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-full w-full rounded-none border-0 bg-white dark:bg-[#1B1D21] px-4 py-3 text-sm font-bold text-[#202224] dark:text-[#F5F6FA] shadow-none focus:ring-0">
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

        {/* Botão Reset Filter em vermelho coral */}
        <button
          type="button"
          onClick={() => {
            setColumnFilters([]);
            setGlobalFilter("");
          }}
          className="flex items-center gap-2 bg-white dark:bg-[#1B1D21] px-5 py-3 text-sm font-semibold text-[#EA0234] transition-colors hover:bg-red-50/60 dark:hover:bg-red-950/20 cursor-pointer shrink-0"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Resetar Filtro</span>
        </button>
      </div>

      {/* Card da Tabela estilo tabela.png */}
      <div className="overflow-hidden rounded-2xl border border-[#D5D5D5]/70 dark:border-[#2E3138] bg-white dark:bg-[#1B1D21] shadow-[0_6px_24px_-4px_rgba(16,24,40,0.03)]">
        <Table>
          <TableHeader className="bg-[#FCFDFD] dark:bg-[#202226] border-b border-[#D5D5D5]/70 dark:border-[#2E3138]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-[#FCFDFD] dark:hover:bg-[#202226]">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-[#202224] dark:text-[#F5F6FA]"
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
                  className="border-b border-[#D5D5D5]/50 dark:border-[#2E3138] hover:bg-[#F9F9FB] dark:hover:bg-[#23262B]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4 text-sm text-[#202224] dark:text-[#F5F6FA]">
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
                  className="h-28 text-center text-sm text-[#606060] dark:text-[#9CA3AF]"
                >
                  Nenhum recurso planejado encontrado para os filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação estilo tabela.png (Showing 1-09 of X + Botões < | >) */}
      <div className="flex items-center justify-between px-1 pt-1">
        <p className="text-sm font-medium text-[#202224]/60 dark:text-[#F5F6FA]/60">
          Mostrando {startRow}-{formattedEndRow} de {totalFiltered}
        </p>

        <div className="inline-flex items-center overflow-hidden rounded-lg border border-[#D5D5D5] dark:border-[#2E3138] bg-[#FAFBFD] dark:bg-[#1B1D21] shadow-2xs">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
            className="flex h-8 w-10 items-center justify-center border-r border-[#D5D5D5] dark:border-[#2E3138] text-[#202224] dark:text-[#F5F6FA] transition-colors hover:bg-white dark:hover:bg-[#23262B] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Próxima página"
            className="flex h-8 w-10 items-center justify-center text-[#202224] dark:text-[#F5F6FA] transition-colors hover:bg-white dark:hover:bg-[#23262B] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
