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
import { CalendarCheck2, Search } from "lucide-react";
import { AttendancePaginationFooter } from "@/components/attendance/attendance-pagination-footer";
import { AttendanceRowActions } from "@/components/attendance/attendance-row-actions";
import { useAttendanceReports } from "@/hooks/use-attendance-reports";
import {
  buildAttendanceAnalytics,
  formatIsoDateBR,
  formatTimeBR,
  getAttendanceSectorLabel,
} from "@/lib/training-attendance";
import type {
  AttendanceTrackedMemberDTO,
  TrainingAttendanceRecordDTO,
} from "@/types/attendance";
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
  members?: AttendanceTrackedMemberDTO[];
  teamName?: string;
  seasonLabel?: string;
}

export function OfficeAttendanceTable({
  attendances,
  todayIso,
  members,
  teamName,
  seasonLabel,
}: OfficeAttendanceTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<string>("ALL");

  const analytics = React.useMemo(
    () =>
      buildAttendanceAnalytics({
        members,
        attendances,
        period: "ALL",
        todayIso,
      }),
    [attendances, members, todayIso]
  );

  const reports = useAttendanceReports({
    analytics,
    allMembers: members ?? [],
    rawAttendances: attendances,
    currentPeriod: "ALL",
    todayIso,
    teamName,
    seasonLabel,
  });

  const availableDates = analytics.trainingDates;

  const filteredRecords = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return analytics.records.filter((item) => {
      if (selectedDate !== "ALL" && item.date !== selectedDate) {
        return false;
      }
      if (!q) return true;
      const sector = getAttendanceSectorLabel(item.deliveryGroup).toLowerCase();
      return (
        item.userName.toLowerCase().includes(q) ||
        sector.includes(q) ||
        formatIsoDateBR(item.date).includes(q)
      );
    });
  }, [analytics.records, searchQuery, selectedDate]);

  const columns = React.useMemo<ColumnDef<TrainingAttendanceRecordDTO>[]>(
    () => [
      {
        accessorKey: "date",
        header: "DATA",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground whitespace-nowrap">
            {formatIsoDateBR(row.original.date)}
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
            {getAttendanceSectorLabel(row.original.deliveryGroup)}
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
        cell: ({ row }) =>
          row.original.status === "PRESENT" ? (
            <Badge variant="success" className="text-[11px] font-semibold">
              Presente
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-[11px] font-semibold">
              Falta
            </Badge>
          ),
      },
      {
        id: "actions",
        header: () => <span className="block text-right">AÇÕES</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <AttendanceRowActions
              memberId={row.original.userId}
              memberName={row.original.userName}
              isExporting={reports.exportingMemberId === row.original.userId}
              onExportIndividualPdf={(memberId) =>
                void reports.handleExportIndividualPdf(memberId)
              }
              onExportIndividualCsv={(memberId) =>
                void reports.handleExportIndividualCsv(memberId)
              }
            />
          </div>
        ),
      },
    ],
    [reports]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredRecords,
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
                {formatIsoDateBR(iso)}
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

        <AttendancePaginationFooter
          totalFiltered={filteredRecords.length}
          entityLabel="presenças"
          pageIndex={table.getState().pagination.pageIndex}
          pageSize={table.getState().pagination.pageSize}
          pageCount={table.getPageCount()}
          canPreviousPage={table.getCanPreviousPage()}
          canNextPage={table.getCanNextPage()}
          onFirstPage={() => table.setPageIndex(0)}
          onPreviousPage={() => table.previousPage()}
          onNextPage={() => table.nextPage()}
          onLastPage={() => table.setPageIndex(table.getPageCount() - 1)}
        />
      </CardContent>
    </Card>
  );
}
