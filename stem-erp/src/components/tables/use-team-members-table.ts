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
import { toast } from "sonner";
import { unlockUserAccountAction } from "@/actions/auth-actions";
import type { TeamMemberDTO } from "@/types/auth";

export function useTeamMembersTable(
  members: TeamMemberDTO[],
  columns: ColumnDef<TeamMemberDTO>[]
) {
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [isPendingUnlock, startTransition] = React.useTransition();

  const handleUnlock = React.useCallback((userId: string) => {
    startTransition(async () => {
      const res = await unlockUserAccountAction(userId);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
    });
  }, []);

  const table = useReactTable({
    data: members,
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

  const selectedTeamId =
    (table.getColumn("teamId")?.getFilterValue() as string) ?? "ALL";
  const selectedDeliveryGroup =
    (table.getColumn("deliveryGroup")?.getFilterValue() as string) ?? "ALL";
  const selectedRole =
    (table.getColumn("role")?.getFilterValue() as string) ?? "ALL";
  const selectedStatus =
    (table.getColumn("accountStatus")?.getFilterValue() as string) ?? "ALL";

  const totalFiltered = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const startRow = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const endRow = Math.min((pageIndex + 1) * pageSize, totalFiltered);
  const formattedEndRow =
    endRow > 0 && endRow < 10 ? `0${endRow}` : String(endRow);

  const resetFilters = React.useCallback(() => {
    setColumnFilters([]);
    setGlobalFilter("");
  }, []);

  return {
    table,
    globalFilter,
    setGlobalFilter,
    selectedTeamId,
    selectedDeliveryGroup,
    selectedRole,
    selectedStatus,
    totalFiltered,
    startRow,
    formattedEndRow,
    isPendingUnlock,
    handleUnlock,
    resetFilters,
  };
}
