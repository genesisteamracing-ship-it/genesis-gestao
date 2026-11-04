"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { AUTH_EVENT_LABELS } from "@/lib/constants";
import type { AuthAuditLogDTO } from "@/types/auth";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface SecurityAuditTableProps {
  logs: AuthAuditLogDTO[];
}

function getAuditBadgeVariant(
  event: AuthAuditLogDTO["event"]
): BadgeProps["variant"] {
  switch (event) {
    case "LOGIN_SUCCESS":
      return "success";
    case "LOGIN_FAILED":
      return "warning";
    case "ACCOUNT_LOCKED":
      return "destructive";
    case "USER_CREATED":
    case "USER_ROLE_UPDATED":
      return "purple";
    default:
      return "outline";
  }
}

export function SecurityAuditTable({ logs }: SecurityAuditTableProps) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const totalLogs = logs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalLogs);
  const currentLogs = React.useMemo(
    () => logs.slice(startIndex, endIndex),
    [logs, startIndex, endIndex]
  );
  const startRow = totalLogs === 0 ? 0 : startIndex + 1;

  const canPreviousPage = safeCurrentPage > 1;
  const canNextPage = safeCurrentPage < totalPages;

  return (
    <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
      <CardHeader className="p-4 sm:p-6 lg:p-7 pb-4">
        <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
          Trilha de Auditoria Anti-Invasão (AuthAuditLog)
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Monitoramento em tempo real de sessões httpOnly, falhas de autenticação,
          bloqueios automáticos por força bruta e alterações de permissão.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 lg:p-7 pt-2 space-y-4">
        <div className="relative w-full overflow-x-auto rounded-xl border border-border">
          <Table>
            <TableHeader className="bg-muted [&_tr]:border-0">
              <TableRow className="hover:bg-muted">
                <TableHead className="py-3.5 px-4 sm:px-5 text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                  DATA / HORA
                </TableHead>
                <TableHead className="py-3.5 px-4 sm:px-5 text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                  EVENTO DE SEGURANÇA
                </TableHead>
                <TableHead className="py-3.5 px-4 sm:px-5 text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                  E-MAIL ALVO / INTEGRANTE
                </TableHead>
                <TableHead className="py-3.5 px-4 sm:px-5 text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                  IP ORIGEM
                </TableHead>
                <TableHead className="py-3.5 px-4 sm:px-5 text-xs font-bold uppercase tracking-wider text-foreground whitespace-nowrap">
                  DETALHAMENTO
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLogs.length > 0 ? (
                currentLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-b border-border/60 hover:bg-muted/40"
                  >
                    <TableCell className="py-3.5 px-4 sm:px-5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      }).format(new Date(log.createdAt))}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                      <Badge variant={getAuditBadgeVariant(log.event)}>
                        {AUTH_EVENT_LABELS[log.event]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 px-4 sm:px-5 whitespace-nowrap">
                      <div className="font-semibold text-foreground">
                        {log.emailAttempt}
                      </div>
                      {log.userName && (
                        <div className="text-xs text-muted-foreground">
                          {log.userName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 sm:px-5 font-mono text-xs text-foreground whitespace-nowrap">
                      {log.ipAddress ?? "127.0.0.1"}
                    </TableCell>
                    <TableCell className="py-3.5 px-4 sm:px-5 text-xs text-muted-foreground whitespace-nowrap">
                      {log.details ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="p-8 text-center"
                  >
                    <StateView
                      state="empty"
                      title="Nenhum evento registrado"
                      description="Nenhum evento de segurança registrado até o momento."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginação da Trilha de Auditoria */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
            <p className="font-medium text-center sm:text-left">
              Mostrando {startRow}-{endIndex} de {totalLogs} registros
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs">Exibir:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[76px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5" className="text-xs">5 / pág</SelectItem>
                  <SelectItem value="10" className="text-xs">10 / pág</SelectItem>
                  <SelectItem value="20" className="text-xs">20 / pág</SelectItem>
                  <SelectItem value="50" className="text-xs">50 / pág</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
              Página {safeCurrentPage} de {totalPages}
            </span>
            <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-2xs">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={!canPreviousPage}
                aria-label="Primeira página"
                title="Primeira página"
                className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!canPreviousPage}
                aria-label="Página anterior"
                title="Página anterior"
                className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={!canNextPage}
                aria-label="Próxima página"
                title="Próxima página"
                className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
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
      </CardContent>
    </Card>
  );
}
