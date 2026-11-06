"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  User,
  AlertTriangle,
  Layers,
  Sparkles,
} from "lucide-react";
import type { DeliveryGroup, WbsNodeStatus, WbsTreeNode } from "@/types/wbs";
import { formatCentsToReais } from "@/lib/utils";
import { WbsRowActions } from "./wbs-row-actions";

export const DISCIPLINE_LABELS: Record<DeliveryGroup, string> = {
  ENGINEERING_CAD: "Engenharia & CAD",
  MANUFACTURING_CNC: "Manufatura & CNC",
  PIT_DISPLAY: "Pit Display & Estande",
  MARKETING_SPONSOR: "Marketing & Patrocínio",
  PROJECT_MANAGEMENT: "Gestão do Projeto",
  SOCIAL_PROJECT: "Projeto Social",
};

export const DISCIPLINE_CLASSES: Record<DeliveryGroup, string> = {
  ENGINEERING_CAD: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  MANUFACTURING_CNC: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  PIT_DISPLAY: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  MARKETING_SPONSOR: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  PROJECT_MANAGEMENT: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  SOCIAL_PROJECT: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
};

export const STATUS_LABELS: Record<WbsNodeStatus, string> = {
  PLANNED: "Planejado",
  IN_PROGRESS: "Em Desenvolvimento",
  COMPLETED: "Concluído",
  AUDITED: "Auditado",
};

export const STATUS_CLASSES: Record<WbsNodeStatus, string> = {
  PLANNED: "bg-muted text-muted-foreground border-border",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  AUDITED: "bg-primary/10 text-primary border-primary/20",
};

interface WbsTreeTableProps {
  nodes: WbsTreeNode[];
  expandedNodeIds: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  isPresentationMode?: boolean;
  onAddChild: (parent: WbsTreeNode) => void;
  onEdit: (node: WbsTreeNode) => void;
  onDelete: (node: WbsTreeNode) => void;
}

export function WbsTreeTable({
  nodes,
  expandedNodeIds,
  onToggleExpand,
  isPresentationMode = false,
  onAddChild,
  onEdit,
  onDelete,
}: WbsTreeTableProps) {
  // Achatamento ordenado da árvore respeitando a expansão dos pais
  const flattenedRows = React.useMemo(() => {
    const result: WbsTreeNode[] = [];

    function traverse(list: WbsTreeNode[]) {
      for (const item of list) {
        result.push(item);
        if (item.children.length > 0 && expandedNodeIds.has(item.id)) {
          traverse(item.children);
        }
      }
    }

    traverse(nodes);
    return result;
  }, [nodes, expandedNodeIds]);

  if (nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 sm:p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
          <Layers className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">
          Nenhum entregável cadastrado na WBS
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-md">
          A Estrutura Analítica do Projeto ainda não possui entregáveis cadastrados para esta equipe.
          Comece adicionando o escopo raiz da temporada (ex.: 1.0 Carro STEM).
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xs">
      <div className="overflow-x-auto min-w-0">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-muted-foreground text-[11px] font-semibold uppercase tracking-wider">
              <th className="py-3 px-3 sm:px-4">Código EAP & Entregável</th>
              <th className="py-3 px-3 sm:px-4">Disciplina</th>
              <th className="py-3 px-3 sm:px-4">Responsável Técnico</th>
              <th className="py-3 px-3 sm:px-4">Status</th>
              <th className="py-3 px-3 sm:px-4 text-right">Custo Previsto</th>
              <th className="py-3 px-3 sm:px-4 text-right">Horas</th>
              {!isPresentationMode && (
                <th className="py-3 px-3 sm:px-4 text-center w-16">Ações</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {flattenedRows.map((node) => {
              const hasChildren = node.children.length > 0;
              const isExpanded = expandedNodeIds.has(node.id);
              const indentPadding = (node.depth - 1) * 20;

              return (
                <tr
                  key={node.id}
                  className={`group transition-colors hover:bg-muted/50 ${
                    node.depth === 1
                      ? "bg-muted/20 font-semibold"
                      : node.depth === 2
                      ? "bg-muted/5 font-medium"
                      : ""
                  }`}
                >
                  {/* Coluna 1: Código EAP e Título com indentação */}
                  <td className="py-2.5 px-3 sm:px-4">
                    <div
                      className="flex items-center gap-1.5 min-w-[220px]"
                      style={{ paddingLeft: `${indentPadding}px` }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={() => onToggleExpand(node.id)}
                          aria-label={isExpanded ? "Recolher nó" : "Expandir nó"}
                          className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer shrink-0 transition-transform"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      ) : (
                        <span className="w-5 shrink-0" aria-hidden="true" />
                      )}

                      <span className="font-mono text-xs font-bold text-primary shrink-0 bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                        {node.code}
                      </span>

                      <div className="min-w-0">
                        <span className="truncate text-foreground block">
                          {node.title}
                        </span>
                        {node.description && (
                          <span className="truncate text-[11px] text-muted-foreground block max-w-sm">
                            {node.description}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Coluna 2: Disciplina */}
                  <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        DISCIPLINE_CLASSES[node.discipline]
                      }`}
                    >
                      {DISCIPLINE_LABELS[node.discipline]}
                    </span>
                  </td>

                  {/* Coluna 3: Responsável Técnico */}
                  <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                    {node.ownerName ? (
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {node.ownerName}
                        </span>
                      </div>
                    ) : node.isLeaf ? (
                      <div className="flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        <span>Sem responsável</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>

                  {/* Coluna 4: Status */}
                  <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${
                        STATUS_CLASSES[node.status]
                      }`}
                    >
                      {STATUS_LABELS[node.status]}
                    </span>
                  </td>

                  {/* Coluna 5: Custo Previsto (Roll-up ou Direto) */}
                  <td className="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap font-mono">
                    <div className="flex items-center justify-end gap-1">
                      {!node.isLeaf && (
                        <span
                          title="Valor agregado pela soma de 100% dos nós filhos"
                          className="flex items-center text-[10px] uppercase font-sans font-semibold text-primary/80 bg-primary/10 px-1 rounded"
                        >
                          <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                          Roll-up
                        </span>
                      )}
                      <span className="font-semibold text-foreground">
                        {formatCentsToReais(node.rolledUpCostCents)}
                      </span>
                    </div>
                  </td>

                  {/* Coluna 6: Horas */}
                  <td className="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap font-mono text-muted-foreground">
                    {node.rolledUpHours}h
                  </td>

                  {/* Coluna 7: Menu de Ações por Engrenagem */}
                  {!isPresentationMode && (
                    <td className="py-2.5 px-3 sm:px-4 text-center whitespace-nowrap">
                      <WbsRowActions
                        node={node}
                        onAddChild={onAddChild}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
