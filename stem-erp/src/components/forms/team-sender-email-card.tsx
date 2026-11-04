"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ExternalLink,
  KeyRound,
  Mail,
  ShieldCheck,
  Unplug,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
import {
  revokeTeamEmailAuthorizationAction,
  updateTeamSenderEmailAction,
} from "@/actions/auth-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const senderEmailSectionStyles = tv({
  slots: {
    section: "space-y-3",
    headerRow: "flex flex-wrap items-center justify-between gap-2",
    card: "rounded-2xl border border-border bg-card shadow-xs",
    formGrid: "grid grid-cols-1 lg:grid-cols-12 gap-4 items-end",
    emailCol: "lg:col-span-5 space-y-1.5",
    passCol: "lg:col-span-5 space-y-1.5",
    actionsCol: "lg:col-span-2 flex flex-col sm:flex-row lg:flex-col gap-2",
  },
});

interface TeamSenderEmailCardProps {
  teamId: string;
  teamName: string;
  initialSenderEmail?: string | null;
  hasSmtpPassword?: boolean;
}

export function TeamSenderEmailCard({
  teamId,
  teamName,
  initialSenderEmail,
  hasSmtpPassword = false,
}: TeamSenderEmailCardProps) {
  const [senderEmail, setSenderEmail] = useState(
    initialSenderEmail?.trim() || "genesisteamracing@gmail.com"
  );
  const [smtpAppPassword, setSmtpAppPassword] = useState("");
  const [isActive, setIsActive] = useState(hasSmtpPassword);
  const [isSaving, setIsSaving] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const styles = senderEmailSectionStyles();

  const handleAuthorizeAndSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateTeamSenderEmailAction({
        teamId,
        senderEmail,
        smtpAppPassword,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      if (smtpAppPassword.trim().length > 0) {
        setIsActive(true);
        setSmtpAppPassword("");
      }
      toast.success(res.message);
    } catch {
      toast.error("Erro ao autorizar e salvar credenciais de e-mail.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      const res = await revokeTeamEmailAuthorizationAction(teamId);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      setIsActive(false);
      toast.success(res.message);
    } catch {
      toast.error("Não foi possível desconectar a autorização.");
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <section className={styles.section()} aria-labelledby="email-auth-heading">
      <div className={styles.headerRow()}>
        <div className="flex items-center gap-2.5">
          <h2 id="email-auth-heading" className="text-lg font-bold text-foreground">
            Acesso & Autorização de E-mails
          </h2>
          <Badge
            variant={isActive ? "success" : "destructive"}
            className="gap-1.5 px-3 py-1 text-xs font-bold"
          >
            {isActive ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Ativo</span>
              </>
            ) : (
              <>
                <XCircle className="h-3.5 w-3.5" />
                <span>Inativo</span>
              </>
            )}
          </Badge>
        </div>

        <a
          href="https://myaccount.google.com/apppasswords"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <span>Gerar Senha de App no Google</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <Card className={styles.card()}>
        <CardHeader className="p-4 sm:p-6 pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Autorização SMTP para Disparo de Relatórios ({teamName})</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Informe o e-mail remetente oficial e a <strong>Senha de App de 16 letras do Google</strong> para autorizar o envio automático e em 1 clique. O sistema testa a conexão em tempo real antes de ativar.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0 space-y-3">
          <form onSubmit={handleAuthorizeAndSave} className={styles.formGrid()}>
            <div className={styles.emailCol()}>
              <Label htmlFor="team-sender-email-input" className="flex items-center gap-1.5 text-xs font-semibold">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <span>E-mail de Envio da Equipe</span>
              </Label>
              <Input
                id="team-sender-email-input"
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="genesisteamracing@gmail.com"
                required
                className="text-xs sm:text-sm"
              />
            </div>

            <div className={styles.passCol()}>
              <Label htmlFor="team-smtp-pass-input" className="flex items-center gap-1.5 text-xs font-semibold">
                <KeyRound className="h-3.5 w-3.5 text-primary" />
                <span>Senha de App para Autorizar (16 letras)</span>
              </Label>
              <Input
                id="team-smtp-pass-input"
                type="password"
                value={smtpAppPassword}
                onChange={(e) => setSmtpAppPassword(e.target.value)}
                placeholder={
                  isActive
                    ? "•••••••••••••••• (Autorizado — digite para renovar)"
                    : "Cole aqui as 16 letras geradas no Google"
                }
                className="text-xs sm:text-sm"
              />
            </div>

            <div className={styles.actionsCol()}>
              <Button type="submit" disabled={isSaving} className="w-full gap-1.5 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>{isSaving ? "Verificando..." : "Autorizar"}</span>
              </Button>
              {isActive && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isRevoking}
                  onClick={handleRevoke}
                  className="w-full gap-1.5 text-xs text-destructive hover:text-destructive"
                >
                  <Unplug className="h-3.5 w-3.5" />
                  <span>{isRevoking ? "Desativando..." : "Desativar"}</span>
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
