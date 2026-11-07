import type { Edge, Node } from "@xyflow/react";
import type { WbsTreeNode } from "@/types/wbs";

export interface WbsFlowNodeData extends Record<string, unknown> {
  node: WbsTreeNode;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggleExpand?: (nodeId: string) => void;
  onAddChild?: (node: WbsTreeNode) => void;
  onEdit?: (node: WbsTreeNode) => void;
  onDelete?: (node: WbsTreeNode) => void;
  isPresentationMode?: boolean;
}

export interface WbsFlowRootData extends Record<string, unknown> {
  totalCostCents: number;
  totalHours: number;
  totalNodes: number;
}

const NODE_WIDTH = 270;
const NODE_HEIGHT = 170;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 100;

interface LayoutNode {
  node: WbsTreeNode;
  width: number;
  x: number;
  y: number;
  children: LayoutNode[];
}

function computeSubtreeWidth(node: WbsTreeNode, expandedIds: Set<string>): number {
  if (node.children.length === 0 || !expandedIds.has(node.id)) {
    return NODE_WIDTH;
  }
  const childrenTotalWidth = node.children.reduce(
    (acc, child) => acc + computeSubtreeWidth(child, expandedIds),
    0
  );
  const gaps = (node.children.length - 1) * HORIZONTAL_GAP;
  return Math.max(NODE_WIDTH, childrenTotalWidth + gaps);
}

function buildLayoutTree(
  node: WbsTreeNode,
  startX: number,
  startY: number,
  expandedIds: Set<string>
): LayoutNode {
  const width = computeSubtreeWidth(node, expandedIds);
  const layoutNode: LayoutNode = {
    node,
    width,
    x: startX + width / 2 - NODE_WIDTH / 2,
    y: startY,
    children: [],
  };

  if (node.children.length > 0 && expandedIds.has(node.id)) {
    let currentX = startX;
    const nextY = startY + NODE_HEIGHT + VERTICAL_GAP;

    for (const child of node.children) {
      const childWidth = computeSubtreeWidth(child, expandedIds);
      const childLayout = buildLayoutTree(child, currentX, nextY, expandedIds);
      layoutNode.children.push(childLayout);
      currentX += childWidth + HORIZONTAL_GAP;
    }
  }

  return layoutNode;
}

interface WbsToFlowElementsParams {
  tree: WbsTreeNode[];
  expandedNodeIds: Set<string>;
  onToggleExpand?: (nodeId: string) => void;
  onAddChild?: (node: WbsTreeNode) => void;
  onEdit?: (node: WbsTreeNode) => void;
  onDelete?: (node: WbsTreeNode) => void;
  isPresentationMode?: boolean;
}

export function wbsToFlowElements({
  tree,
  expandedNodeIds,
  onToggleExpand,
  onAddChild,
  onEdit,
  onDelete,
  isPresentationMode = false,
}: WbsToFlowElementsParams): {
  nodes: Node[];
  edges: Edge[];
} {
  if (tree.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Calcular métricas agregadas da raiz master
  let totalCostCents = 0;
  let totalHours = 0;
  let totalNodesCount = 0;

  function countRecursive(list: WbsTreeNode[]) {
    for (const item of list) {
      totalNodesCount += 1;
      if (item.isLeaf) {
        totalCostCents += item.estimatedCostCents;
        totalHours += item.estimatedHours;
      }
      countRecursive(item.children);
    }
  }
  countRecursive(tree);

  // Layout das raízes de Nível 1
  const rootLayouts: LayoutNode[] = [];
  let currentStartX = 0;

  for (const rootNode of tree) {
    const rootWidth = computeSubtreeWidth(rootNode, expandedNodeIds);
    const layout = buildLayoutTree(rootNode, currentStartX, 180, expandedNodeIds);
    rootLayouts.push(layout);
    currentStartX += rootWidth + HORIZONTAL_GAP * 2;
  }

  const totalForestWidth = currentStartX - HORIZONTAL_GAP * 2;
  const projectMasterX = totalForestWidth / 2 - 140;

  // Nó Raiz Mestre (Nível 0 - 100% do Projeto)
  const masterNodeId = "wbs-project-root";
  nodes.push({
    id: masterNodeId,
    type: "wbsProjectRoot",
    position: { x: projectMasterX, y: 0 },
    data: {
      totalCostCents,
      totalHours,
      totalNodes: totalNodesCount,
    } as WbsFlowRootData,
  });

  function flattenLayout(item: LayoutNode, parentId: string) {
    const hasChildren = item.node.children.length > 0;
    const isExpanded = expandedNodeIds.has(item.node.id);

    nodes.push({
      id: item.node.id,
      type: "wbsNode",
      position: { x: item.x, y: item.y },
      data: {
        node: item.node,
        isExpanded,
        hasChildren,
        onToggleExpand,
        onAddChild,
        onEdit,
        onDelete,
        isPresentationMode,
      } as WbsFlowNodeData,
    });

    edges.push({
      id: `edge-${parentId}->${item.node.id}`,
      source: parentId,
      target: item.node.id,
      type: "smoothstep",
      style: { stroke: "var(--border)", strokeWidth: 1.5 },
    });

    if (isExpanded) {
      for (const child of item.children) {
        flattenLayout(child, item.node.id);
      }
    }
  }

  for (const root of rootLayouts) {
    flattenLayout(root, masterNodeId);
  }

  return { nodes, edges };
}
