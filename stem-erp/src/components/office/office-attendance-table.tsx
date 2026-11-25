"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
} from "lucide-react";
import { DELIVERY_GROUP_SHORT_LABELS } from "@/lib/constants";
import type { OfficeAttendanceDTO } from "@/types/office";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OfficeAttendanceTableProps {
  attendances: OfficeAttendanceDTO[];
  todayIso?: string;
}

function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

function formatTimeBR(isoTimestamp: string): string {
  try {
    return new Date(isoTimestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "--:--";
  }
}

export function OfficeAttendanceTable({
  attendances,
  todayIso,
}: OfficeAttendanceTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<string>("ALL");

  const availableDates = React.useMemo(() => {
    const unique = Array.from(new Set(attendances.map((a) => a.date)));
    return unique.sort((a, b) => b.localeCompare(a));
  }, [attendances]);

  const filteredAttendances = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return attendances.filter((item) => {
      if (selectedDate !== "ALL" && item.date !== selectedDate) {
        return false;
      }
      if (!q) return true;
      const sector = item.deliveryGroup
        ? DELIVERY_GROUP_SHORT_LABELS[item.deliveryGroup].toLowerCase()
        : "";
      return (
        item.userName.toLowerCase().includes(q) ||
        sector.includes(q) ||
        formatDateBR(item.date).includes(q)
      );
    });
  }, [attendances, searchQuery, selectedDate]);

  const columns = React.useMemo<ColumnDef<OfficeAttendanceDTO>[]>(
    () => [
      {
        accessorKey: "date",
        header: "DATA",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">
            {formatDateBR(row.original.date)}
          </span>
        ),
      },
      {
        accessorKey: "userName",
        header: "INTEGRANTE",
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {row.original.userName}
            </p>
            {row.original.jobTitle && (
              <p className="text-[11px] text-muted-foreground truncate">
                {row.original.jobTitle}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "deliveryGroup",
        header: "SETOR",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.deliveryGroup
              ? DELIVERY_GROUP_SHORT_LABELS[row.original.deliveryGroup]
              : "Geral"}
          </span>
        ),
      },
      {
        accessorKey: "checkedAt",
        header: "HORÁRIO",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
            {formatTimeBR(row.original.checkedAt)}
          </span>
        ),
      },
      {
        id: "status",
        header: "STATUS",
        cell: () => (
          <Badge variant="success" className="text-[11px] font-semibold">
            Presente
          </Badge>
        ),
      },
    ],
    []
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredAttendances,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const totalFiltered = filteredAttendances.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const startRow = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalFiltered);
  const formattedEndRow = endRow > 0 && endRow < 10 ? `0${endRow}` : String(endRow);

  const todayCount = React.useMemo(
    () =>
      todayIso
        ? attendances.filter((item) => item.date === todayIso).length
        : 0,
    [attendances, todayIso]
  );

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-xs">
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarCheck2 className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-foreground">
              Presença nos Treinos
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {todayIso
                ? `${todayCount} ${todayCount === 1 ? "presença registrada" : "presenças registradas"} hoje`
                : `${attendances.length} registros`}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                table.setPageIndex(0);
              }}
              placeholder="Buscar integrante ou setor..."
              aria-label="Buscar presença por integrante ou setor"
              className="h-8.5 pl-8 text-xs"
            />
          </div>

          <select
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              table.setPageIndex(0);
            }}
            aria-label="Filtrar presença por data do treino"
            className="h-8.5 w-full sm:w-40 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">Todas as datas</option>
            {availableDates.map((iso) => (
              <option key={iso} value={iso}>
                {formatDateBR(iso)}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader className="bg-muted/40">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-10 px-4 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
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
                  <TableRow key={row.id} className="hover:bg-muted/30">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-4 py-2.5">
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
                    className="py-8 text-center text-xs text-muted-foreground"
                  >
                    Nenhuma presença registrada para os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Rodapé Padrão de Paginação (Fixa em 10 itens, 4 controles) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground text-center sm:text-left">
            Mostrando {startRow}-{formattedEndRow} de {totalFiltered} presenças
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
              Página {table.getState().pagination.pageIndex + 1} de{" "}
              {Math.max(1, table.getPageCount())}
            </span>
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-2xs">
              <button
                type="button"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
                aria-label="Primeira página"
                title="Primeira página"
                className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                aria-label="Página anterior"
                title="Página anterior"
                className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                aria-label="Próxima página"
                title="Próxima página"
                className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
                aria-label="Última página"
                title="Última página"
                className="flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
