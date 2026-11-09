"use client";

import * as React from "react";
import { tv } from "tailwind-variants";
import {
  FolderGit2,
  Maximize2,
  Plus,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCanvasPanZoom } from "@/hooks/use-canvas-pan-zoom";
import type { WbsTreeNode } from "@/types/wbs";
import { WbsNodeCard } from "./wbs-node-card";

export const canvasStyles = tv({
  slots: {
    shell:
      "relative overflow-hidden rounded-2xl border border-border bg-card shadow-xs",
    toolbar:
      "flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur-xs",
    toolbarLeft: "flex items-center gap-3 text-xs text-muted-foreground",
    toolbarRight: "flex items-center gap-1.5",
    zoomBtn:
      "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted cursor-pointer disabled:opacity-40",
    zoomBadge:
      "inline-flex h-8 items-center justify-center px-2.5 rounded-lg border border-border bg-muted/40 font-mono text-xs font-semibold text-foreground select-none",
    canvasViewport:
      "relative min-h-[640px] w-full overflow-hidden bg-background bg-[radial-gradient(var(--border)_1.2px,transparent_1.2px)] [background-size:24px_24px] p-6 sm:p-10 touch-none select-none",
    treeCanvas:
      "mx-auto flex min-w-max flex-col items-center origin-top select-none will-change-transform",
    rootProjectCard:
      "w-[260px] sm:w-[280px] rounded-xl border-2 border-primary/60 bg-primary/10 p-4 text-center shadow-xs select-none",
    vLine: "h-6 w-px bg-border",
    hBar: "h-px bg-border",
    branchCol: "flex flex-col items-center",
    branchesRow: "flex items-start justify-center gap-6 sm:gap-8 pt-0",
    emptyState:
      "flex flex-col items-center justify-center py-20 text-center gap-3",
  },
});

interface RecursiveWbsSubtreeProps {
  node: WbsTreeNode;
  expandedNodeIds: Set<string>;
  isPresentationMode?: boolean;
  onToggleExpand: (nodeId: string) => void;
  onAddChild: (node: WbsTreeNode) => void;
  onEdit: (node: WbsTreeNode) => void;
  onDelete: (node: WbsTreeNode) => void;
}

