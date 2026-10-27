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
  return (
    <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
      <CardHeader className="p-7 pb-4">
        <CardTitle className="text-xl font-bold text-foreground">
          Trilha de Auditoria Anti-Invasão (AuthAuditLog)
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Monitoramento em tempo real de sessões httpOnly, falhas de autenticação,
          bloqueios automáticos por força bruta e alterações de permissão.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-7 pt-2">
        <div className="overflow-hidden rounded-xl border border-border">
          <Table>
            <TableHeader className="bg-muted [&_tr]:border-0">
              <TableRow className="hover:bg-muted">
                <TableHead className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-foreground">
                  DATA / HORA
                </TableHead>
                <TableHead className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-foreground">
                  EVENTO DE SEGURANÇA
                </TableHead>
                <TableHead className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-foreground">
                  E-MAIL ALVO / INTEGRANTE
                </TableHead>
                <TableHead className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-foreground">
                  IP ORIGEM
                </TableHead>
                <TableHead className="py-3.5 px-5 text-xs font-bold uppercase tracking-wider text-foreground">
                  DETALHAMENTO
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="border-b border-border/60 hover:bg-muted/40"
                  >
                    <TableCell className="py-3.5 px-5 font-mono text-xs text-muted-foreground">
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
                      <div className="font-semibold text-foreground">
                        {log.emailAttempt}
                      </div>
                      {log.userName && (
                        <div className="text-xs text-muted-foreground">
                          {log.userName}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-3.5 px-5 font-mono text-xs text-foreground">
                      {log.ipAddress ?? "127.0.0.1"}
                    </TableCell>
                    <TableCell className="py-3.5 px-5 text-xs text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
