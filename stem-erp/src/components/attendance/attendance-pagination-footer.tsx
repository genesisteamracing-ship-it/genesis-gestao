"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface AttendancePaginationFooterProps {
  totalFiltered: number;
  entityLabel: string;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  onFirstPage: () => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onLastPage: () => void;
}

export function AttendancePaginationFooter({
  totalFiltered,
  entityLabel,
  pageIndex,
  pageSize,
  pageCount,
  canPreviousPage,
  canNextPage,
  onFirstPage,
  onPreviousPage,
  onNextPage,
  onLastPage,
}: AttendancePaginationFooterProps) {
  const startRow = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalFiltered);
  const formattedEndRow =
    endRow > 0 && endRow < 10 ? `0${endRow}` : String(endRow);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-1">
      <p className="text-xs sm:text-sm font-medium text-muted-foreground text-center sm:text-left">
        Mostrando {startRow}-{formattedEndRow} de {totalFiltered} {entityLabel}
      </p>

      <div className="flex items-center gap-2">
        <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
          Página {pageIndex + 1} de {Math.max(1, pageCount)}
        </span>
        <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-2xs">
          <button
            type="button"
            onClick={onFirstPage}
            disabled={!canPreviousPage}
            aria-label="Primeira página"
            title="Primeira página"
            className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={!canPreviousPage}
            aria-label="Página anterior"
            title="Página anterior"
            className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onNextPage}
            disabled={!canNextPage}
            aria-label="Próxima página"
            title="Próxima página"
            className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onLastPage}
            disabled={!canNextPage}
            aria-label="Última página"
            title="Última página"
            className="flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
