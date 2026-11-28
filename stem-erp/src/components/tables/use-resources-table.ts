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
} from "@/lib/constants";
import { toast } from "sonner";
import { downloadCsvFile } from "@/lib/export-utils";
import { exportBudgetPlanningToPdf } from "@/lib/budget-planning-pdf-export";
import { formatCurrencyFromCents } from "@/lib/utils";
import type { BudgetResourceDTO } from "@/types/financial";

export function useResourcesTable(
  resources: BudgetResourceDTO[],
  columns: ColumnDef<BudgetResourceDTO>[],
  options?: {
    teamName?: string;
    seasonLabel?: string;
    monthLabels?: Record<number, string>;
  }
) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  const table = useReactTable({
    data: resources,
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

  const handleExportCsv = React.useCallback(() => {
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
  }, [table]);

  const handleExportPdf = React.useCallback(async () => {
    const filteredRows = table.getFilteredRowModel().rows.map((r) => r.original);
    if (filteredRows.length === 0) {
      toast.error("Não há orçamentos planejados para exportar.");
      return;
    }

    try {
      setIsExportingPdf(true);
      const { filename, translationFallback, translationFallbackReason } =
        await exportBudgetPlanningToPdf({
          resources: filteredRows,
          teamName: options?.teamName,
          seasonLabel: options?.seasonLabel,
          monthLabels: options?.monthLabels,
        });
      if (translationFallback) {
        toast.warning(
          translationFallbackReason === "MISSING_API_KEY"
            ? `PDF exported (${filename}), but GEMINI_API_KEY is not configured — some custom resource names remained in Portuguese.`
            : `PDF exported (${filename}), but the translation API was temporarily unavailable for some custom resource names.`
        );
      } else {
        toast.success(`Planejamento orçamentário exportado: ${filename}`);
      }
    } catch {
      toast.error("Não foi possível gerar o relatório de orçamentos em PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  }, [table, options?.teamName, options?.seasonLabel, options?.monthLabels]);

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
    selectedStrategy,
    totalFiltered,
    startRow,
    formattedEndRow,
    handleExportCsv,
    triggerPdf: handleExportPdf,
    isExportingPdf,
    resetFilters,
  };
}
