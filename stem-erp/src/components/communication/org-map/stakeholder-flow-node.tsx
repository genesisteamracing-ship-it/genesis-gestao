"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { tv } from "tailwind-variants";
import {
  Building2,
  Clock,
  Layers,
  MoreVertical,
  Plus,
  Settings,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import {
  COMMUNICATION_FREQUENCY_LABELS,
  HIERARCHY_TIER_META,
  STAKEHOLDER_GROUP_LABELS,
} from "@/lib/communication-constants";
import type {
  StakeholderFlowNodeData,
  StakeholderPartnerNodeData,
  StakeholderTeamRootNodeData,
} from "./stakeholder-flow.adapter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const stakeholderFlowNodeStyles = tv({
  slots: {
    card: "group relative w-[240px] sm:w-[250px] rounded-xl border bg-card p-3 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none cursor-pointer",
    topRow: "flex items-start justify-between gap-1.5",
    iconBadge:
      "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs",
    titleWrap: "min-w-0 flex-1",
    title: "truncate text-xs font-bold text-foreground",
    subtitle: "truncate text-[11px] text-muted-foreground",
    chipsRow: "mt-2 flex flex-wrap items-center gap-1",
    tierChip:
      "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border",
    planChip:
      "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-muted text-muted-foreground border border-border",
    metaFooter:
      "mt-2.5 flex items-center justify-between gap-1 border-t border-border/60 pt-2 text-[10px] text-muted-foreground",
    handle:
      "!h-2.5 !w-2.5 !rounded-full !border-2 !border-background !bg-border transition-colors hover:!bg-primary",
    hoverAddBottom:
      "absolute -bottom-3 left-1/2 -translate-x-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground shadow-md transition-transform duration-150 hover:scale-110 opacity-0 group-hover:opacity-100 cursor-pointer z-10",
    hoverAddSide:
      "absolute -right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground shadow-md transition-transform duration-150 hover:scale-110 opacity-0 group-hover:opacity-100 cursor-pointer z-10",
  },
  variants: {
    tone: {
      strategic: {
        card: "border-purple/40 hover:border-purple",
        iconBadge: "border-purple/30 bg-purple/15 text-purple",
        tierChip: "border-purple/30 bg-purple/10 text-purple",
      },
      institutional: {
        card: "border-primary/40 hover:border-primary",
        iconBadge: "border-primary/30 bg-primary/15 text-primary",
        tierChip: "border-primary/30 bg-primary/10 text-primary",
      },
      tactical: {
        card: "border-success/40 hover:border-success",
        iconBadge: "border-success/30 bg-success/15 text-success",
        tierChip: "border-success/30 bg-success/10 text-success",
      },
      operational: {
        card: "border-warning/40 hover:border-warning",
        iconBadge: "border-warning/30 bg-warning/15 text-warning",
        tierChip: "border-warning/30 bg-warning/10 text-warning",
      },
    },
  },
  defaultVariants: {
    tone: "institutional",
  },
});

