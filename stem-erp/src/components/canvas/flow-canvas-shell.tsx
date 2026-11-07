"use client";

import * as React from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
  type ReactFlowInstance,
} from "@xyflow/react";
import { tv } from "tailwind-variants";
import {
  Maximize2,
  MoreVertical,
  Network,
  RotateCcw,
  TableProperties,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const flowShellStyles = tv({
  slots: {
    container:
      "relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs",
    toolbar:
      "flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-3 backdrop-blur-xs",
    leftSection: "flex items-center gap-3 text-xs text-muted-foreground",
    rightSection: "flex flex-wrap items-center gap-2",
    viewport: "relative h-[650px] w-full bg-background select-none",
    viewToggleGroup:
      "inline-flex items-center rounded-lg border border-border bg-card p-0.5 shadow-2xs",
    viewToggleButton:
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
    zoomBtn:
      "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-foreground transition-colors hover:bg-muted cursor-pointer disabled:opacity-40",
  },
  variants: {
    activeView: {
      canvas: {
        viewToggleButton: "bg-primary text-primary-foreground shadow-2xs",
      },
      table: {
        viewToggleButton: "text-muted-foreground hover:text-foreground",
      },
    },
  },
});

interface FlowCanvasShellProps<NodeType extends Node = Node, EdgeType extends Edge = Edge> {
  title: string;
  icon?: React.ReactNode;
  metricsText?: string;
  nodes: NodeType[];
  edges: EdgeType[];
  nodeTypes: NodeTypes;
  onNodesChange?: OnNodesChange<NodeType>;
  onEdgesChange?: OnEdgesChange<EdgeType>;
  viewMode?: "canvas" | "table";
  onViewModeChange?: (mode: "canvas" | "table") => void;
  showTableToggle?: boolean;
  emptyState?: React.ReactNode;
  children?: React.ReactNode;
  onInit?: (instance: ReactFlowInstance<NodeType, EdgeType>) => void;
  onFitView?: () => void;
  className?: string;
}

export function FlowCanvasShell<NodeType extends Node = Node, EdgeType extends Edge = Edge>({
  title,
  icon,
  metricsText,
  nodes,
  edges,
  nodeTypes,
  onNodesChange,
  onEdgesChange,
  viewMode = "canvas",
  onViewModeChange,
  showTableToggle = true,
  emptyState,
  children,
  onInit,
  onFitView,
  className,
}: FlowCanvasShellProps<NodeType, EdgeType>) {
  const styles = flowShellStyles();
  const [rfInstance, setRfInstance] = React.useState<ReactFlowInstance<NodeType, EdgeType> | null>(null);
  const [showDots, setShowDots] = React.useState(true);
  const [showMiniMap, setShowMiniMap] = React.useState(true);

  const handleInit = React.useCallback(
    (instance: ReactFlowInstance<NodeType, EdgeType>) => {
      setRfInstance(instance);
      if (onInit) {
        onInit(instance);
      }
    },
    [onInit]
  );

  const handleZoomIn = () => rfInstance?.zoomIn({ duration: 250 });
  const handleZoomOut = () => rfInstance?.zoomOut({ duration: 250 });
  const handleFitView = () => {
    if (onFitView) {
      onFitView();
    } else {
      rfInstance?.fitView({ duration: 400, padding: 0.2 });
    }
  };

  const hasNodes = nodes.length > 0;

  return (
    <div className={styles.container({ className })}>
      {/* Toolbar Superior */}
      <div className={styles.toolbar()}>
        <div className={styles.leftSection()}>
          <span className="font-semibold text-foreground flex items-center gap-1.5 text-xs sm:text-sm">
            {icon || <Network className="h-4 w-4 text-primary" />}
            <span>{title}</span>
          </span>
          {metricsText && (
            <>
              <span>•</span>
              <span className="hidden sm:inline">{metricsText}</span>
            </>
          )}
        </div>

        <div className={styles.rightSection()}>
          {/* Alternador Canvas vs Tabela */}
          {showTableToggle && onViewModeChange && (
            <div className={styles.viewToggleGroup()}>
              <button
                type="button"
                onClick={() => onViewModeChange("canvas")}
                className={
                  viewMode === "canvas"
                    ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground shadow-2xs cursor-pointer"
                    : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                }
                title="Visualização em Canvas Interativo"
              >
                <Network className="h-3.5 w-3.5" />
                <span>Árvore (Canvas)</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange("table")}
                className={
                  viewMode === "table"
                    ? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground shadow-2xs cursor-pointer"
                    : "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
                }
                title="Visualização em Tabela Tabular"
              >
                <TableProperties className="h-3.5 w-3.5" />
                <span>Tabela</span>
              </button>
            </div>
          )}

          {/* Controles de Zoom e Enquadramento */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomOut}
              className={styles.zoomBtn()}
              title="Diminuir Zoom"
              aria-label="Diminuir Zoom"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className={styles.zoomBtn()}
              title="Aumentar Zoom"
              aria-label="Aumentar Zoom"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFitView}
              className={styles.zoomBtn()}
              title="Ajustar à Tela (Fit View)"
              aria-label="Ajustar à Tela"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Menu de Opções do Canvas */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-lg border-border text-foreground hover:bg-muted cursor-pointer"
                aria-label="Opções e Configurações do Canvas"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-xs">Opções do Canvas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleFitView}
                className="cursor-pointer gap-2 text-xs"
              >
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Centralizar visualização</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => rfInstance?.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 })}
                className="cursor-pointer gap-2 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Redefinir escala (100%)</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDots((prev) => !prev)}
                className="cursor-pointer gap-2 text-xs"
              >
                <span>{showDots ? "Ocultar grade de pontos" : "Exibir grade de pontos"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowMiniMap((prev) => !prev)}
                className="cursor-pointer gap-2 text-xs"
              >
                <span>{showMiniMap ? "Ocultar minimapa" : "Exibir minimapa"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {children}
        </div>
      </div>

      {/* Viewport do React Flow */}
      <div className={styles.viewport()}>
        {!hasNodes && emptyState ? (
          emptyState
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onInit={handleInit}
            fitView
            minZoom={0.2}
            maxZoom={2}
            defaultEdgeOptions={{
              type: "smoothstep",
              style: { stroke: "var(--border)", strokeWidth: 1.5 },
            }}
            proOptions={{ hideAttribution: true }}
          >
            {showDots && (
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={1.2}
                color="var(--border)"
              />
            )}

            {showMiniMap && (
              <MiniMap
                position="bottom-right"
                pannable
                zoomable
                className="!m-4 !rounded-xl !border !border-border !bg-card/90 !shadow-md !backdrop-blur-xs !w-40 !h-24 overflow-hidden"
                maskColor="rgba(0, 0, 0, 0.15)"
                nodeColor="var(--primary)"
              />
            )}
            <Controls showInteractive={false} className="!hidden" />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}
