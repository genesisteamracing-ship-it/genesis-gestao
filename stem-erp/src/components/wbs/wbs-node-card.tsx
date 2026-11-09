"use client";

import * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";
import {
  Briefcase,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  Plus,
  User,
} from "lucide-react";
import type { DeliveryGroup, WbsNodeStatus, WbsTreeNode } from "@/types/wbs";
import { WbsRowActions } from "./wbs-row-actions";
import { DISCIPLINE_LABELS, STATUS_LABELS } from "./wbs-tree-table";
import { Button } from "@/components/ui/button";

export const wbsCardStyles = tv({
  slots: {
    card: "group relative w-[250px] sm:w-[270px] rounded-xl border bg-card p-3.5 text-left shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring select-none",
    topRow: "flex items-center justify-between gap-2",
    codeBadge:
      "inline-flex items-center px-1.5 py-0.5 rounded-md font-mono text-[11px] font-bold border",
    actionRow: "flex items-center gap-1",
    title: "font-semibold text-xs text-foreground line-clamp-2 leading-snug mt-2",
    description: "text-[11px] text-muted-foreground line-clamp-2 mt-1",
    chipsRow: "mt-2.5 flex flex-wrap items-center gap-1.5",
    disciplineChip:
      "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border",
    statusChip:
      "inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium border",
    metricsRow:
      "mt-2.5 flex items-center justify-between gap-1 border-t border-border/60 pt-2 text-[10px] text-muted-foreground font-medium",
    metricItem: "inline-flex items-center gap-1",
    footerRow:
      "mt-2 flex items-center justify-between gap-1 pt-1.5 text-[10px] text-muted-foreground",
    ownerWrap: "inline-flex items-center gap-1 truncate max-w-[150px]",
    collapseBtn:
      "inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline cursor-pointer",
  },
  variants: {
    discipline: {
      ENGINEERING_CAD: {
        card: "border-primary/40 hover:border-primary",
        codeBadge: "bg-primary/10 text-primary border-primary/20",
        disciplineChip: "bg-primary/10 text-primary border-primary/20",
      },
      MANUFACTURING_CNC: {
        card: "border-warning/40 hover:border-warning",
        codeBadge: "bg-warning/10 text-warning border-warning/20",
        disciplineChip: "bg-warning/10 text-warning border-warning/20",
      },
      PIT_DISPLAY: {
        card: "border-purple/40 hover:border-purple",
        codeBadge: "bg-purple/10 text-purple border-purple/20",
        disciplineChip: "bg-purple/10 text-purple border-purple/20",
      },
      MARKETING_SPONSOR: {
        card: "border-success/40 hover:border-success",
        codeBadge: "bg-success/10 text-success border-success/20",
        disciplineChip: "bg-success/10 text-success border-success/20",
      },
      PROJECT_MANAGEMENT: {
        card: "border-primary/50 hover:border-primary",
        codeBadge: "bg-primary/15 text-primary border-primary/30",
        disciplineChip: "bg-primary/15 text-primary border-primary/30",
      },
      SOCIAL_PROJECT: {
        card: "border-purple/50 hover:border-purple",
        codeBadge: "bg-purple/15 text-purple border-purple/30",
        disciplineChip: "bg-purple/15 text-purple border-purple/30",
      },
    },
    status: {
      PLANNED: {
        statusChip: "bg-muted text-muted-foreground border-border",
      },
      IN_PROGRESS: {
        statusChip: "bg-warning/10 text-warning border-warning/20",
      },
      COMPLETED: {
        statusChip: "bg-success/10 text-success border-success/20",
      },
      AUDITED: {
        statusChip: "bg-primary/10 text-primary border-primary/20",
      },
    },
    isLeaf: {
      true: {
        card: "border-dashed",
      },
      false: {
        card: "border-solid",
      },
    },
  },
  defaultVariants: {
    discipline: "ENGINEERING_CAD",
    status: "PLANNED",
    isLeaf: false,
  },
});

export type WbsCardStyleVariants = VariantProps<typeof wbsCardStyles>;

interface WbsNodeCardProps {
  node: WbsTreeNode;
  isExpanded: boolean;
  isPresentationMode?: boolean;
  onToggleExpand: (nodeId: string) => void;
  onAddChild: (node: WbsTreeNode) => void;
  onEdit: (node: WbsTreeNode) => void;
  onDelete: (node: WbsTreeNode) => void;
}

export function WbsNodeCard({
  node,
  isExpanded,
  isPresentationMode = false,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
}: WbsNodeCardProps) {
  const styles = wbsCardStyles({
    discipline: node.discipline,
    status: node.status,
    isLeaf: node.isLeaf,
  });

  const hasChildren = node.children.length > 0;
  const hours = node.isLeaf ? node.estimatedHours : node.rolledUpHours;

  return (
    <div
      role="treeitem"
      aria-expanded={hasChildren ? isExpanded : undefined}
      className={styles.card()}
    >
      {/* Top Header: Código EAP + Ações */}
      <div className={styles.topRow()}>
        <span className={styles.codeBadge()}>{node.code}</span>

        {!isPresentationMode && (
          <div className={styles.actionRow()}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onAddChild(node);
              }}
              className="h-8 w-8 rounded-lg border-border/80 bg-card hover:bg-muted/80 text-foreground cursor-pointer"
              title="Adicionar sub-entregável"
              aria-label={`Adicionar sub-entregável sob ${node.code}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>

            <WbsRowActions
              node={node}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        )}
      </div>

      {/* Título & Descrição */}
      <p className={styles.title()} title={node.title}>
        {node.title}
      </p>
      {node.description && (
        <p className={styles.description()} title={node.description}>
          {node.description}
        </p>
      )}

      {/* Chips: Disciplina & Status */}
      <div className={styles.chipsRow()}>
        <span className={styles.disciplineChip()}>
          {DISCIPLINE_LABELS[node.discipline] || node.discipline}
        </span>
        <span className={styles.statusChip()}>
          {STATUS_LABELS[node.status] || node.status}
        </span>
      </div>

      {/* Métricas: Horas */}
      <div className={styles.metricsRow()}>
        <span className={styles.metricItem()} title={node.isLeaf ? "Horas Estimadas" : "Horas Consolidadas"}>
          <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
          <span>{hours}h</span>
        </span>
      </div>

      {/* Rodapé: Responsável & Controle de Filhos */}
      <div className={styles.footerRow()}>
        <div className={styles.ownerWrap()} title={node.ownerName ? `Responsável: ${node.ownerName}` : "Sem responsável técnico"}>
          <User className="h-3 w-3 shrink-0" />
          <span>{node.ownerName || "Não atribuído"}</span>
        </div>

        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className={styles.collapseBtn()}
            aria-label={isExpanded ? `Recolher ${node.children.length} sub-itens` : `Expandir ${node.children.length} sub-itens`}
          >
            <span>{node.children.length} {node.children.length === 1 ? "filho" : "filhos"}</span>
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
