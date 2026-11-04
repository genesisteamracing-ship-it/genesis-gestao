"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  updateStakeholderSchema,
  type UpdateStakeholderInput,
} from "@/lib/validations/communication";
import { updateStakeholderAction } from "@/actions/communication-actions";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_FREQUENCY_LABELS,
  ENGAGEMENT_LEVEL_LABELS,
  STAKEHOLDER_GROUP_LABELS,
  STAKEHOLDER_INTEREST_LABELS,
  STAKEHOLDER_POWER_LABELS,
} from "@/lib/communication-constants";
import { computeHierarchyTier } from "@/lib/communication-hierarchy";
import type {
  CommunicationChannel,
  CommunicationFrequency,
  EngagementLevel,
  StakeholderGroup,
  StakeholderInterest,
  StakeholderPower,
  StakeholderWithRelations,
} from "@/types/communication";

interface EditStakeholderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeholder: StakeholderWithRelations | null;
  sponsors?: Array<{ id: string; name: string }>;
  existingStakeholders?: StakeholderWithRelations[];
}

export function EditStakeholderDialog({
  open,
  onOpenChange,
  stakeholder,
  sponsors = [],
  existingStakeholders = [],
}: EditStakeholderDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<UpdateStakeholderInput>({
    resolver: zodResolver(updateStakeholderSchema),
    defaultValues: {
      id: "",
      name: "",
      organization: "",
      roleOrJobTitle: "",
      group: "SPONSORS",
      sponsorId: null,
      parentStakeholderId: null,
      power: "HIGH",
      interest: "HIGH",
      currentEngagement: "NEUTRAL",
      targetEngagement: "NEUTRAL",
      preferredChannel: "WHATSAPP",
      preferredFrequency: "MONTHLY",
      email: "",
      phone: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (stakeholder && open) {
      reset({
        id: stakeholder.id,
        name: stakeholder.name,
        organization: stakeholder.organization || "",
        roleOrJobTitle: stakeholder.roleOrJobTitle || "",
        group: stakeholder.group,
        sponsorId: stakeholder.sponsorId || null,
        parentStakeholderId: stakeholder.parentStakeholderId || null,
        power: stakeholder.power,
        interest: stakeholder.interest,
        currentEngagement: stakeholder.currentEngagement,
        targetEngagement: stakeholder.targetEngagement,
        preferredChannel: stakeholder.preferredChannel,
        preferredFrequency: stakeholder.preferredFrequency,
        email: stakeholder.email || "",
        phone: stakeholder.phone || "",
        notes: stakeholder.notes || "",
      });
    }
  }, [stakeholder, open, reset]);

  const selectedGroup = watch("group");
  const selectedPower = watch("power") || "HIGH";
  const selectedInterest = watch("interest") || "HIGH";
  const selectedCurrent = watch("currentEngagement") || "NEUTRAL";
  const selectedChannel = watch("preferredChannel") || "WHATSAPP";
  const selectedFreq = watch("preferredFrequency") || "MONTHLY";
  const selectedParentId = watch("parentStakeholderId");
  const currentOrg = watch("organization");

  const tierPreview = computeHierarchyTier(selectedPower, selectedInterest);

  // Lista de superiores possíveis da mesma organização (excluindo a si mesmo)
  const potentialParents = existingStakeholders.filter((s) => {
    if (stakeholder && s.id === stakeholder.id) return false;
    if (!currentOrg?.trim()) return true;
    return (
      (s.organization || s.sponsor?.name || "").toLowerCase() ===
      currentOrg.trim().toLowerCase()
    );
  });

  const onSubmit = async (values: UpdateStakeholderInput) => {
    if (!stakeholder) return;

    setIsPending(true);
    try {
      const payload: UpdateStakeholderInput = {
        ...values,
        id: stakeholder.id,
        targetEngagement: values.currentEngagement,
        organization: values.organization?.trim() || null,
        roleOrJobTitle: values.roleOrJobTitle?.trim() || null,
        email: values.email?.trim() || null,
        phone: values.phone?.trim() || null,
        notes: values.notes?.trim() || null,
      };

      const res = await updateStakeholderAction(payload);
      if (!res.success) {
        toast.error(res.message || "Erro ao atualizar stakeholder.");
        return;
      }

      toast.success(res.message);
      onOpenChange(false);
    } catch {
      toast.error("Ocorreu um erro inesperado ao salvar alterações.");
    } finally {
      setIsPending(false);
    }
  };

  if (!stakeholder) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto sm:max-w-2xl p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            <span>Editar Stakeholder</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Atualize as informações cadastrais, contato, posicionamento de poder/interesse e canal de comunicação.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5 py-1">
          {/* Linha 1: Organização e Nome do Stakeholder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-organization" className="text-xs font-semibold">
                Organização
              </Label>
              <Input
                id="edit-organization"
                list="edit-partner-organizations-list"
                {...register("organization")}
                placeholder="Ex: SESI, SENAI, Bosch"
                className="text-xs sm:text-sm"
              />
              <datalist id="edit-partner-organizations-list">
                {sponsors.map((sp) => (
                  <option key={sp.id} value={sp.name} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-name" className="text-xs font-semibold">
                Nome do Stakeholder *
              </Label>
              <Input
                id="edit-name"
                {...register("name")}
                placeholder="Ex: Diretoria, Técnicos, Professores"
                className="text-xs sm:text-sm"
              />
              {errors.name && (
                <span className="text-[11px] text-destructive">{errors.name.message}</span>
              )}
            </div>
          </div>

          {/* Linha 2: Grupo Institucional e Cargo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Grupo Institucional *</Label>
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
              <Label htmlFor="edit-roleOrJobTitle" className="text-xs font-semibold">
                Cargo / Função
              </Label>
              <Input
                id="edit-roleOrJobTitle"
                {...register("roleOrJobTitle")}
                placeholder="Ex: Diretor Pedagógico, Engenheiro, Coordenador"
                className="text-xs sm:text-sm"
              />
            </div>
          </div>

          {/* Linha 3: Posicionamento Hierárquico (Poder × Interesse) */}
          <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-foreground">
                Posicionamento Hierárquico (Poder × Interesse)
              </span>
              <Badge variant="secondary" className="text-[11px]">
                {tierPreview.label}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Poder sobre o Projeto</Label>
                <Select
                  value={selectedPower}
                  onValueChange={(v) => setValue("power", v as StakeholderPower)}
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
                <Label className="text-xs font-semibold">Nível de Interesse</Label>
                <Select
                  value={selectedInterest}
                  onValueChange={(v) => setValue("interest", v as StakeholderInterest)}
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
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Superior na Organização (Opcional)</Label>
                <Select
                  value={selectedParentId || "auto"}
                  onValueChange={(v) =>
                    setValue("parentStakeholderId", v === "auto" ? null : v)
                  }
                >
                  <SelectTrigger className="w-full text-xs bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto" className="text-xs">
                      Automático (por Poder/Interesse)
                    </SelectItem>
                    {potentialParents.map((st) => (
                      <SelectItem key={st.id} value={st.id} className="text-xs">
                        {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Linha 4: Engajamento Atual, Canal e Frequência */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nível de Engajamento</Label>
              <Select
                value={selectedCurrent}
                onValueChange={(v) => {
                  setValue("currentEngagement", v as EngagementLevel);
                  setValue("targetEngagement", v as EngagementLevel);
                }}
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ENGAGEMENT_LEVEL_LABELS) as EngagementLevel[]).map((l) => (
                    <SelectItem key={l} value={l} className="text-xs">
                      {ENGAGEMENT_LEVEL_LABELS[l]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Canal Preferencial</Label>
              <Select
                value={selectedChannel}
                onValueChange={(v) => setValue("preferredChannel", v as CommunicationChannel)}
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
              <Label className="text-xs font-semibold">Frequência Preferencial</Label>
              <Select
                value={selectedFreq}
                onValueChange={(v) =>
                  setValue("preferredFrequency", v as CommunicationFrequency)
                }
              >
                <SelectTrigger className="w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(COMMUNICATION_FREQUENCY_LABELS) as CommunicationFrequency[]).map(
                    (f) => (
                      <SelectItem key={f} value={f} className="text-xs">
                        {COMMUNICATION_FREQUENCY_LABELS[f]}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Linha 5: Contatos (E-mail e WhatsApp) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="edit-email" className="text-xs font-semibold text-muted-foreground">
                E-mail
              </Label>
              <Input
                id="edit-email"
                {...register("email")}
                type="email"
                placeholder="contato@organizacao.com"
                className="text-xs"
              />
              {errors.email && (
                <span className="text-[11px] text-destructive">{errors.email.message}</span>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-phone" className="text-xs font-semibold text-muted-foreground">
                WhatsApp
              </Label>
              <Input
                id="edit-phone"
                {...register("phone")}
                placeholder="(DD) 9XXXX-XXXX"
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="w-full sm:w-auto font-semibold">
              {isPending ? "Salvando Alterações..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
