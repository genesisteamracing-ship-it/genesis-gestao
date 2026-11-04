"use client";

import { tv, type VariantProps } from "tailwind-variants";
import { Building2, Clock, FolderGit2, Layers, Plus, Sparkles, Users } from "lucide-react";
import {
  COMMUNICATION_FREQUENCY_LABELS,
  ENGAGEMENT_LEVEL_LABELS,
  HIERARCHY_TIER_META,
  STAKEHOLDER_GROUP_LABELS,
} from "@/lib/communication-constants";
import type { OrgMapViewMode } from "@/hooks/use-stakeholder-org-map";
import type { OrgMapPartnerBranch, OrgMapStakeholderNode } from "@/types/communication";

const orgNodeStyles = tv({
  slots: {
    card: "group relative w-[220px] sm:w-[236px] rounded-xl border bg-card/95 p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    topRow: "flex items-start justify-between gap-2",
    iconBadge: "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs",
    titleWrap: "min-w-0 flex-1",
    title: "truncate text-xs sm:text-[13px] font-bold text-foreground",
    subtitle: "truncate text-[11px] text-muted-foreground",
    statusDot: "h-2 w-2 shrink-0 rounded-full mt-1",
    metaFooter: "mt-2.5 flex items-center justify-between gap-1.5 border-t border-border/60 pt-2 text-[10px] text-muted-foreground",
    quickAddBtn: "inline-flex h-5 w-5 items-center justify-center rounded-md border border-border bg-secondary/80 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary",
  },
  variants: {
    tone: {
      root: { card: "border-primary/60 bg-primary/10", iconBadge: "border-primary/40 bg-primary/20 text-primary", statusDot: "bg-primary" },
      partner: { card: "border-primary/50 bg-card hover:border-primary", iconBadge: "border-primary/30 bg-primary/15 text-primary", statusDot: "bg-primary" },
      purple: { card: "border-purple/50 bg-purple/5 hover:border-purple", iconBadge: "border-purple/30 bg-purple/15 text-purple", statusDot: "bg-purple" },
      primary: { card: "border-primary/50 bg-primary/5 hover:border-primary", iconBadge: "border-primary/30 bg-primary/15 text-primary", statusDot: "bg-primary" },
      success: { card: "border-success/50 bg-success/5 hover:border-success", iconBadge: "border-success/30 bg-success/15 text-success", statusDot: "bg-success" },
      amber: { card: "border-warning/50 bg-warning/5 hover:border-warning", iconBadge: "border-warning/30 bg-warning/15 text-warning", statusDot: "bg-warning" },
    },
  },
  defaultVariants: { tone: "primary" },
});

export type OrgNodeStyleVariants = VariantProps<typeof orgNodeStyles>;

export function RootTeamNodeCard({
  teamName,
  totalPartners,
  totalStakeholders,
  totalPlans,
}: {
  teamName: string;
  totalPartners: number;
  totalStakeholders: number;
  totalPlans: number;
}) {
  const styles = orgNodeStyles({ tone: "root" });
  return (
    <div className={styles.card()} role="treeitem" aria-selected={false}>
      <div className={styles.topRow()}>
        <div className={styles.iconBadge()}><Sparkles className="h-3.5 w-3.5" /></div>
        <div className={styles.titleWrap()}>
          <p className={styles.title()}>{teamName}</p>
          <p className={styles.subtitle()}>Mapa Global de Parceiros</p>
        </div>
        <span className={styles.statusDot()} aria-hidden="true" />
      </div>
      <div className={styles.metaFooter()}>
        <span>{totalPartners} parceiros</span>
        <span>•</span>
        <span>{totalStakeholders} stakeholders</span>
        <span>•</span>
        <span>{totalPlans} planos</span>
      </div>
    </div>
  );
}

