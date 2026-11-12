"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  History,
  Pencil,
  Settings,
  Trash2,
} from "lucide-react";
import { tv } from "tailwind-variants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DELIVERY_GROUP_SHORT_LABELS } from "@/lib/constants";
import {
  RISK_CONSEQUENCE_LABELS,
  RISK_ENTRY_TYPE_LABELS,
  RISK_PRIORITY_LABELS,
  RISK_PROBABILITY_LABELS,
  RISK_STATUS_LABELS,
} from "@/lib/risk-matrix";
import type { RiskItemDTO } from "@/types/risks";

interface RiskTableProps {
  items: RiskItemDTO[];
  canEdit: boolean;
  onEdit: (item: RiskItemDTO) => void;
  onReview: (item: RiskItemDTO) => void;
  onDelete: (item: RiskItemDTO) => void;
}

const tableStyles = tv({
  slots: {
    wrapper: "space-y-3",
    card: "overflow-hidden rounded-2xl border border-border bg-card shadow-xs",
    scroll: "overflow-x-auto",
  },
});

const priorityBadgeStyles = tv({
  base: "text-[11px] font-medium",
  variants: {
    level: {
      CRITICAL: "border-destructive/30 bg-destructive/10 text-destructive",
      HIGH: "border-warning/30 bg-warning/10 text-warning",
      MEDIUM: "border-primary/30 bg-primary/10 text-primary",
      LOW: "border-success/30 bg-success/10 text-success",
      UNASSESSED: "border-border bg-muted text-muted-foreground",
    },
  },
});

export function RiskTable({
  items,
  canEdit,
  onEdit,
  onReview,
  onDelete,
}: RiskTableProps) {
  const styles = tableStyles();

  const columns = React.useMemo<ColumnDef<RiskItemDTO>[]>(
    () => [
      {
        id: "sector",
        header: "Setor",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs font-medium text-foreground">
            {DELIVERY_GROUP_SHORT_LABELS[row.original.sector]}
          </span>
        ),
      },
      {
        id: "probability",
        header: "Probabilidade de ocorrer",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-foreground">
            {RISK_PROBABILITY_LABELS[row.original.probability]}
          </span>
        ),
      },
      {
        id: "consequence",
        header: "Consequência de ocorrência",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-foreground">
            {RISK_CONSEQUENCE_LABELS[row.original.consequence]}
          </span>
        ),
      },
      {
        id: "risk",
        header: "Risco",
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="min-w-[200px] max-w-sm space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">
                  {item.title}
                </span>
                <Badge
                  variant="outline"
                  className={priorityBadgeStyles({ level: item.priorityLevel })}
                >
                  {RISK_PRIORITY_LABELS[item.priorityLevel]}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {RISK_ENTRY_TYPE_LABELS[item.entryType]} ·{" "}
                {RISK_STATUS_LABELS[item.status]}
                {item.reviewsCount > 0
                  ? ` · ${item.reviewsCount} revisão(ões)`
                  : ""}
              </p>
            </div>
          );
        },
      },
      {
        id: "observations",
        header: "Observações",
        cell: ({ row }) => {
          const item = row.original;
          const summary =
            item.observations ||
            item.proactiveStrategy ||
            item.contingencyPlan ||
            item.evidenceNotes ||
            "—";
          return (
            <div className="min-w-[200px] max-w-md space-y-0.5 text-xs text-muted-foreground">
              <p className="line-clamp-2 text-foreground/90">{summary}</p>
              {item.evidenceUrl && (
                <a
                  href={item.evidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-[11px] font-medium text-primary hover:underline"
                >
                  Ver evidência
                </a>
              )}
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Ações</span>,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-lg border-border/80 bg-card hover:bg-muted/80 hover:text-foreground"
                    aria-label={`Ações para ${item.title}`}
                  >
                    <Settings className="h-4 w-4 text-foreground transition-transform duration-200 hover:rotate-45" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    onClick={() => onReview(item)}
                    className="cursor-pointer gap-2 text-xs font-medium"
                  >
                    <History className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>
                      {canEdit ? "Revisão & Histórico" : "Ver Histórico"}
                    </span>
                  </DropdownMenuItem>
                  {canEdit && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onEdit(item)}
                        className="cursor-pointer gap-2 text-xs font-medium"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Editar</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(item)}
                        className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Excluir</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [canEdit, onDelete, onEdit, onReview]
  );

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
  });

  const totalFiltered = items.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const startRow = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const formattedEndRow = Math.min((pageIndex + 1) * pageSize, totalFiltered);

  return (
    <div className={styles.wrapper()}>
      <div className={styles.card()}>
        <div className={styles.scroll()}>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
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
              {table.getRowModel().rows.map((row) => (
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
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 px-1 pt-1 sm:flex-row">
        <p className="text-center text-xs font-medium text-muted-foreground sm:text-left sm:text-sm">
          Mostrando {startRow}-{formattedEndRow} de {totalFiltered} registros
        </p>

        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-xs font-medium text-muted-foreground sm:text-sm">
            Página {pageIndex + 1} de {Math.max(1, table.getPageCount())}
          </span>
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-2xs">
            <button
              type="button"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="Primeira página"
              title="Primeira página"
              className="flex h-8 w-8 cursor-pointer items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="Página anterior"
              title="Página anterior"
              className="flex h-8 w-8 cursor-pointer items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="Próxima página"
              title="Próxima página"
              className="flex h-8 w-8 cursor-pointer items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Última página"
              title="Última página"
              className="flex h-8 w-8 cursor-pointer items-center justify-center text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