export function StakeholderFlowNodeComponent({ data }: NodeProps) {
  const nodeData = data as unknown as StakeholderFlowNodeData;
  const { node, onSelectNode, onAddSubordinate, onAddLateral } = nodeData;
  const { stakeholder } = node;

  const tierMeta = HIERARCHY_TIER_META[node.tier];
  const toneMap: Record<string, "strategic" | "institutional" | "tactical" | "operational"> = {
    TIER_1_STRATEGIC: "strategic",
    TIER_2_INSTITUTIONAL: "institutional",
    TIER_3_TACTICAL: "tactical",
    TIER_4_OPERATIONAL: "operational",
  };
  const tone = toneMap[node.tier] || "institutional";
  const styles = stakeholderFlowNodeStyles({ tone });

  return (
    <div
      onClick={() => onSelectNode(node)}
      className={styles.card()}
      role="treeitem"
      aria-selected={false}
    >
      <Handle
        type="target"
        position={Position.Top}
        className={styles.handle()}
        aria-hidden="true"
      />

      {/* Top Row: Ícone + Título + Menu de Engrenagem */}
      <div className={styles.topRow()}>
        <div className={styles.iconBadge()}>
          <User className="h-3.5 w-3.5" />
        </div>
        <div className={styles.titleWrap()}>
          <p className={styles.title()} title={stakeholder.name}>
            {stakeholder.name}
          </p>
          <p className={styles.subtitle()} title={stakeholder.roleOrJobTitle || stakeholder.organization || "Stakeholder"}>
            {stakeholder.roleOrJobTitle || stakeholder.organization || "Stakeholder"}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={(e) => e.stopPropagation()}
              className="h-6 w-6 rounded-md border-border/80 bg-card hover:bg-muted text-foreground cursor-pointer"
              aria-label={`Ações para ${stakeholder.name}`}
            >
              <Settings className="h-3 w-3 transition-transform duration-200 hover:rotate-45" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onSelectNode(node);
              }}
              className="cursor-pointer gap-2 text-xs"
            >
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Inspecionar Ficha</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onAddSubordinate(node);
              }}
              className="cursor-pointer gap-2 text-xs text-primary font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Adicionar Subordinado</span>
            </DropdownMenuItem>
            {onAddLateral && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onAddLateral(node);
                }}
                className="cursor-pointer gap-2 text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Adicionar no Mesmo Nível</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Chips: Nível e Planos */}
      <div className={styles.chipsRow()}>
        <span className={styles.tierChip()}>
          {tierMeta.shortLabel} • {tierMeta.badgeLabel}
        </span>
        {stakeholder.plans && stakeholder.plans.length > 0 && (
          <span className={styles.planChip()}>
            {stakeholder.plans.length} {stakeholder.plans.length === 1 ? "plano" : "planos"}
          </span>
        )}
      </div>

      {/* Rodapé: Frequência e Organização */}
      <div className={styles.metaFooter()}>
        <span className="truncate max-w-[130px]">
          {stakeholder.organization || "Individual"}
        </span>
        <span className="inline-flex items-center gap-1 font-medium">
          <Clock className="h-3 w-3" />
          {COMMUNICATION_FREQUENCY_LABELS[stakeholder.preferredFrequency] || "Mensal"}
        </span>
      </div>

      {/* Botão Hover Inferior: Adicionar Subordinado (Abaixo) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAddSubordinate(node);
        }}
        className={styles.hoverAddBottom()}
        title="Adicionar Subordinado (Abaixo)"
        aria-label={`Adicionar subordinado sob ${stakeholder.name}`}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      {/* Botão Hover Lateral: Adicionar Mesmo Nível (Ao Lado) */}
      {onAddLateral && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddLateral(node);
          }}
          className={styles.hoverAddSide()}
          title="Adicionar no Mesmo Nível (Ao Lado)"
          aria-label={`Adicionar stakeholder no mesmo nível de ${stakeholder.name}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className={styles.handle()}
        aria-hidden="true"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={styles.handle()}
        aria-hidden="true"
      />
    </div>
  );
}

export function StakeholderTeamRootNodeComponent({ data }: NodeProps) {
  const rootData = data as unknown as StakeholderTeamRootNodeData;

  return (
    <div className="w-[260px] rounded-xl border-2 border-primary/60 bg-primary/10 p-3.5 text-center shadow-xs select-none">
      <div className="flex items-center justify-center gap-1.5 text-primary text-xs font-bold tracking-wide uppercase">
        <Sparkles className="h-3.5 w-3.5" />
        <span>{rootData.teamName}</span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1">
        Mapa Global de Parceiros & Hierarquia
      </p>
      <div className="mt-2.5 flex items-center justify-center gap-2 border-t border-primary/20 pt-2 text-[10px] font-semibold text-foreground">
        <span>{rootData.totalPartners} parceiros</span>
        <span>•</span>
        <span>{rootData.totalStakeholders} stakeholders</span>
        <span>•</span>
        <span>{rootData.totalPlans} planos</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-background !bg-primary"
        aria-hidden="true"
      />
    </div>
  );
}

export function StakeholderPartnerNodeComponent({ data }: NodeProps) {
  const partnerData = data as unknown as StakeholderPartnerNodeData;
  const { branch, onAddStakeholder } = partnerData;

  return (
    <div className="group relative w-[240px] rounded-xl border border-primary/50 bg-card p-3 text-left shadow-2xs hover:border-primary transition-all select-none">
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-background !bg-border hover:!bg-primary"
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-1.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/15 text-primary">
          <Building2 className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold text-foreground" title={branch.partnerName}>
            {branch.partnerName}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {branch.sponsorTier
              ? `Patrocinador ${branch.sponsorTier}`
              : STAKEHOLDER_GROUP_LABELS[branch.primaryGroup] || "Parceiro"}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onAddStakeholder(branch.partnerName, branch.sponsorId)}
          className="h-6 w-6 rounded-md border-border bg-secondary/80 text-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer"
          title={`Adicionar stakeholder em ${branch.partnerName}`}
          aria-label={`Adicionar stakeholder em ${branch.partnerName}`}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2 text-[10px] text-muted-foreground">
        <span>{branch.totalStakeholders} pessoas</span>
        <span>{branch.totalActivePlans} planos</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2.5 !w-2.5 !rounded-full !border-2 !border-background !bg-border hover:!bg-primary"
        aria-hidden="true"
      />
    </div>
  );
}
