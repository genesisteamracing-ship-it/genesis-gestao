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
  createCommunicationPlanSchema,
  type CreateCommunicationPlanInput,
} from "@/lib/validations/communication";
import { createCommunicationPlanAction } from "@/actions/communication-actions";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_FREQUENCY_LABELS,
} from "@/lib/communication-constants";
import type {
  CommunicationChannel,
  CommunicationFrequency,
  StakeholderWithRelations,
} from "@/types/communication";

interface CreateCommunicationPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeholders: StakeholderWithRelations[];
  defaultStakeholderId?: string;
}

export function CreateCommunicationPlanDialog({
  open,
  onOpenChange,
  stakeholders,
  defaultStakeholderId,
}: CreateCommunicationPlanDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCommunicationPlanInput>({
    resolver: zodResolver(createCommunicationPlanSchema),
    defaultValues: {
      stakeholderId: defaultStakeholderId || (stakeholders[0]?.id ?? ""),
      title: "",
      channel: "WHATSAPP",
      frequency: "MONTHLY",
      customApproach: "",
      keyInformation: "",
      responsibleMemberName: "",
      nextDispatchDate: "",
    },
  });

  const selectedStakeholderId = watch("stakeholderId");
  const selectedChannel = watch("channel");
  const selectedFreq = watch("frequency");

  const onSubmit = async (values: CreateCommunicationPlanInput) => {
    setIsPending(true);
    try {
      const res = await createCommunicationPlanAction(values);
      if (!res.success) {
        toast.error(res.message || "Erro ao criar plano de comunicação.");
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
            Criar Régua de Comunicação Contínua
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Estabeleça a cadência e os canais formais de contato para garantir transparência contínua.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Stakeholder */}
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Parte Interessada (Stakeholder) *</Label>
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

          {/* Título do Plano */}
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs font-semibold">
              Título da Cadência / Plano *
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Ex: Boletim Quinzenal de Engenharia & Caixa"
              className="text-xs sm:text-sm"
            />
            {errors.title && (
              <span className="text-[11px] text-destructive">{errors.title.message}</span>
            )}
          </div>

          {/* Canal e Frequência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Canal Oficial</Label>
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
              <Label className="text-xs font-semibold">Frequência da Régua</Label>
              <Select
                value={selectedFreq}
                onValueChange={(val) => setValue("frequency", val as CommunicationFrequency)}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COMMUNICATION_FREQUENCY_LABELS) as CommunicationFrequency[]).map((f) => (
                    <SelectItem key={f} value={f} className="text-xs">
                      {COMMUNICATION_FREQUENCY_LABELS[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Responsável e Próxima Data */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="responsibleMemberName" className="text-xs font-semibold">
                Integrante Responsável da Equipe *
              </Label>
              <Input
                id="responsibleMemberName"
                {...register("responsibleMemberName")}
                placeholder="Ex: Lucas Silva (Marketing)"
                className="text-xs"
              />
              {errors.responsibleMemberName && (
                <span className="text-[11px] text-destructive">
                  {errors.responsibleMemberName.message}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="nextDispatchDate" className="text-xs font-semibold">
                Data do Próximo Disparo
              </Label>
              <Input
                id="nextDispatchDate"
                type="date"
                {...register("nextDispatchDate")}
                className="text-xs"
              />
            </div>
          </div>

          {/* Abordagem Personalizada */}
          <div className="space-y-1">
            <Label htmlFor="customApproach" className="text-xs font-semibold">
              Abordagem e Tom de Voz
            </Label>
            <Textarea
              id="customApproach"
              {...register("customApproach")}
              placeholder="Ex: Linguagem executiva direta, anexando sempre o comprovante de ROI e fotos em alta resolução."
              rows={2}
              className="text-xs resize-none"
            />
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
              {isPending ? "Criando Régua..." : "Salvar Plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
