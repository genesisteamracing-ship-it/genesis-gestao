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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  return (
    <Card className="rounded-2xl border-0 bg-white shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
      <CardHeader className="p-7 pb-4">
        <CardTitle className="text-xl font-bold text-[#202224]">
          Trilha de Auditoria Anti-Invasão (AuthAuditLog)
        </CardTitle>
        <CardDescription className="text-xs text-[#606060]">
          Monitoramento em tempo real de sessões httpOnly, falhas de autenticação,
          bloqueios automáticos por força bruta e alterações de permissão.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-7 pt-2">
        <div className="overflow-hidden rounded-xl border border-[#E8E8E8]">
          <Table>
            <TableHeader className="bg-[#F1F4F9] [&_tr]:border-0">
              <TableRow className="hover:bg-[#F1F4F9]">
                <TableHead className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-[#202224]">
                  DATA / HORA
                </TableHead>
                <TableHead className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-[#202224]">
                  EVENTO DE SEGURANÇA
                </TableHead>
                <TableHead className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-[#202224]">
                  E-MAIL ALVO / INTEGRANTE
                </TableHead>
                <TableHead className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-[#202224]">
                  IP ORIGEM
                </TableHead>
                <TableHead className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-[#202224]">
                  DETALHAMENTO
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-b border-[#E8E8E8]/60 hover:bg-[#F9F9FB]"
                  >
                    <TableCell className="py-3.5 px-5 font-mono text-xs text-[#606060]">
                      {new Intl.DateTimeFormat("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "medium",
                      }).format(new Date(log.createdAt))}
                    </TableCell>
                    <TableCell className="py-3.5 px-5">
                      <Badge variant={getAuditBadgeVariant(log.event)}>
                        {AUTH_EVENT_LABELS[log.event]}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 px-5">
                      <div className="font-semibold text-[#202224]">
                        {log.emailAttempt}
                      </div>
                      {log.userName && (
                        <div className="text-xs text-[#606060]">
                          {log.userName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-5 font-mono text-xs text-[#202224]">
                      {log.ipAddress ?? "127.0.0.1"}
                    </TableCell>
                    <TableCell className="py-3.5 px-5 text-xs text-[#606060]">
                      {log.details ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-[#606060]"
                  >
                    Nenhum evento de segurança registrado até o momento.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
