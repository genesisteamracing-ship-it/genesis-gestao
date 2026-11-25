"use client";

import * as React from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  ACQUISITION_STRATEGY_LABELS,
  DELIVERY_GROUP_LABELS,
  TRACKING_METHOD_LABELS,
} from "@/lib/constants";
import { toast } from "sonner";
import { downloadCsvFile } from "@/lib/export-utils";
import { exportFinancialStatementToPdf } from "@/lib/financial-statement-pdf-export";
import { formatCurrencyFromCents, formatDateBR } from "@/lib/utils";
import type { TransactionDTO } from "@/types/financial";

export function useTransactionsTable(
  transactions: TransactionDTO[],
  columns: ColumnDef<TransactionDTO>[],
  teamName?: string
) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  const table = useReactTable({
    data: transactions,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
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
    (table.getColumn("referenceMonth")?.getFilterValue() as string) ?? "ALL";
  const selectedDeliveryGroup =
    (table.getColumn("deliveryGroup")?.getFilterValue() as string) ?? "ALL";
  const selectedTrackingMethod =
    (table.getColumn("trackingMethod")?.getFilterValue() as string) ?? "ALL";

  const totalFiltered = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const startRow = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalFiltered);
  const formattedEndRow =
    endRow > 0 && endRow < 10 ? `0${endRow}` : String(endRow);

  const handleExportCsv = React.useCallback(() => {
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
        "Codigo NF-e",
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
  }, [table]);

  const handleExportPdf = React.useCallback(async () => {
    const filteredRows = table.getFilteredRowModel().rows.map((r) => r.original);
    if (filteredRows.length === 0) {
      toast.error("Não há lançamentos financeiros para exportar.");
      return;
    }

    try {
      setIsExportingPdf(true);
      const { filename } = await exportFinancialStatementToPdf({
        transactions: filteredRows,
        teamName,
      });
      toast.success(`Extrato financeiro exportado: ${filename}`);
    } catch {
      toast.error("Não foi possível gerar o extrato financeiro em PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  }, [table, teamName]);

  const resetFilters = React.useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter("");
  }, []);

  return {
    table,
    globalFilter,
    setGlobalFilter,
    selectedMonth,
    selectedDeliveryGroup,
    selectedTrackingMethod,
    totalFiltered,
    startRow,
    formattedEndRow,
    handleExportCsv,
    triggerPdf: handleExportPdf,
    isExportingPdf,
    resetFilters,
  };
}
