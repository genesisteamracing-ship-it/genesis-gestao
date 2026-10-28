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
  createStakeholderSchema,
  type CreateStakeholderInput,
} from "@/lib/validations/communication";
import { createStakeholderAction } from "@/actions/communication-actions";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_FREQUENCY_LABELS,
  ENGAGEMENT_LEVEL_LABELS,
  STAKEHOLDER_GROUP_LABELS,
  STAKEHOLDER_INTEREST_LABELS,
  STAKEHOLDER_POWER_LABELS,
} from "@/lib/communication-constants";
import type {
  CommunicationChannel,
  CommunicationFrequency,
  EngagementLevel,
  StakeholderGroup,
  StakeholderInterest,
  StakeholderPower,
} from "@/types/communication";

interface CreateStakeholderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsors?: Array<{ id: string; name: string }>;
}

export function CreateStakeholderDialog({
  open,
  onOpenChange,
  sponsors = [],
}: CreateStakeholderDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateStakeholderInput>({
    resolver: zodResolver(createStakeholderSchema),
    defaultValues: {
      name: "",
      organization: "",
      roleOrJobTitle: "",
      group: "SPONSORS",
      power: "LOW",
      interest: "LOW",
      currentEngagement: "NEUTRAL",
      targetEngagement: "SUPPORTIVE",
      preferredChannel: "WHATSAPP",
      preferredFrequency: "MONTHLY",
      email: "",
      phone: "",
      notes: "",
    },
  });

  const selectedGroup = watch("group");
  const selectedPower = watch("power");
  const selectedInterest = watch("interest");
  const selectedCurrent = watch("currentEngagement");
  const selectedTarget = watch("targetEngagement");
  const selectedChannel = watch("preferredChannel");
  const selectedFreq = watch("preferredFrequency");
  const selectedSponsorId = watch("sponsorId");

  const onSubmit = async (values: CreateStakeholderInput) => {
    setIsPending(true);
    try {
      const res = await createStakeholderAction(values);
      if (!res.success) {
        toast.error(res.message || "Erro ao salvar stakeholder.");
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
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto sm:max-w-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">
            Cadastrar Parte Interessada (Stakeholder)
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Mapeie relacionamentos estratégicos, poder de influência e frequência de contato da equipe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Nome e Organização */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-semibold">
                Nome da Pessoa / Contato *
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ex: Fernanda Lima"
                className="text-xs sm:text-sm"
              />
              {errors.name && (
                <span className="text-[11px] text-destructive">{errors.name.message}</span>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="organization" className="text-xs font-semibold">
                Organização / Entidade
              </Label>
              <Input
                id="organization"
                {...register("organization")}
                placeholder="Ex: Bosch Brasil / Colégio Alfa"
                className="text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Grupo e Cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Grupo de Stakeholder *</Label>
              <Select
                value={selectedGroup}
                onValueChange={(val) => setValue("group", val as StakeholderGroup)}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STAKEHOLDER_GROUP_LABELS) as StakeholderGroup[]).map((g) => (
                    <SelectItem key={g} value={g} className="text-xs">
                      {STAKEHOLDER_GROUP_LABELS[g]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="roleOrJobTitle" className="text-xs font-semibold">
                Cargo / Função
              </Label>
              <Input
                id="roleOrJobTitle"
                {...register("roleOrJobTitle")}
                placeholder="Ex: Gerente de Comunicação"
                className="text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Vínculo de Patrocinador Opcional */}
          {selectedGroup === "SPONSORS" && sponsors.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs font-semibold">
                Vincular a Patrocinador Cadastrado no ERP
              </Label>
              <Select
                value={selectedSponsorId || "none"}
                onValueChange={(val) => setValue("sponsorId", val === "none" ? null : val)}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue placeholder="Selecione um patrocinador (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">
                    Nenhum (Avulso / Prospecção)
                  </SelectItem>
                  {sponsors.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id} className="text-xs">
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Contato: E-mail e WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="contato@empresa.com"
                className="text-xs"
              />
              {errors.email && (
                <span className="text-[11px] text-destructive">{errors.email.message}</span>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs font-semibold">
                WhatsApp
              </Label>
              <Input
                id="phone"
                {...register("phone")}
                placeholder="(11) 98765-4321"
                className="text-xs"
              />
            </div>
          </div>

          {/* Matriz Mendelow: Poder e Interesse */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border/60">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Poder de Decisão / Influência</Label>
              <Select
                value={selectedPower}
                onValueChange={(val) => setValue("power", val as StakeholderPower)}
              >
                <SelectTrigger className="w-full text-xs bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STAKEHOLDER_POWER_LABELS) as StakeholderPower[]).map((p) => (
                    <SelectItem key={p} value={p} className="text-xs">
                      {STAKEHOLDER_POWER_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nível de Interesse na Equipe</Label>
              <Select
                value={selectedInterest}
                onValueChange={(val) => setValue("interest", val as StakeholderInterest)}
              >
                <SelectTrigger className="w-full text-xs bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STAKEHOLDER_INTEREST_LABELS) as StakeholderInterest[]).map((i) => (
                    <SelectItem key={i} value={i} className="text-xs">
                      {STAKEHOLDER_INTEREST_LABELS[i]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gap Analysis: Engajamento Atual vs Almejado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/40 rounded-lg border border-border/60">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Engajamento Atual (C)</Label>
              <Select
                value={selectedCurrent}
                onValueChange={(val) => setValue("currentEngagement", val as EngagementLevel)}
              >
                <SelectTrigger className="w-full text-xs bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ENGAGEMENT_LEVEL_LABELS) as EngagementLevel[]).map((lvl) => (
                    <SelectItem key={lvl} value={lvl} className="text-xs">
                      {ENGAGEMENT_LEVEL_LABELS[lvl]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Engajamento Almejado (D)</Label>
              <Select
                value={selectedTarget}
                onValueChange={(val) => setValue("targetEngagement", val as EngagementLevel)}
              >
                <SelectTrigger className="w-full text-xs bg-card">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ENGAGEMENT_LEVEL_LABELS) as EngagementLevel[]).map((lvl) => (
                    <SelectItem key={lvl} value={lvl} className="text-xs">
                      {ENGAGEMENT_LEVEL_LABELS[lvl]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preferência de Canal e Frequência */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Canal Preferencial</Label>
              <Select
                value={selectedChannel}
                onValueChange={(val) => setValue("preferredChannel", val as CommunicationChannel)}
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
              <Label className="text-xs font-semibold">Frequência Planejada</Label>
              <Select
                value={selectedFreq}
                onValueChange={(val) => setValue("preferredFrequency", val as CommunicationFrequency)}
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

          {/* Observações e Abordagem */}
          <div className="space-y-1">
            <Label htmlFor="notes" className="text-xs font-semibold">
              Estratégia & Abordagem Personalizada
            </Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Ex: Prioriza relatórios resumidos com fotos da oficina. Contato preferencial no período da tarde."
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
              {isPending ? "Cadastrando..." : "Cadastrar Stakeholder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
