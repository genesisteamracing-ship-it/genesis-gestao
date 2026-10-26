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
import {
  Download,
  FileCheck2,
  FileText,
  RotateCcw,
  Search,
} from "lucide-react";
import {
  ACQUISITION_STRATEGY_LABELS,
  DELIVERY_GROUP_LABELS,
  PROJECT_MONTH_LABELS,
  TRACKING_METHOD_LABELS,
} from "@/lib/constants";
import {
  acquisitionStrategyValues,
  deliveryGroupValues,
  trackingMethodValues,
} from "@/lib/validations/financial";
import { downloadCsvFile, triggerPortfolioPdfPrint } from "@/lib/export-utils";
import { cn, formatCurrencyFromCents, formatDateBR } from "@/lib/utils";
import type { TransactionDTO } from "@/types/financial";
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

interface TransactionsDataTableProps {
  transactions: TransactionDTO[];
}

export function TransactionsDataTable({
  transactions,
}: TransactionsDataTableProps) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = React.useMemo<ColumnDef<TransactionDTO>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Data / Mês",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-mono text-xs font-semibold text-slate-900">
              {formatDateBR(row.original.date)}
            </div>
            <div className="text-[11px] font-medium text-slate-500">
              {PROJECT_MONTH_LABELS[row.original.referenceMonth] ??
                `Mês ${row.original.referenceMonth}`}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Natureza",
        filterFn: "equalsString",
        cell: ({ row }) => {
          const isOrigin = row.original.type === "ORIGIN";
          return (
            <Badge variant={isOrigin ? "success" : "destructive"}>
              {isOrigin ? "🟢 Origem" : "🔴 Aplicação"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "deliveryGroup",
        header: "Grupo & Categoria",
        filterFn: "equalsString",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-medium text-slate-900">
              {DELIVERY_GROUP_LABELS[row.original.deliveryGroup]}
            </div>
            <div className="text-xs text-slate-500">
              {row.original.categoryName}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Descrição & Vínculo Orçamentário",
        cell: ({ row }) => (
          <div className="space-y-1">
            <div className="font-medium text-slate-900">
              {row.original.description}
            </div>
            {row.original.budgetResourceCode && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-slate-700">
                  {row.original.budgetResourceCode}
                </span>
                <span>{row.original.budgetResourceName}</span>
              </div>
            )}
          </div>
        ),
      },
      {
        id: "acquisitionStrategy",
        accessorFn: (row) => row.acquisitionStrategy ?? "UNLINKED",
        header: "Aquisição",
        filterFn: "equalsString",
        cell: ({ row }) => {
          const strategy = row.original.acquisitionStrategy;
          if (!strategy) {
            return <span className="text-xs text-slate-400">Direto / Caixa</span>;
          }
          return (
            <Badge variant="secondary" className="text-[11px]">
              {ACQUISITION_STRATEGY_LABELS[strategy]}
            </Badge>
          );
        },
      },
      {
        accessorKey: "trackingMethod",
        header: "Rastreio Comprobatório",
        filterFn: "equalsString",
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge variant="outline" className="font-medium">
              {TRACKING_METHOD_LABELS[row.original.trackingMethod]}
            </Badge>
            {row.original.documentRef && (
              <div className="font-mono text-[11px] text-slate-500">
                Ref: {row.original.documentRef}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "amountCents",
        header: () => <div className="text-right">Valor Realizado</div>,
        cell: ({ row }) => {
          const isOrigin = row.original.type === "ORIGIN";
          return (
            <div
              className={cn(
                "text-right font-mono text-xs font-bold",
                isOrigin ? "text-emerald-700" : "text-red-600"
              )}
            >
              {isOrigin ? "+" : "-"} {formatCurrencyFromCents(row.original.amountCents)}
            </div>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: transactions,
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
  const selectedTrackingMethod =
    (table.getColumn("trackingMethod")?.getFilterValue() as string) ?? "ALL";

  function handleExportCsv() {
    const filteredRows = table.getFilteredRowModel().rows.map((r) => r.original);
    downloadCsvFile(
      "stem-racing-auditoria-lancamentos.csv",
      [
        "Data",
        "Mes Referencia",
        "Tipo",
        "Grupo de Entrega",
        "Categoria",
        "Codigo Orcamento",
        "Estrategia Aquisicao",
        "Descricao",
        "Metodo Comprobatorio",
        "Ref Documento",
        "Valor (R$)",
      ],
      filteredRows.map((tx) => [
        formatDateBR(tx.date),
        `Mês ${tx.referenceMonth}`,
        tx.type === "ORIGIN" ? "Origem (Receita)" : "Aplicação (Despesa)",
        DELIVERY_GROUP_LABELS[tx.deliveryGroup],
        tx.categoryName,
        tx.budgetResourceCode ?? "-",
        tx.acquisitionStrategy
          ? ACQUISITION_STRATEGY_LABELS[tx.acquisitionStrategy]
          : "Lançamento Direto",
        tx.description,
        TRACKING_METHOD_LABELS[tx.trackingMethod],
        tx.documentRef ?? "-",
        formatCurrencyFromCents(tx.amountCents),
      ])
    );
  }

  return (
    <Card className="border-slate-200">
      <CardHeader className="border-b border-slate-100 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <FileCheck2 className="h-5 w-5 text-slate-800" />
              <span>Livro Caixa e Auditoria de Lançamentos (Realizado)</span>
            </CardTitle>
            <CardDescription>
              Rastreamento detalhado de receitas e despesas por categoria, grupo de
              entrega e método comprobatório (NF-e, Recibo, PIX, Contrato).
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
        {/* Filtros no topo por DeliveryGroup, AcquisitionStrategy e TrackingMethod */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar descrição, NF-e, código..."
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
              <SelectValue placeholder="Grupo de Entrega" />
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

          <Select
            value={selectedStrategy}
            onValueChange={(val) =>
              table
                .getColumn("acquisitionStrategy")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Estratégia de Aquisição" />
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

          <div className="flex items-center gap-2">
            <Select
              value={selectedTrackingMethod}
              onValueChange={(val) =>
                table
                  .getColumn("trackingMethod")
                  ?.setFilterValue(val === "ALL" ? undefined : val)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Método Comprobatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Comprovantes</SelectItem>
                {trackingMethodValues.map((method) => (
                  <SelectItem key={method} value={method}>
                    {TRACKING_METHOD_LABELS[method]}
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
                    Nenhum lançamento encontrado para os filtros selecionados.
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
