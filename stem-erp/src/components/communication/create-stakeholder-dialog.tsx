"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createStakeholderSchema, type CreateStakeholderInput } from "@/lib/validations/communication";
import { createStakeholderAction } from "@/actions/communication-actions";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_FREQUENCY_LABELS,
  ENGAGEMENT_LEVEL_LABELS,
  STAKEHOLDER_GROUP_LABELS,
  STAKEHOLDER_INTEREST_LABELS,
  STAKEHOLDER_POWER_LABELS,
} from "@/lib/communication-constants";
import { computeHierarchyTier } from "@/lib/communication-hierarchy";
import type { QuickAddStakeholderPrefill } from "@/hooks/use-stakeholder-org-map";
import type {
  CommunicationChannel,
  CommunicationFrequency,
  EngagementLevel,
  StakeholderGroup,
  StakeholderInterest,
  StakeholderPower,
  StakeholderWithRelations,
} from "@/types/communication";

interface CreateStakeholderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sponsors?: Array<{ id: string; name: string }>;
  existingStakeholders?: StakeholderWithRelations[];
  prefill?: QuickAddStakeholderPrefill | null;
}

export function CreateStakeholderDialog({
  open,
  onOpenChange,
  sponsors = [],
  existingStakeholders = [],
  prefill = null,
}: CreateStakeholderDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<CreateStakeholderInput>({
      resolver: zodResolver(createStakeholderSchema),
      defaultValues: {
        name: "",
        organization: prefill?.organization ?? "",
        roleOrJobTitle: "",
        group: "SPONSORS",
        sponsorId: prefill?.sponsorId ?? null,
        parentStakeholderId: prefill?.parentStakeholderId ?? null,
        power: "HIGH",
        interest: "HIGH",
        currentEngagement: "NEUTRAL",
        targetEngagement: "SUPPORTIVE",
        preferredChannel: "WHATSAPP",
        preferredFrequency: "MONTHLY",
        email: "",
        phone: "",
        notes: "",
      },
    });

  useEffect(() => {
    if (open) {
      setValue("organization", prefill?.organization ?? "");
      setValue("sponsorId", prefill?.sponsorId ?? null);
      setValue("parentStakeholderId", prefill?.parentStakeholderId ?? null);
    }
  }, [open, prefill, setValue]);

  const selectedGroup = watch("group");
  const selectedPower = watch("power");
  const selectedInterest = watch("interest");
  const selectedCurrent = watch("currentEngagement");
  const selectedTarget = watch("targetEngagement");
  const selectedChannel = watch("preferredChannel");
  const selectedFreq = watch("preferredFrequency");
  const selectedParentId = watch("parentStakeholderId");
  const currentOrg = watch("organization");

  const tierPreview = computeHierarchyTier(selectedPower, selectedInterest);
  const samePartnerStakeholders = existingStakeholders.filter(
    (s) =>
      !currentOrg?.trim() ||
      (s.organization || s.sponsor?.name || "").toLowerCase() ===
        currentOrg.trim().toLowerCase()
  );

  const onSubmit = async (values: CreateStakeholderInput) => {
    setIsPending(true);
    try {
      const res = await createStakeholderAction(values);
      if (!res.success) return void toast.error(res.message || "Erro ao salvar stakeholder.");
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
          <DialogTitle className="text-base sm:text-lg">Cadastrar Stakeholder no Mapa Hierárquico</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Informe o Parceiro (ex: SESI, SENAI) e o nível de Poder/Interesse para posicionar na árvore.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="organization" className="text-xs font-semibold">Parceiro / Organização *</Label>
              <Input id="organization" list="partner-organizations-list" {...register("organization")} placeholder="Ex: SESI, SENAI, Bosch" className="text-xs sm:text-sm" />
              <datalist id="partner-organizations-list">
                {sponsors.map((sp) => (
                  <option key={sp.id} value={sp.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-semibold">Stakeholder / Nível (Nome) *</Label>
              <Input id="name" {...register("name")} placeholder="Ex: Diretoria, Técnicos, Professores" className="text-xs sm:text-sm" />
              {errors.name && <span className="text-[11px] text-destructive">{errors.name.message}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Grupo Institucional *</Label>
              <Select value={selectedGroup} onValueChange={(v) => setValue("group", v as StakeholderGroup)}>
                <SelectTrigger className="w-full text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(STAKEHOLDER_GROUP_LABELS) as StakeholderGroup[]).map((g) => (
                    <SelectItem key={g} value={g} className="text-xs">{STAKEHOLDER_GROUP_LABELS[g]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="roleOrJobTitle" className="text-xs font-semibold">Cargo / Detalhamento</Label>
              <Input id="roleOrJobTitle" {...register("roleOrJobTitle")} placeholder="Ex: Diretoria Regional / Corpo Docente" className="text-xs sm:text-sm" />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-foreground">Posicionamento Hierárquico (Poder × Interesse)</span>
              <Badge variant="secondary" className="text-[11px]">{tierPreview.label}</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Poder sobre o Projeto</Label>
                <Select value={selectedPower} onValueChange={(v) => setValue("power", v as StakeholderPower)}>
                  <SelectTrigger className="w-full text-xs bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STAKEHOLDER_POWER_LABELS) as StakeholderPower[]).map((p) => (
                      <SelectItem key={p} value={p} className="text-xs">{STAKEHOLDER_POWER_LABELS[p]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Nível de Interesse</Label>
                <Select value={selectedInterest} onValueChange={(v) => setValue("interest", v as StakeholderInterest)}>
                  <SelectTrigger className="w-full text-xs bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STAKEHOLDER_INTEREST_LABELS) as StakeholderInterest[]).map((i) => (
                      <SelectItem key={i} value={i} className="text-xs">{STAKEHOLDER_INTEREST_LABELS[i]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Superior no Parceiro (Opcional)</Label>
                <Select value={selectedParentId || "auto"} onValueChange={(v) => setValue("parentStakeholderId", v === "auto" ? null : v)}>
                  <SelectTrigger className="w-full text-xs bg-card"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto" className="text-xs">Automático (por Poder/Interesse)</SelectItem>
                    {samePartnerStakeholders.map((st) => (
                      <SelectItem key={st.id} value={st.id} className="text-xs">{st.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Engajamento Atual → Almejado</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedCurrent} onValueChange={(v) => setValue("currentEngagement", v as EngagementLevel)}>
                  <SelectTrigger className="w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ENGAGEMENT_LEVEL_LABELS) as EngagementLevel[]).map((l) => (
                      <SelectItem key={l} value={l} className="text-xs">{ENGAGEMENT_LEVEL_LABELS[l]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedTarget} onValueChange={(v) => setValue("targetEngagement", v as EngagementLevel)}>
                  <SelectTrigger className="w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ENGAGEMENT_LEVEL_LABELS) as EngagementLevel[]).map((l) => (
                      <SelectItem key={l} value={l} className="text-xs">{ENGAGEMENT_LEVEL_LABELS[l]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Canal & Frequência</Label>
              <div className="grid grid-cols-2 gap-2">
                <Select value={selectedChannel} onValueChange={(v) => setValue("preferredChannel", v as CommunicationChannel)}>
                  <SelectTrigger className="w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(COMMUNICATION_CHANNEL_LABELS) as CommunicationChannel[]).map((c) => (
                      <SelectItem key={c} value={c} className="text-xs">{COMMUNICATION_CHANNEL_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedFreq} onValueChange={(v) => setValue("preferredFrequency", v as CommunicationFrequency)}>
                  <SelectTrigger className="w-full text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(COMMUNICATION_FREQUENCY_LABELS) as CommunicationFrequency[]).map((f) => (
                      <SelectItem key={f} value={f} className="text-xs">{COMMUNICATION_FREQUENCY_LABELS[f]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input {...register("email")} type="email" placeholder="E-mail (opcional)" className="text-xs" />
            <Input {...register("phone")} placeholder="WhatsApp (DD) 9XXXX-XXXX (opcional)" className="text-xs" />
          </div>

          <Textarea {...register("notes")} placeholder="Estratégia / ação em andamento para este stakeholder..." rows={2} className="text-xs resize-none" />

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
              {isPending ? "Salvando no Gráfico..." : "Cadastrar no Gráfico"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
