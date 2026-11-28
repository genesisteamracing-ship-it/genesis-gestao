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
import {
  formatIsoDateBR,
  formatTimeBR,
  getAttendanceSectorLabel,
} from "@/lib/training-attendance";
import type {
  AttendanceStatus,
  MemberAttendanceSummaryDTO,
  TrainingAttendanceRecordDTO,
} from "@/types/attendance";
import { Badge } from "@/components/ui/badge";
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
import { AttendancePaginationFooter } from "./attendance-pagination-footer";
import { AttendanceRowActions } from "./attendance-row-actions";

interface AttendanceDailyTableProps {
  records: TrainingAttendanceRecordDTO[];
  trainingDates: string[];
  memberSummaries: MemberAttendanceSummaryDTO[];
  exportingMemberId: string | null;
  onExportIndividualPdf: (memberId: string) => void;
  onExportIndividualCsv: (memberId: string) => void;
}

export function AttendanceDailyTable({
  records,
  trainingDates,
  memberSummaries,
  exportingMemberId,
  onExportIndividualPdf,
  onExportIndividualCsv,
}: AttendanceDailyTableProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = React.useState<
    "ALL" | AttendanceStatus
  >("ALL");
  const [selectedMemberId, setSelectedMemberId] = React.useState<string>("ALL");

  const filteredRecords = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return records.filter((item) => {
      if (selectedDate !== "ALL" && item.date !== selectedDate) return false;
      if (selectedStatus !== "ALL" && item.status !== selectedStatus) {
        return false;
      }
      if (selectedMemberId !== "ALL" && item.userId !== selectedMemberId) {
        return false;
      }
      if (!query) return true;

      const sector = getAttendanceSectorLabel(item.deliveryGroup).toLowerCase();
      const statusText = item.status === "PRESENT" ? "presente" : "falta";
      return (
        item.userName.toLowerCase().includes(query) ||
        sector.includes(query) ||
        formatIsoDateBR(item.date).includes(query) ||
        statusText.includes(query)
      );
    });
  }, [records, searchQuery, selectedDate, selectedMemberId, selectedStatus]);

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
          <span className="text-xs text-muted-foreground whitespace-nowrap">
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
        accessorKey: "status",
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
    data: filteredRecords,
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

  const sortedMemberOptions = React.useMemo(
    () =>
      [...memberSummaries].sort((a, b) =>
        a.userName.localeCompare(b.userName, "pt-BR")
      ),
    [memberSummaries]
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              table.setPageIndex(0);
            }}
            placeholder="Buscar integrante ou setor..."
            aria-label="Buscar registro por integrante ou setor"
            className="h-9 pl-8 text-xs"
          />
        </div>

        <Select
          value={selectedDate}
          onValueChange={(val) => {
            setSelectedDate(val);
            table.setPageIndex(0);
          }}
        >
          <SelectTrigger
            aria-label="Filtrar por data do treino"
            className="h-9 text-xs"
          >
            <SelectValue placeholder="Todas as datas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas as datas</SelectItem>
            {trainingDates.map((iso) => (
              <SelectItem key={iso} value={iso}>
                {formatIsoDateBR(iso)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedStatus}
          onValueChange={(val) => {
            setSelectedStatus(val as "ALL" | AttendanceStatus);
            table.setPageIndex(0);
          }}
        >
          <SelectTrigger aria-label="Filtrar por status" className="h-9 text-xs">
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="PRESENT">Presente</SelectItem>
            <SelectItem value="ABSENT">Falta</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedMemberId}
          onValueChange={(val) => {
            setSelectedMemberId(val);
            table.setPageIndex(0);
          }}
        >
          <SelectTrigger
            aria-label="Filtrar por integrante"
            className="h-9 text-xs"
          >
            <SelectValue placeholder="Todos os integrantes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os integrantes</SelectItem>
            {sortedMemberOptions.map((member) => (
              <SelectItem key={member.userId} value={member.userId}>
                {member.userName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                  Nenhum registro encontrado para os filtros selecionados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AttendancePaginationFooter
        totalFiltered={filteredRecords.length}
        entityLabel="registros"
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
