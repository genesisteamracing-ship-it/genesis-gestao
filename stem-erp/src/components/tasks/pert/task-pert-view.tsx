"use client";

import * as React from "react";
import { AlertTriangle, Clock, Flame, GitFork, Layers } from "lucide-react";
import type { NodeTypes } from "@xyflow/react";
import { FlowCanvasShell } from "@/components/canvas/flow-canvas-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPertDays } from "@/lib/pert-engine";
import type { TaskEdge, TaskRecord } from "@/types/tasks";
import { PertTable } from "./pert-table";
import { PertTaskNode } from "./pert-task-node";
import { useTaskPert } from "./use-task-pert";

const nodeTypes: NodeTypes = {
  pertTask: PertTaskNode,
};

interface TaskPertViewProps {
  tasks: TaskRecord[];
  edges: TaskEdge[];
  canEdit: boolean;
  onOpenDetail: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
}

export function TaskPertView({
  tasks,
  edges,
  canEdit,
  onOpenDetail,
  onEditTask,
}: TaskPertViewProps) {
  const {
    viewMode,
    setViewMode,
    highlightCriticalOnly,
    toggleHighlightCritical,
    network,
    nodes,
    edges: flowEdges,
    tableItems,
  } = useTaskPert({
    tasks,
    edges,
    onSelectTask: onOpenDetail,
  });

  if (network.hasCycle) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-8 text-center"
      >
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
        <p className="text-sm font-semibold text-destructive">Dependência circular detectada</p>
        <p className="max-w-md text-xs text-muted-foreground">{network.cycleMessage}</p>
      </div>
    );
  }

  const { summary } = network;
  const durationDisplay = summary.hasThreePointEstimates
    ? `${formatPertDays(summary.projectDuration)} ± ${formatPertDays(summary.projectStdDev)} d`
    : `${formatPertDays(summary.projectDuration)} d`;

  const metricsText = `${summary.totalTaskCount} atividades · ${summary.dependencyCount} dependências`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Prazo mínimo (Te)</p>
              <p className="text-xl font-bold tabular-nums text-foreground">{durationDisplay}</p>
            </div>
            <Clock className="h-5 w-5 text-primary" aria-hidden="true" />
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Caminho crítico</p>
              <p className="text-xl font-bold tabular-nums text-destructive">
                {summary.criticalTaskCount} / {summary.totalTaskCount}
              </p>
            </div>
            <Flame className="h-5 w-5 text-destructive" aria-hidden="true" />
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Maior folga</p>
              <p className="text-xl font-bold tabular-nums text-foreground">
                {formatPertDays(summary.maxSlack)} d
              </p>
            </div>
            <GitFork className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-2xs">
          <CardContent className="flex items-center justify-between p-4">
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-muted-foreground">Frentes paralelas</p>
              <p className="text-xl font-bold tabular-nums text-foreground">
                {summary.parallelMaxWidth}
              </p>
            </div>
            <Layers className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive" aria-hidden="true" />
            Caminho crítico (folga 0)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-border bg-card" aria-hidden="true" />
            Atividade com folga
          </span>
        </div>

        <Button
          type="button"
          size="sm"
          variant={highlightCriticalOnly ? "destructive" : "outline"}
          className="w-full sm:w-auto"
          onClick={toggleHighlightCritical}
          aria-pressed={highlightCriticalOnly}
        >
          <Flame className="h-3.5 w-3.5" aria-hidden="true" />
          {highlightCriticalOnly ? "Mostrando caminho crítico" : "Destacar caminho crítico"}
        </Button>
      </div>

      <FlowCanvasShell
        title="Rede PERT (AON)"
        icon={<GitFork className="h-4 w-4 text-primary" />}
        metricsText={metricsText}
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showTableToggle
        emptyState={
          <div className="flex flex-col items-center gap-2 text-center">
            <GitFork className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground">Nenhuma atividade ativa para exibir</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Cadastre atividades e defina dependências para visualizar o caminho crítico e as folgas.
            </p>
          </div>
        }
      >
        {viewMode === "table" && (
          <PertTable
            items={tableItems}
            canEdit={canEdit}
            onOpenDetail={onOpenDetail}
            onEditTask={onEditTask}
          />
        )}
      </FlowCanvasShell>
    </div>
  );
}
