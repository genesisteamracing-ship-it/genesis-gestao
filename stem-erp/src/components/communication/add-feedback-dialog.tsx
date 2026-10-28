"use client";

import { useState } from "react";
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
  createFeedbackSchema,
  type CreateFeedbackInput,
} from "@/lib/validations/communication";
import { createFeedbackAction } from "@/actions/communication-actions";
import { FEEDBACK_SENTIMENT_LABELS } from "@/lib/communication-constants";
import type { FeedbackSentiment } from "@/types/communication";

interface AddFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  communicationLogId: string;
  logSubject?: string;
}

export function AddFeedbackDialog({
  open,
  onOpenChange,
  communicationLogId,
  logSubject,
}: AddFeedbackDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateFeedbackInput>({
    resolver: zodResolver(createFeedbackSchema),
    defaultValues: {
      communicationLogId,
      sentiment: "POSITIVE",
      stakeholderResponse: "",
      continuousImprovementAction: "",
      isAddressed: false,
    },
  });

  const selectedSentiment = watch("sentiment");

  const onSubmit = async (values: CreateFeedbackInput) => {
    setIsPending(true);
    try {
      const res = await createFeedbackAction({
        ...values,
        communicationLogId,
      });

      if (!res.success) {
        toast.error(res.message || "Erro ao registrar feedback.");
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
            Registrar Ciclo de Feedback & Melhoria
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {logSubject
              ? `Feedback recebido referente ao disparo: "${logSubject}"`
              : "Comprove a escuta ativa e a evolução dos processos com base no retorno do stakeholder."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Sentimento / Tom da resposta */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Percepção / Sentimento do Stakeholder</Label>
            <Select
              value={selectedSentiment}
              onValueChange={(val) => setValue("sentiment", val as FeedbackSentiment)}
            >
              <SelectTrigger className="w-full text-xs sm:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FEEDBACK_SENTIMENT_LABELS) as FeedbackSentiment[]).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {FEEDBACK_SENTIMENT_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* O que o stakeholder respondeu */}
          <div className="space-y-1">
            <Label htmlFor="stakeholderResponse" className="text-xs font-semibold">
              Retorno do Stakeholder *
            </Label>
            <Textarea
              id="stakeholderResponse"
              {...register("stakeholderResponse")}
              placeholder="Ex: Parabenizou pelo relatório, mas solicitou que os dados fossem enviados até quarta-feira para coincidir com a reunião de diretoria deles."
              rows={3}
              className="text-xs resize-none"
            />
            {errors.stakeholderResponse && (
              <span className="text-[11px] text-destructive">
                {errors.stakeholderResponse.message}
              </span>
            )}
          </div>

          {/* Ação de Melhoria Contínua Implementada */}
          <div className="space-y-1">
            <Label htmlFor="continuousImprovementAction" className="text-xs font-semibold">
              Ação de Melhoria Contínua Implementada pelo Time
            </Label>
            <Textarea
              id="continuousImprovementAction"
              {...register("continuousImprovementAction")}
              placeholder="Ex: Alteramos a régua de envio para toda terça-feira às 14h e adicionamos o resumo em 3 tópicos no WhatsApp."
              rows={3}
              className="text-xs resize-none"
            />
            <span className="text-[11px] text-muted-foreground block">
              Essa evidência comprova aos avaliadores o ciclo PDCA e a maturidade de gestão da equipe.
            </span>
          </div>

          {/* Marcar se já foi implementada */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAddressed"
              {...register("isAddressed")}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <Label htmlFor="isAddressed" className="text-xs font-medium cursor-pointer">
              Melhoria já implementada e em vigor na rotina da equipe
            </Label>
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
              {isPending ? "Salvando..." : "Registrar Ciclo de Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
