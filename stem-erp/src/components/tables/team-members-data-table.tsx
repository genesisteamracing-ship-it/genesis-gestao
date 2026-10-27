"use client";

import * as React from "react";
import { flexRender, type ColumnDef } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Search,
  Unlock,
} from "lucide-react";
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
import { StateView } from "@/components/ui/state-view";
import { MemberRowActions } from "@/components/tables/member-row-actions";
import { useTeamMembersTable } from "@/components/tables/use-team-members-table";

interface TeamMembersDataTableProps {
  teams: TeamDTO[];
  members: TeamMemberDTO[];
  isLoading?: boolean;
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
  isLoading = false,
}: TeamMembersDataTableProps) {
  const [targetUserId, setTargetUserId] = React.useState<string | null>(null);

  const columns = React.useMemo<ColumnDef<TeamMemberDTO>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="font-mono text-xs font-semibold text-foreground">
            USR-{String(row.index + 1).padStart(3, "0")}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "INTEGRANTE & E-MAIL",
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <div className="font-semibold text-foreground">{row.original.name}</div>
            <div className="font-mono text-xs text-muted-foreground">
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
            <div className="font-semibold text-foreground">
              {row.original.deliveryGroup
                ? DELIVERY_GROUP_LABELS[row.original.deliveryGroup]
                : "Todos os Setores"}
            </div>
            <div className="text-xs text-muted-foreground">
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
            <div className="font-medium text-foreground">
              {row.original.activeSessionsCount} sessão(ões) httpOnly
            </div>
            <div className="text-muted-foreground">
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
            <MemberRowActions member={row.original} teams={teams} />
            {(row.original.isLocked || row.original.failedLoginAttempts > 0) && (
              <Button
                variant="outline"
                size="sm"
                disabled={targetUserId === row.original.id}
                onClick={() => setTargetUserId(row.original.id)}
                className="h-8 gap-1 border-success text-xs text-success hover:bg-success/10"
              >
                <Unlock className="h-3.5 w-3.5" />
                <span>Desbloquear</span>
              </Button>
            )}
          </div>
        ),
      },
    ],
    [targetUserId, teams]
  );

  const {
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
    handleUnlock,
    resetFilters,
  } = useTeamMembersTable(members, columns);

  React.useEffect(() => {
    if (targetUserId) {
      handleUnlock(targetUserId);
      setTargetUserId(null);
    }
  }, [targetUserId, handleUnlock]);

  if (isLoading) {
    return <StateView state="loading" />;
  }

  return (
    <div className="space-y-4">
      {/* 1. Busca rápida */}
      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
        <Input
          placeholder="Buscar integrante por nome, e-mail ou cargo..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-11 w-full rounded-xl border-input bg-card pl-10 text-sm"
        />
      </div>

      {/* 2. Barra de Filtros Responsiva */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex w-full gap-2 lg:gap-0 bg-muted/40 p-2 lg:p-0 rounded-xl border border-border shadow-2xs">
        <div className="hidden lg:flex items-center justify-center border-r border-border bg-card px-4 py-3 shrink-0 rounded-l-xl">
          <Filter className="h-4 w-4 text-foreground" />
        </div>

        <div className="hidden lg:flex items-center border-r border-border bg-card px-4 py-3 text-sm font-bold text-foreground shrink-0">
          Filtrar Por
        </div>

        <div className="flex flex-1 min-w-0 lg:min-w-[150px] items-center rounded-lg lg:rounded-none lg:border-r border-border bg-card">
          <Select
            value={selectedTeamId}
            onValueChange={(val) =>
              table
                .getColumn("teamId")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-11 w-full rounded-lg lg:rounded-none border-0 bg-card px-3 sm:px-4 py-2.5 text-sm font-semibold text-foreground shadow-none focus:ring-0">
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

        <div className="flex flex-1 min-w-0 lg:min-w-[160px] items-center rounded-lg lg:rounded-none lg:border-r border-border bg-card">
          <Select
            value={selectedDeliveryGroup}
            onValueChange={(val) =>
              table
                .getColumn("deliveryGroup")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-11 w-full rounded-lg lg:rounded-none border-0 bg-card px-3 sm:px-4 py-2.5 text-sm font-semibold text-foreground shadow-none focus:ring-0">
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

        <div className="flex flex-1 min-w-0 lg:min-w-[150px] items-center rounded-lg lg:rounded-none lg:border-r border-border bg-card">
          <Select
            value={selectedRole}
            onValueChange={(val) =>
              table
                .getColumn("role")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-11 w-full rounded-lg lg:rounded-none border-0 bg-card px-3 sm:px-4 py-2.5 text-sm font-semibold text-foreground shadow-none focus:ring-0">
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

        <div className="flex flex-1 min-w-0 lg:min-w-[140px] items-center rounded-lg lg:rounded-none lg:border-r border-border bg-card">
          <Select
            value={selectedStatus}
            onValueChange={(val) =>
              table
                .getColumn("accountStatus")
                ?.setFilterValue(val === "ALL" ? undefined : val)
            }
          >
            <SelectTrigger className="h-11 w-full rounded-lg lg:rounded-none border-0 bg-card px-3 sm:px-4 py-2.5 text-sm font-semibold text-foreground shadow-none focus:ring-0">
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
          onClick={resetFilters}
          className="col-span-1 sm:col-span-2 lg:col-span-1 flex h-11 items-center justify-center gap-2 rounded-lg lg:rounded-none lg:rounded-r-xl bg-card px-4 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 cursor-pointer shrink-0"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Resetar Filtro</span>
        </button>
      </div>

      {/* 3. Card da Tabela com Scroll Suave */}
      <div className="relative w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-2xs">
        <Table>
          <TableHeader className="bg-muted/40 border-b border-border">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-11 px-4 py-3 sm:px-6 sm:py-3.5 text-xs font-extrabold uppercase tracking-wider text-foreground whitespace-nowrap"
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
                  className="border-b border-border/50 hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-foreground whitespace-nowrap"
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
                  className="p-8 text-center"
                >
                  <StateView
                    state="empty"
                    title="Nenhum integrante encontrado"
                    description="Não há integrantes cadastrados para os filtros aplicados."
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. Paginação */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-1">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground text-center sm:text-left">
          Mostrando {startRow}-{formattedEndRow} de {totalFiltered}
        </p>

        <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-2xs">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Página anterior"
            className="flex h-9 w-11 sm:h-8 sm:w-10 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Próxima página"
            className="flex h-9 w-11 sm:h-8 sm:w-10 items-center justify-center text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
