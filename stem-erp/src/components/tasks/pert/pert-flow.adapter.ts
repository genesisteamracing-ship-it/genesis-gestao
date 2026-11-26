import { MarkerType, type Edge, type Node } from "@xyflow/react";
import type { PertNetworkResult, PertTaskMetrics } from "@/lib/pert-engine";

export interface PertTaskNodeData extends Record<string, unknown> {
  metrics: PertTaskMetrics;
  dimmed: boolean;
  onSelect: (taskId: string) => void;
}

export type PertFlowNode = Node<PertTaskNodeData, "pertTask">;

const NODE_WIDTH = 256;
const NODE_HEIGHT = 152;
const HORIZONTAL_GAP = 88;
const VERTICAL_GAP = 36;

export function buildPertFlowGraph(
  network: PertNetworkResult,
  options: {
    highlightCriticalOnly: boolean;
    onSelectTask: (taskId: string) => void;
  },
): { nodes: PertFlowNode[]; edges: Edge[] } {
  if (network.hasCycle || network.nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  const levels = new Map<number, PertTaskMetrics[]>();
  for (const item of network.nodes) {
    const group = levels.get(item.level) ?? [];
    group.push(item);
    levels.set(item.level, group);
  }

  const maxColumnSize = Math.max(...[...levels.values()].map((group) => group.length));
  const totalHeight = maxColumnSize * (NODE_HEIGHT + VERTICAL_GAP) - VERTICAL_GAP;

  const nodes: PertFlowNode[] = [];
  const sortedLevels = [...levels.keys()].sort((a, b) => a - b);

  for (const level of sortedLevels) {
    const group = [...(levels.get(level) ?? [])].sort((a, b) => {
      if (a.isCritical !== b.isCritical) return a.isCritical ? -1 : 1;
      if (a.earlyStart !== b.earlyStart) return a.earlyStart - b.earlyStart;
      return a.task.title.localeCompare(b.task.title, "pt-BR");
    });

    const columnHeight = group.length * (NODE_HEIGHT + VERTICAL_GAP) - VERTICAL_GAP;
    const offsetY = Math.max(0, (totalHeight - columnHeight) / 2);

    group.forEach((metrics, rowIndex) => {
      nodes.push({
        id: metrics.task.id,
        type: "pertTask",
        position: {
          x: level * (NODE_WIDTH + HORIZONTAL_GAP),
          y: offsetY + rowIndex * (NODE_HEIGHT + VERTICAL_GAP),
        },
        data: {
          metrics,
          dimmed: options.highlightCriticalOnly && !metrics.isCritical,
          onSelect: options.onSelectTask,
        },
      });
    });
  }

  const edges: Edge[] = network.edges.map((edge) => {
    const dimmed = options.highlightCriticalOnly && !edge.isCritical;
    return {
      id: edge.id,
      source: edge.predecessorId,
      target: edge.successorId,
      type: "smoothstep",
      animated: edge.isCritical,
      zIndex: edge.isCritical ? 20 : 10,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: edge.isCritical ? "var(--destructive)" : "var(--muted-foreground)",
      },
      style: {
        stroke: edge.isCritical ? "var(--destructive)" : "var(--border)",
        strokeWidth: edge.isCritical ? 2.5 : 1.75,
        opacity: dimmed ? 0.18 : 1,
      },
    };
  });

  return { nodes, edges };
}
