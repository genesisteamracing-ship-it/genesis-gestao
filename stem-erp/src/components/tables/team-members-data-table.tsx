"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { unlockUserAccountAction } from "@/actions/auth-actions";
import { DELIVERY_GROUP_LABELS, USER_ROLE_LABELS } from "@/lib/constants";
import { userRoleValues } from "@/lib/validations/auth";
import { deliveryGroupValues } from "@/lib/validations/financial";
import { formatDateBR } from "@/lib/utils";
import type { TeamDTO, TeamMemberDTO } from "@/types/auth";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { EditMemberDialog } from "@/components/modals/edit-member-dialog";

interface TeamMembersDataTableProps {
  teams: TeamDTO[];
  members: TeamMemberDTO[];
}

function getRoleBadgeVariant(role: TeamMemberDTO["role"]): BadgeProps["variant"] {
  switch (role) {
    case "SUPER_ADMIN":
      return "default";
    case "FINANCE_MANAGER":
      return "purple";
    case "TEAM_LEAD":
      return "success";
    case "AUDITOR":
      return "warning";
    default:
      return "secondary";
  }
}

export function TeamMembersDataTable({
  teams,
  members,
}: TeamMembersDataTableProps) {
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

  const columns = React.useMemo<ColumnDef<TeamMemberDTO>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-[#202224]">
            USR-{String(row.index + 1).padStart(3, "0")}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "INTEGRANTE & E-MAIL",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-[#202224]">{row.original.name}</div>
            <div className="font-mono text-xs text-[#606060]">
              {row.original.email}
            </div>
          </div>
        ),
      },
      {
        id: "teamId",
        accessorFn: (row) => row.teamId ?? "NONE",
        header: "EQUIPE (ISOLADA)",
        filterFn: "equalsString",
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.teamName?.toLowerCase().includes("alpha")
                ? "magenta"
                : "purple"
            }
          >
            {row.original.teamName ?? "Sem Equipe"}
          </Badge>
        ),
      },
      {
        id: "deliveryGroup",
        accessorFn: (row) => row.deliveryGroup ?? "NONE",
        header: "SETOR INTERNO & CARGO",
        filterFn: "equalsString",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-[#202224]">
              {row.original.deliveryGroup
                ? DELIVERY_GROUP_LABELS[row.original.deliveryGroup]
                : "Todos os Setores"}
            </div>
            <div className="text-xs text-[#606060]">
              {row.original.jobTitle || "Integrante"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "PERMISSÃO (RBAC)",
        filterFn: "equalsString",
        cell: ({ row }) => (
          <Badge variant={getRoleBadgeVariant(row.original.role)}>
            {USER_ROLE_LABELS[row.original.role]}
          </Badge>
        ),
      },
      {
        id: "security",
        header: "SEGURANÇA / SESSÕES",
        cell: ({ row }) => (
          <div className="space-y-0.5 text-xs">
            <div className="font-medium text-[#202224]">
              {row.original.activeSessionsCount} sessão(ões) httpOnly
            </div>
            <div className="text-[#606060]">
              {row.original.lastLoginAt
                ? `Último login: ${formatDateBR(row.original.lastLoginAt)}`
                : "Sem login recente"}
            </div>
          </div>
        ),
      },
      {
        id: "accountStatus",
        accessorFn: (row) => {
          if (row.isLocked) return "LOCKED";
          return row.isActive ? "ACTIVE" : "INACTIVE";
        },
        header: "STATUS",
        filterFn: "equalsString",
        cell: ({ row }) => {
          if (row.original.isLocked) {
            return (
              <Badge variant="destructive">
                Bloqueado ({row.original.failedLoginAttempts} falhas)
              </Badge>
            );
          }
          if (!row.original.isActive) {
            return <Badge variant="warning">Inativo</Badge>;
          }
          return <Badge variant="success">Ativo</Badge>;
        },
      },
      {
        id: "actions",
        header: "AÇÕES DO SUPERADMIN",
        cell: ({ row }) => (
          <div className="flex flex-wrap items-center gap-2">
            <EditMemberDialog member={row.original} teams={teams} />
            {(row.original.isLocked || row.original.failedLoginAttempts > 0) && (
              <Button
                variant="outline"
                size="sm"
                disabled={isPendingUnlock}
                onClick={() => handleUnlock(row.original.id)}
                className="h-8 gap-1 border-[#00B69B] text-xs text-[#00B69B] hover:bg-[#00B69B]/10"
              >
                <Unlock className="h-3.5 w-3.5" />
                <span>Desbloquear</span>
              </Button>
            )}
          </div>
        ),
      },
    ],
    [handleUnlock, isPendingUnlock, teams]
  );

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

  return (
    <div className="space-y-4">
      {/* 1. Busca rápida ocupando 100% da largura no topo */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#202224]/40" />
        <Input
          placeholder="Buscar integrante por nome, e-mail ou cargo..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-11 w-full rounded-xl border-[#D5D5D5] bg-white pl-10 text-sm"
        />
      </div>

      {/* 2. Barra de Filtros Segmentada ocupando 100% da largura */}
      <div className="flex w-full flex-wrap items-stretch overflow-hidden rounded-xl border border-[#D5D5D5] bg-[#F9F9FB] shadow-2xs">
        <div className="flex items-center justify-center border-r border-[#D5D5D5] bg-white px-5 py-3 shrink-0">
          <Filter className="h-4 w-4 text-[#202224]" />
        </div>

        <div className="flex items-center border-r border-[#D5D5D5] bg-white px-5 py-3 text-sm font-bold text-[#202224] shrink-0">
          Filtrar Por
        </div>

        <div className="flex flex-1 min-w-[150px] items-center border-r border-[#D5D5D5] bg-white">
          <Select
            value={selectedTeamId}
            onValueChange={(val) =>
              table
                .getColumn("teamId")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-full w-full rounded-none border-0 bg-white px-4 py-3 text-sm font-bold text-[#202224] shadow-none focus:ring-0">
              <SelectValue placeholder="Equipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Equipes</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 min-w-[160px] items-center border-r border-[#D5D5D5] bg-white">
          <Select
            value={selectedDeliveryGroup}
            onValueChange={(val) =>
              table
                .getColumn("deliveryGroup")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-full w-full rounded-none border-0 bg-white px-4 py-3 text-sm font-bold text-[#202224] shadow-none focus:ring-0">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os Setores</SelectItem>
              {deliveryGroupValues.map((group) => (
                <SelectItem key={group} value={group}>
                  {DELIVERY_GROUP_LABELS[group]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 min-w-[150px] items-center border-r border-[#D5D5D5] bg-white">
          <Select
            value={selectedRole}
            onValueChange={(val) =>
              table
                .getColumn("role")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-full w-full rounded-none border-0 bg-white px-4 py-3 text-sm font-bold text-[#202224] shadow-none focus:ring-0">
              <SelectValue placeholder="Permissão" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Permissões</SelectItem>
              {userRoleValues.map((role) => (
                <SelectItem key={role} value={role}>
                  {USER_ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 min-w-[140px] items-center border-r border-[#D5D5D5] bg-white">
          <Select
            value={selectedStatus}
            onValueChange={(val) =>
              table
                .getColumn("accountStatus")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-full w-full rounded-none border-0 bg-white px-4 py-3 text-sm font-bold text-[#202224] shadow-none focus:ring-0">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Status da Conta</SelectItem>
              <SelectItem value="ACTIVE">Ativo</SelectItem>
              <SelectItem value="LOCKED">Bloqueado (Anti-Invasão)</SelectItem>
              <SelectItem value="INACTIVE">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={() => {
            setColumnFilters([]);
            setGlobalFilter("");
          }}
          className="flex items-center gap-2 bg-white px-5 py-3 text-sm font-semibold text-[#EA0234] transition-colors hover:bg-red-50/60 cursor-pointer shrink-0"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Resetar Filtro</span>
        </button>
      </div>

      {/* Card da Tabela */}
      <div className="overflow-hidden rounded-2xl border border-[#D5D5D5]/70 bg-white shadow-[0_6px_24px_-4px_rgba(16,24,40,0.03)]">
        <Table>
          <TableHeader className="bg-[#FCFDFD] border-b border-[#D5D5D5]/70">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-[#FCFDFD]">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 px-6 py-3.5 text-xs font-extrabold uppercase tracking-wider text-[#202224]"
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
                <TableRow
                  key={row.id}
                  className="border-b border-[#D5D5D5]/50 hover:bg-[#F9F9FB]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-6 py-4 text-sm text-[#202224]"
                    >
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
                  className="h-28 text-center text-sm text-[#606060]"
                >
                  Nenhum integrante encontrado para os filtros aplicados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação estilo tabela.png */}
      <div className="flex items-center justify-between px-1 pt-1">
        <p className="text-sm font-medium text-[#202224]/60">
          Mostrando {startRow}-{formattedEndRow} de {totalFiltered}
        </p>

        <div className="inline-flex items-center overflow-hidden rounded-lg border border-[#D5D5D5] bg-[#FAFBFD] shadow-2xs">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
            className="flex h-8 w-10 items-center justify-center border-r border-[#D5D5D5] text-[#202224] transition-colors hover:bg-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Próxima página"
            className="flex h-8 w-10 items-center justify-center text-[#202224] transition-colors hover:bg-white disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
