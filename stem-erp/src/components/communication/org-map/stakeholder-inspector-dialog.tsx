"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, CalendarPlus, FileText, Mail, MessageSquarePlus, Phone, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_FREQUENCY_LABELS,
  ENGAGEMENT_LEVEL_LABELS,
  HIERARCHY_TIER_META,
  STAKEHOLDER_GROUP_LABELS,
  STAKEHOLDER_INTEREST_LABELS,
  STAKEHOLDER_POWER_LABELS,
} from "@/lib/communication-constants";
import { computeHierarchyTier } from "@/lib/communication-hierarchy";
import { deleteStakeholderAction, updateStakeholderAction } from "@/actions/communication-actions";
import type { StakeholderInterest, StakeholderPower, StakeholderWithRelations } from "@/types/communication";

interface StakeholderInspectorDialogProps {
  stakeholder: StakeholderWithRelations | null;
  onOpenChange: (open: boolean) => void;
  onGenerateReport: (stakeholderId: string) => void;
  onCreatePlan: (stakeholderId: string) => void;
  onAddSubordinate: (stakeholder: StakeholderWithRelations) => void;
  onLogCommunication: (stakeholder: StakeholderWithRelations) => void;
}

export function StakeholderInspectorDialog({
  stakeholder,
  onOpenChange,
  onGenerateReport,
  onCreatePlan,
  onAddSubordinate,
  onLogCommunication,
}: StakeholderInspectorDialogProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  if (!stakeholder) return null;

  const { tier } = computeHierarchyTier(stakeholder.power, stakeholder.interest);
  const tierMeta = HIERARCHY_TIER_META[tier];

  const handleQuickTierUpdate = async (power: StakeholderPower, interest: StakeholderInterest) => {
    setIsUpdating(true);
    try {
      const res = await updateStakeholderAction({ id: stakeholder.id, power, interest });
      if (!res.success) return void toast.error(res.message);
      toast.success("Posição hierárquica atualizada no gráfico!");
      onOpenChange(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    try {
      const res = await deleteStakeholderAction(stakeholder.id);
      if (!res.success) return void toast.error(res.message);
      toast.success(res.message);
      onOpenChange(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={Boolean(stakeholder)} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto sm:max-w-lg p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-[11px]">
              {stakeholder.organization || STAKEHOLDER_GROUP_LABELS[stakeholder.group]}
            </Badge>
            <Badge variant="outline" className="text-[11px]">{tierMeta.shortLabel}</Badge>
          </div>
          <DialogTitle className="text-base sm:text-lg mt-1">{stakeholder.name}</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {stakeholder.roleOrJobTitle || STAKEHOLDER_GROUP_LABELS[stakeholder.group]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3.5 py-2 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 rounded-xl border border-border bg-muted/40 p-3">
            <div>
              <span className="font-semibold text-foreground block mb-1">Poder sobre o Projeto</span>
              <Select defaultValue={stakeholder.power} disabled={isUpdating} onValueChange={(v) => handleQuickTierUpdate(v as StakeholderPower, stakeholder.interest)}>
                <SelectTrigger className="h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH" className="text-xs">{STAKEHOLDER_POWER_LABELS.HIGH}</SelectItem>
                  <SelectItem value="LOW" className="text-xs">{STAKEHOLDER_POWER_LABELS.LOW}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <span className="font-semibold text-foreground block mb-1">Nível de Interesse</span>
              <Select defaultValue={stakeholder.interest} disabled={isUpdating} onValueChange={(v) => handleQuickTierUpdate(stakeholder.power, v as StakeholderInterest)}>
                <SelectTrigger className="h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH" className="text-xs">{STAKEHOLDER_INTEREST_LABELS.HIGH}</SelectItem>
                  <SelectItem value="LOW" className="text-xs">{STAKEHOLDER_INTEREST_LABELS.LOW}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground">Engajamento:</span>
              <Badge variant="outline">{ENGAGEMENT_LEVEL_LABELS[stakeholder.currentEngagement]}</Badge>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <Badge>{ENGAGEMENT_LEVEL_LABELS[stakeholder.targetEngagement]}</Badge>
            </div>
            <span className="text-muted-foreground">
              {COMMUNICATION_CHANNEL_LABELS[stakeholder.preferredChannel]} • {COMMUNICATION_FREQUENCY_LABELS[stakeholder.preferredFrequency]}
            </span>
          </div>

          {(stakeholder.phone || stakeholder.email) && (
            <div className="flex flex-wrap gap-3 text-muted-foreground">
              {stakeholder.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-primary" />{stakeholder.phone}</span>}
              {stakeholder.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-primary" />{stakeholder.email}</span>}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <Button type="button" size="sm" onClick={() => (onOpenChange(false), onAddSubordinate(stakeholder))} className="gap-1.5 text-xs"><Plus className="h-3.5 w-3.5" />Adicionar Subordinado</Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => (onOpenChange(false), onGenerateReport(stakeholder.id))} className="gap-1.5 text-xs"><FileText className="h-3.5 w-3.5" />Gerar Relatório</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => (onOpenChange(false), onCreatePlan(stakeholder.id))} className="gap-1.5 text-xs"><CalendarPlus className="h-3.5 w-3.5" />Nova Régua / Plano</Button>
            <Button type="button" variant="outline" size="sm" onClick={() => (onOpenChange(false), onLogCommunication(stakeholder))} className="gap-1.5 text-xs"><MessageSquarePlus className="h-3.5 w-3.5" />Registrar Interação</Button>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-2">
          <Button type="button" variant="ghost" size="sm" disabled={isUpdating} onClick={handleDelete} className="text-destructive hover:text-destructive gap-1 text-xs"><Trash2 className="h-3.5 w-3.5" />Remover Stakeholder</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