export function PartnerNodeCard({
  branch,
  onAddStakeholder,
}: {
  branch: OrgMapPartnerBranch;
  onAddStakeholder: (partnerName: string, sponsorId: string | null) => void;
}) {
  const styles = orgNodeStyles({ tone: "partner" });
  return (
    <div className={styles.card()} role="treeitem" aria-selected={false}>
      <div className={styles.topRow()}>
        <div className={styles.iconBadge()}><Building2 className="h-3.5 w-3.5" /></div>
        <div className={styles.titleWrap()}>
          <p className={styles.title()}>{branch.partnerName}</p>
          <p className={styles.subtitle()}>
            {branch.sponsorTier ? `Patrocinador ${branch.sponsorTier}` : STAKEHOLDER_GROUP_LABELS[branch.primaryGroup]}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAddStakeholder(branch.partnerName, branch.sponsorId)}
          className={styles.quickAddBtn()}
          aria-label={`Adicionar stakeholder em ${branch.partnerName}`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className={styles.metaFooter()}>
        <span>{branch.totalStakeholders} contatos</span>
        <span>•</span>
        <span>{branch.highPowerCount} alto poder</span>
        <span>•</span>
        <span>{branch.totalActivePlans} réguas</span>
      </div>

      {/* Botão Hover de Adicionar Abaixo */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAddStakeholder(branch.partnerName, branch.sponsorId);
        }}
        className={`${styles.quickAddBtn()} absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow-xs`}
        title={`Adicionar stakeholder em ${branch.partnerName}`}
        aria-label={`Adicionar stakeholder em ${branch.partnerName}`}
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

export function StakeholderNodeCard({
  node,
  viewMode,
  onSelect,
  onAddSubordinate,
  onAddLateral,
}: {
  node: OrgMapStakeholderNode;
  viewMode: OrgMapViewMode;
  onSelect: (node: OrgMapStakeholderNode) => void;
  onAddSubordinate: (node: OrgMapStakeholderNode) => void;
  onAddLateral?: (node: OrgMapStakeholderNode) => void;
}) {
  const tierMeta = HIERARCHY_TIER_META[node.tier];
  const styles = orgNodeStyles({ tone: tierMeta.tone });
  const { stakeholder } = node;

  return (
    <div
      role="treeitem"
      aria-selected={false}
      tabIndex={0}
      onClick={() => onSelect(node)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect(node))}
      className={`${styles.card()} cursor-pointer`}
    >
      <div className={styles.topRow()}>
        <div className={styles.iconBadge()}>
          {node.rankWeight >= 3 ? <FolderGit2 className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
        </div>
        <div className={styles.titleWrap()}>
          <p className={styles.title()}>{stakeholder.name}</p>
          <p className={styles.subtitle()}>{stakeholder.roleOrJobTitle || tierMeta.shortLabel}</p>
        </div>
        <button
          type="button"
          onClick={(e) => (e.stopPropagation(), onAddSubordinate(node))}
          className={styles.quickAddBtn()}
          aria-label={`Adicionar subordinado abaixo de ${stakeholder.name}`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      <div className={styles.metaFooter()}>
        {viewMode === "hierarchy" && (
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-foreground/90">Poder {stakeholder.power === "HIGH" ? "Alto" : "Baixo"}</span>
            <span>•</span>
            <span>Interesse {stakeholder.interest === "HIGH" ? "Alto" : "Baixo"}</span>
          </div>
        )}
        {viewMode === "structure" && (
          <span className="truncate flex items-center gap-1">
            <Layers className="h-3 w-3 shrink-0" />
            {STAKEHOLDER_GROUP_LABELS[stakeholder.group]}
          </span>
        )}
        {viewMode === "relations" && (
          <div className="flex items-center gap-1 truncate">
            <span>{ENGAGEMENT_LEVEL_LABELS[stakeholder.currentEngagement]}</span>
            <span>→</span>
            <span className="font-semibold text-foreground">{ENGAGEMENT_LEVEL_LABELS[stakeholder.targetEngagement]}</span>
          </div>
        )}

        <span
          className="inline-flex items-center gap-1 shrink-0 rounded-md border border-border/80 bg-secondary/80 px-1.5 py-0.5 text-[9.5px] font-medium text-foreground"
          title={`Periodicidade: ${COMMUNICATION_FREQUENCY_LABELS[stakeholder.preferredFrequency]}`}
        >
          <Clock className="h-2.5 w-2.5 text-primary" />
          <span>{COMMUNICATION_FREQUENCY_LABELS[stakeholder.preferredFrequency]}</span>
        </span>
      </div>

      {/* Botão Hover de Adicionar Abaixo */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onAddSubordinate(node);
        }}
        className={`${styles.quickAddBtn()} absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow-xs`}
        title={`Adicionar subordinado abaixo de ${stakeholder.name}`}
        aria-label={`Adicionar subordinado abaixo de ${stakeholder.name}`}
      >
        <Plus className="h-3 w-3" />
      </button>

      {/* Botão Hover de Adicionar na Lateral Direita */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          (onAddLateral ?? onAddSubordinate)(node);
        }}
        className={`${styles.quickAddBtn()} absolute -right-2.5 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow-xs`}
        title={`Adicionar contato na lateral de ${stakeholder.name}`}
        aria-label={`Adicionar contato na lateral de ${stakeholder.name}`}
      >
        <Plus className="h-3 w-3" />
      </button>

      {/* Botão Hover de Adicionar na Lateral Esquerda */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          (onAddLateral ?? onAddSubordinate)(node);
        }}
        className={`${styles.quickAddBtn()} absolute -left-2.5 top-1/2 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-card shadow-xs`}
        title={`Adicionar contato na lateral de ${stakeholder.name}`}
        aria-label={`Adicionar contato na lateral de ${stakeholder.name}`}
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
