"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Search } from "lucide-react";
import { getAttendanceSectorLabel } from "@/lib/training-attendance";
import type { MemberAttendanceSummaryDTO } from "@/types/attendance";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AttendancePaginationFooter } from "./attendance-pagination-footer";
import { AttendanceRowActions } from "./attendance-row-actions";
import { attendanceRateBarStyles } from "./attendance-styles";

interface AttendanceMembersTableProps {
  memberSummaries: MemberAttendanceSummaryDTO[];
  exportingMemberId: string | null;
  onExportIndividualPdf: (memberId: string) => void;
  onExportIndividualCsv: (memberId: string) => void;
}

function getRateLevel(rate: number): "high" | "medium" | "low" {
  if (rate >= 80) return "high";
  if (rate >= 50) return "medium";
  return "low";
}

export function AttendanceMembersTable({
  memberSummaries,
  exportingMemberId,
  onExportIndividualPdf,
  onExportIndividualCsv,
}: AttendanceMembersTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredMembers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return memberSummaries;

    return memberSummaries.filter((member) => {
      const sector = getAttendanceSectorLabel(member.deliveryGroup).toLowerCase();
      return (
        member.userName.toLowerCase().includes(query) ||
        sector.includes(query) ||
        (member.jobTitle ?? "").toLowerCase().includes(query)
      );
    });
  }, [memberSummaries, searchQuery]);

  const columns = React.useMemo<ColumnDef<MemberAttendanceSummaryDTO>[]>(
    () => [
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
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {getAttendanceSectorLabel(row.original.deliveryGroup)}
          </span>
        ),
      },
      {
        accessorKey: "totalTrainings",
        header: "TREINOS",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            {row.original.totalTrainings}
          </span>
        ),
      },
      {
        accessorKey: "presencesCount",
        header: "PRESENÇAS",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-success">
            {row.original.presencesCount}
          </span>
        ),
      },
      {
        accessorKey: "absencesCount",
        header: "FALTAS",
        cell: ({ row }) => (
          <span
            className={`font-mono text-xs font-semibold ${
              row.original.absencesCount > 0
                ? "text-destructive"
                : "text-muted-foreground"
            }`}
          >
            {row.original.absencesCount}
          </span>
        ),
      },
      {
        accessorKey: "attendanceRate",
        header: "FREQUÊNCIA",
        cell: ({ row }) => {
          const rate = row.original.attendanceRate;
          const barStyles = attendanceRateBarStyles({
            level: getRateLevel(rate),
          });

          return (
            <div className={barStyles.wrapper()}>
              <div className={barStyles.track()}>
                <div
                  className={barStyles.fill()}
                  style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                />
              </div>
              <span className={barStyles.label()}>{rate.toFixed(0)}%</span>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="block text-right">AÇÕES</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <AttendanceRowActions
              memberId={row.original.userId}
              memberName={row.original.userName}
              isExporting={exportingMemberId === row.original.userId}
              onExportIndividualPdf={onExportIndividualPdf}
              onExportIndividualCsv={onExportIndividualCsv}
            />
          </div>
        ),
      },
    ],
    [exportingMemberId, onExportIndividualCsv, onExportIndividualPdf]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: filteredMembers,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-3">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            table.setPageIndex(0);
          }}
          placeholder="Buscar integrante ou setor..."
          aria-label="Buscar resumo por integrante ou setor"
          className="h-9 pl-8 text-xs"
        />
      </div>

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
                  Nenhum integrante encontrado para o filtro aplicado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AttendancePaginationFooter
        totalFiltered={filteredMembers.length}
        entityLabel="integrantes"
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
    </div>
  );
}
