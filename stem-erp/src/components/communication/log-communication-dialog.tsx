"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createCommunicationLogSchema,
  type CreateCommunicationLogInput,
} from "@/lib/validations/communication";
import { createCommunicationLogAction } from "@/actions/communication-actions";
import { COMMUNICATION_CHANNEL_LABELS } from "@/lib/communication-constants";
import type {
  CommunicationChannel,
  StakeholderWithRelations,
} from "@/types/communication";

interface LogCommunicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeholders: StakeholderWithRelations[];
  prefillData?: {
    stakeholderId: string;
    subject: string;
    channel: CommunicationChannel;
    contentSummary: string;
    reportTypeIncluded: string;
  } | null;
}

export function LogCommunicationDialog({
  open,
  onOpenChange,
  stakeholders,
  prefillData,
}: LogCommunicationDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCommunicationLogInput>({
    resolver: zodResolver(createCommunicationLogSchema),
    defaultValues: {
      stakeholderId: prefillData?.stakeholderId || (stakeholders[0]?.id ?? ""),
      subject: prefillData?.subject || "",
      channel: prefillData?.channel || "WHATSAPP",
      dispatchedByName: "",
      contentSummary: prefillData?.contentSummary || "",
      reportTypeIncluded: prefillData?.reportTypeIncluded || "FINANCIAL",
      evidenceLink: "",
    },
  });

  useEffect(() => {
    if (prefillData) {
      setValue("stakeholderId", prefillData.stakeholderId);
      setValue("subject", prefillData.subject);
      setValue("channel", prefillData.channel);
      setValue("contentSummary", prefillData.contentSummary);
      setValue("reportTypeIncluded", prefillData.reportTypeIncluded);
    }
  }, [prefillData, setValue]);

  const selectedStakeholderId = watch("stakeholderId");
  const selectedChannel = watch("channel");

  const onSubmit = async (values: CreateCommunicationLogInput) => {
    setIsPending(true);
    try {
      const res = await createCommunicationLogAction(values);
      if (!res.success) {
        toast.error(res.message || "Erro ao registrar comunicação.");
        return;
      }
      toast.success(res.message);
      reset();
      onOpenChange(false);
    } catch {
      toast.error("Ocorreu um erro inesperado.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto sm:max-w-lg p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Registrar Comunicação no Histórico
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Audite os disparos e interações com comprovação de contato e prestação de contas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Stakeholder */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Destinatário (Stakeholder) *</Label>
            <Select
              value={selectedStakeholderId}
              onValueChange={(val) => setValue("stakeholderId", val)}
            >
              <SelectTrigger className="w-full text-xs sm:text-sm">
                <SelectValue placeholder="Selecione um stakeholder" />
              </SelectTrigger>
              <SelectContent>
                {stakeholders.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name} {s.organization ? `(${s.organization})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.stakeholderId && (
              <span className="text-[11px] text-destructive">
                {errors.stakeholderId.message}
              </span>
            )}
          </div>

          {/* Assunto */}
          <div className="space-y-1">
            <Label htmlFor="subject" className="text-xs font-semibold">
              Assunto / Título do Disparo *
            </Label>
            <Input
              id="subject"
              {...register("subject")}
              placeholder="Ex: Envio do Relatório Mensal de ROI e Balanço"
              className="text-xs sm:text-sm"
            />
            {errors.subject && (
              <span className="text-[11px] text-destructive">{errors.subject.message}</span>
            )}
          </div>

          {/* Canal e Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Canal Utilizado</Label>
              <Select
                value={selectedChannel}
                onValueChange={(val) => setValue("channel", val as CommunicationChannel)}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COMMUNICATION_CHANNEL_LABELS) as CommunicationChannel[]).map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {COMMUNICATION_CHANNEL_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="dispatchedByName" className="text-xs font-semibold">
                Enviado Por (Membro da Equipe) *
              </Label>
              <Input
                id="dispatchedByName"
                {...register("dispatchedByName")}
                placeholder="Ex: Amanda Santos"
                className="text-xs"
              />
              {errors.dispatchedByName && (
                <span className="text-[11px] text-destructive">
                  {errors.dispatchedByName.message}
                </span>
              )}
            </div>
          </div>

          {/* Resumo do Conteúdo */}
          <div className="space-y-1">
            <Label htmlFor="contentSummary" className="text-xs font-semibold">
              Resumo da Mensagem Enviada *
            </Label>
            <Textarea
              id="contentSummary"
              {...register("contentSummary")}
              placeholder="Ex: Enviado balanço de despesas e comprovante de 2 posts com logo no Instagram."
              rows={3}
              className="text-xs resize-none"
            />
            {errors.contentSummary && (
              <span className="text-[11px] text-destructive">
                {errors.contentSummary.message}
              </span>
            )}
          </div>

          {/* Link de Evidência / Print */}
          <div className="space-y-1">
            <Label htmlFor="evidenceLink" className="text-xs font-semibold">
              Link de Evidência / Comprovante (Opcional)
            </Label>
            <Input
              id="evidenceLink"
              {...register("evidenceLink")}
              placeholder="https://drive.google.com/... ou link de ata"
              className="text-xs"
            />
            {errors.evidenceLink && (
              <span className="text-[11px] text-destructive">
                {errors.evidenceLink.message}
              </span>
            )}
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Registrando..." : "Confirmar Registro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
