"use client";

import { useState } from "react";
import { KeyRound, Mail, Save } from "lucide-react";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
import { updateTeamSenderEmailAction } from "@/actions/auth-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const senderEmailCardStyles = tv({
  slots: {
    card: "rounded-2xl border border-border bg-card shadow-xs",
    formGrid: "grid grid-cols-1 md:grid-cols-12 gap-3 items-end",
    emailCol: "md:col-span-5 space-y-1.5",
    passCol: "md:col-span-5 space-y-1.5",
    actionCol: "md:col-span-2",
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
  const [isConfigured, setIsConfigured] = useState(hasSmtpPassword);
  const [isSaving, setIsSaving] = useState(false);
  const styles = senderEmailCardStyles();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
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
        setIsConfigured(true);
        setSmtpAppPassword("");
      }
      toast.success(res.message);
    } catch {
      toast.error("Erro ao salvar a configuração de e-mail da equipe.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={styles.card()}>
      <CardHeader className="p-4 sm:p-6 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <Mail className="h-4 w-4 text-primary" />
            <span>Configuração de E-mail de Envio ({teamName})</span>
          </CardTitle>
          <Badge variant={isConfigured ? "success" : "outline"} className="text-xs">
            {isConfigured ? "SMTP Ativo (Pronto para Enviar)" : "Requer Senha de App do Google"}
          </Badge>
        </div>
        <CardDescription className="text-xs sm:text-sm">
          Para que o Gmail permita disparos automáticos por <strong>{senderEmail}</strong>, gere uma{" "}
          <strong>Senha de App de 16 letras</strong> na conta Google (Segurança &gt; Verificação em duas etapas &gt; Senhas de app) e salve abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <form onSubmit={handleSave} className={styles.formGrid()}>
          <div className={styles.emailCol()}>
            <Label htmlFor="team-sender-email-input" className="text-xs font-semibold">
              E-mail Oficial de Envio
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
              <span>Senha de App do Google (16 letras)</span>
            </Label>
            <Input
              id="team-smtp-pass-input"
              type="password"
              value={smtpAppPassword}
              onChange={(e) => setSmtpAppPassword(e.target.value)}
              placeholder={
                isConfigured
                  ? "•••••••••••••••• (Já configurada — digite para alterar)"
                  : "Ex: abcd efgh ijkl mnop"
              }
              className="text-xs sm:text-sm"
            />
          </div>

          <div className={styles.actionCol()}>
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full gap-2 font-semibold"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? "Salvando..." : "Salvar"}</span>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