function RecursiveWbsSubtree({
  node,
  expandedNodeIds,
  isPresentationMode = false,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
}: RecursiveWbsSubtreeProps) {
  const styles = canvasStyles();
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedNodeIds.has(node.id);

  return (
    <div className={styles.branchCol()}>
      <WbsNodeCard
        node={node}
        isExpanded={isExpanded}
        isPresentationMode={isPresentationMode}
        onToggleExpand={onToggleExpand}
        onAddChild={onAddChild}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {hasChildren && isExpanded && (
        <>
          <div className={styles.vLine()} aria-hidden="true" />

          {node.children.length > 1 && (
            <div className="w-full px-16">
              <div className={styles.hBar()} />
            </div>
          )}

          <div className={styles.branchesRow()}>
            {node.children.map((child) => (
              <div key={child.id} className={styles.branchCol()}>
                {node.children.length > 1 && (
                  <div className="h-4 w-px bg-border" aria-hidden="true" />
                )}
                <RecursiveWbsSubtree
                  node={child}
                  expandedNodeIds={expandedNodeIds}
                  isPresentationMode={isPresentationMode}
                  onToggleExpand={onToggleExpand}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface WbsCanvasViewProps {
  nodes: WbsTreeNode[];
  expandedNodeIds: Set<string>;
  isPresentationMode?: boolean;
  onToggleExpand: (nodeId: string) => void;
  onAddChild: (node: WbsTreeNode) => void;
  onEdit: (node: WbsTreeNode) => void;
  onDelete: (node: WbsTreeNode) => void;
  onOpenCreateRoot: () => void;
}

export function WbsCanvasView({
  nodes,
  expandedNodeIds,
  isPresentationMode = false,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
  onOpenCreateRoot,
}: WbsCanvasViewProps) {
  const styles = canvasStyles();
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const {
    zoom,
    pan,
    isDragging,
    viewportRef: activeViewportRef,
    canvasHandlers,
    zoomIn,
    zoomOut,
    reset,
  } = useCanvasPanZoom(viewportRef, 1);

  // Horas consolidadas de todas as raízes para o Nó Mestre do Projeto
  const totalProjectHours = React.useMemo(() => {
    return nodes.reduce(
      (acc, node) =>
        acc + (node.isLeaf ? node.estimatedHours : node.rolledUpHours),
      0
    );
  }, [nodes]);

  return (
    <section
      className={styles.shell()}
      aria-label="Mapa em Árvore Hierárquica da WBS"
    >
      {/* Barra de Controles Superiores do Canvas */}
      <div className={styles.toolbar()}>
        <div className={styles.toolbarLeft()}>
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-primary" />
            <span>Árvore do Escopo (EAP)</span>
          </span>
          <span>•</span>
          <span>
            {nodes.length} {nodes.length === 1 ? "entregável raiz" : "entregáveis raiz"}
          </span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">
            Arraste para mover, use a roda do mouse para zoom
          </span>
        </div>

        <div className={styles.toolbarRight()}>
          <button
            type="button"
            onClick={zoomOut}
            className={styles.zoomBtn()}
            aria-label="Diminuir Zoom"
            title="Diminuir Zoom (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>

          <span className={styles.zoomBadge()} title="Nível de Zoom">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={zoomIn}
            className={styles.zoomBtn()}
            aria-label="Aumentar Zoom"
            title="Aumentar Zoom (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={reset}
            className={styles.zoomBtn()}
            aria-label="Resetar Vista e Zoom"
            title="Redefinir visualização (100%)"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Viewport Interativo do Canvas */}
      <div
        ref={activeViewportRef}
        {...canvasHandlers}
        className={`${styles.canvasViewport()} ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {nodes.length === 0 ? (
          <div className={styles.emptyState()}>
            <FolderGit2 className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-1 max-w-md">
              <p className="text-sm font-bold text-foreground">
                Nenhum entregável cadastrado na WBS
              </p>
              <p className="text-xs text-muted-foreground">
                Comece definindo os entregáveis de Nível 1 do escopo (ex.: 1. Carro & Engenharia, 2. Captação & Marketing).
              </p>
            </div>
            {!isPresentationMode && (
              <Button
                type="button"
                size="sm"
                onClick={onOpenCreateRoot}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Criar Primeiro Entregável Raiz</span>
              </Button>
            )}
          </div>
        ) : (
          <div
            role="tree"
            className={styles.treeCanvas()}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            }}
          >
            {/* Nó Mestre do Projeto (Raiz Nível 0) */}
            <div className={styles.rootProjectCard()}>
              <div className="flex items-center justify-center gap-1.5 text-primary text-xs font-bold tracking-wide uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Projeto STEM Racing (100%)</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Decomposição Hierárquica do Escopo Total
              </p>
              <div className="mt-2.5 flex items-center justify-center gap-3 border-t border-primary/20 pt-2 text-[10px] font-semibold text-foreground">
                <span>{totalProjectHours}h totais</span>
              </div>
            </div>

            <div className={styles.vLine()} aria-hidden="true" />

            {/* Barra conectora horizontal das raízes */}
            {nodes.length > 1 && (
              <div className="w-full px-20">
                <div className={styles.hBar()} />
              </div>
            )}

            {/* Linha dos nós raiz de Nível 1 */}
            <div className={styles.branchesRow()}>
              {nodes.map((rootNode) => (
                <div key={rootNode.id} className={styles.branchCol()}>
                  {nodes.length > 1 && (
                    <div className="h-4 w-px bg-border" aria-hidden="true" />
                  )}
                  <RecursiveWbsSubtree
                    node={rootNode}
                    expandedNodeIds={expandedNodeIds}
                    isPresentationMode={isPresentationMode}
                    onToggleExpand={onToggleExpand}
                    onAddChild={onAddChild}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
