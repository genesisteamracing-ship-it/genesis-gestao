import type { WbsTreeNode } from "@/types/wbs";

export function expandWbsAncestors(
  tree: WbsTreeNode[],
  nodeId: string,
  expandedNodeIds: Set<string>
): Set<string> {
  const expanded = new Set(expandedNodeIds);

  function expandPath(nodes: WbsTreeNode[]): boolean {
    for (const node of nodes) {
      if (node.id === nodeId) return true;
      if (expandPath(node.children)) {
        expanded.add(node.id);
        return true;
      }
    }
    return false;
  }

  return expandPath(tree) ? expanded : expandedNodeIds;
}
