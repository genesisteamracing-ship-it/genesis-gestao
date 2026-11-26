"use client";

import { useMemo, useState } from "react";
import { calculatePertNetwork } from "@/lib/pert-engine";
import type { TaskEdge, TaskRecord } from "@/types/tasks";
import { buildPertFlowGraph } from "./pert-flow.adapter";

interface UseTaskPertParams {
  tasks: TaskRecord[];
  edges: TaskEdge[];
  onSelectTask: (taskId: string) => void;
}

export function useTaskPert({ tasks, edges, onSelectTask }: UseTaskPertParams) {
  const [viewMode, setViewMode] = useState<"canvas" | "table">("canvas");
  const [highlightCriticalOnly, setHighlightCriticalOnly] = useState(false);

  const network = useMemo(() => calculatePertNetwork(tasks, edges), [tasks, edges]);

  const flowGraph = useMemo(
    () =>
      buildPertFlowGraph(network, {
        highlightCriticalOnly,
        onSelectTask,
      }),
    [network, highlightCriticalOnly, onSelectTask],
  );

  const tableItems = useMemo(() => {
    const list = highlightCriticalOnly
      ? network.nodes.filter((item) => item.isCritical)
      : network.nodes;
    return [...list].sort((a, b) => {
      if (a.isCritical !== b.isCritical) return a.isCritical ? -1 : 1;
      if (a.earlyStart !== b.earlyStart) return a.earlyStart - b.earlyStart;
      return a.task.title.localeCompare(b.task.title, "pt-BR");
    });
  }, [network.nodes, highlightCriticalOnly]);

  return {
    viewMode,
    setViewMode,
    highlightCriticalOnly,
    toggleHighlightCritical: () => setHighlightCriticalOnly((prev) => !prev),
    network,
    nodes: flowGraph.nodes,
    edges: flowGraph.edges,
    tableItems,
  };
}
