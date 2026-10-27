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
  PROJECT_MONTH_LABELS,
} from "@/lib/constants";
import { downloadCsvFile, triggerPortfolioPdfPrint } from "@/lib/export-utils";
import { formatCurrencyFromCents } from "@/lib/utils";
import type { BudgetResourceDTO } from "@/types/financial";

export function useResourcesTable(
  resources: BudgetResourceDTO[],
  columns: ColumnDef<BudgetResourceDTO>[]
) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");

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
    triggerPdf: triggerPortfolioPdfPrint,
    resetFilters,
  };
}
