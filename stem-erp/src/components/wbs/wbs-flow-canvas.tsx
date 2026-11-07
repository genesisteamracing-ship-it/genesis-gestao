"use client";

import * as React from "react";
import { FolderGit2, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WbsTreeNode } from "@/types/wbs";
import { FlowCanvasShell } from "@/components/canvas/flow-canvas-shell";
import { wbsToFlowElements } from "./wbs-flow.adapter";
import {
  WbsFlowNodeComponent,
  WbsProjectRootNodeComponent,
} from "./wbs-flow-node";

const nodeTypes = {
  wbsNode: WbsFlowNodeComponent,
  wbsProjectRoot: WbsProjectRootNodeComponent,
};

interface WbsFlowCanvasProps {
  nodes: WbsTreeNode[];
  expandedNodeIds: Set<string>;
  isPresentationMode?: boolean;
  onToggleExpand: (nodeId: string) => void;
  onAddChild: (node: WbsTreeNode) => void;
  onEdit: (node: WbsTreeNode) => void;
  onDelete: (node: WbsTreeNode) => void;
  onOpenCreateRoot: () => void;
  viewMode?: "canvas" | "table";
  onViewModeChange?: (mode: "canvas" | "table") => void;
}

export function WbsFlowCanvas({
  nodes,
  expandedNodeIds,
  isPresentationMode = false,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
  onOpenCreateRoot,
  viewMode = "canvas",
  onViewModeChange,
}: WbsFlowCanvasProps) {
  const { nodes: flowNodes, edges: flowEdges } = React.useMemo(() => {
    return wbsToFlowElements({
      tree: nodes,
      expandedNodeIds,
      onToggleExpand,
      onAddChild,
      onEdit,
      onDelete,
      isPresentationMode,
    });
  }, [
    nodes,
    expandedNodeIds,
    onToggleExpand,
    onAddChild,
    onEdit,
    onDelete,
    isPresentationMode,
  ]);

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
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
  );

  return (
    <FlowCanvasShell
      title="Árvore do Escopo (WBS / EAP)"
      icon={<Layers className="h-4 w-4 text-primary" />}
      metricsText={`${nodes.length} entregáveis raiz cadastrados`}
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
      showTableToggle={Boolean(onViewModeChange)}
      emptyState={emptyState}
    />
  );
}
