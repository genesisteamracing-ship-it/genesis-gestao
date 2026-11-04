"use client";

import { useState } from "react";
import { Mail, Save } from "lucide-react";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
import { updateTeamSenderEmailAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const senderEmailCardStyles = tv({
  slots: {
    card: "rounded-2xl border border-border bg-card shadow-xs",
    formRow: "flex flex-col sm:flex-row sm:items-end gap-3",
    inputWrapper: "min-w-0 flex-1 space-y-1.5",
  },
});

interface TeamSenderEmailCardProps {
  teamId: string;
  teamName: string;
  initialSenderEmail?: string | null;
}

export function TeamSenderEmailCard({
  teamId,
  teamName,
  initialSenderEmail,
}: TeamSenderEmailCardProps) {
  const [senderEmail, setSenderEmail] = useState(
    initialSenderEmail?.trim() || "genesisteamracing@gmail.com"
  );
  const [isSaving, setIsSaving] = useState(false);
  const styles = senderEmailCardStyles();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await updateTeamSenderEmailAction({
        teamId,
        senderEmail,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
    } catch {
      toast.error("Erro ao salvar o e-mail de envio da equipe.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={styles.card()}>
      <CardHeader className="p-4 sm:p-6 pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
          <Mail className="h-4 w-4 text-primary" />
          <span>E-mail de Envio de Relatórios ({teamName})</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Endereço remetente oficial utilizado nos disparos de relatórios e nos agendamentos automáticos da equipe.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">
        <form onSubmit={handleSave} className={styles.formRow()}>
          <div className={styles.inputWrapper()}>
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
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto gap-2 font-semibold"
          >
            <Save className="h-4 w-4" />
            <span>{isSaving ? "Salvando..." : "Salvar E-mail de Envio"}</span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
