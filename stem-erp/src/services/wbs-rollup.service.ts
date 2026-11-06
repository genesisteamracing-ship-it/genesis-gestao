import type { DeliveryGroup } from "@prisma/client";
import type { WbsNodeDTO, WbsSummaryMetrics, WbsTreeNode } from "@/types/wbs";

/**
 * Monta a árvore hierárquica a partir da lista plana de entregáveis
 * e calcula a agregação da Regra dos 100% (roll-up de custos e horas).
 */
export function buildWbsTree(nodes: WbsNodeDTO[]): {
  tree: WbsTreeNode[];
  metrics: WbsSummaryMetrics;
} {
  if (!nodes || nodes.length === 0) {
    return {
      tree: [],
      metrics: {
        totalDeliverables: 0,
        totalWorkPackages: 0,
        totalRollupCostCents: 0,
        totalRollupHours: 0,
        completedDeliverables: 0,
        disciplineCounts: {},
      },
    };
  }

  // 1. Mapeia cada nó plano para um nó da árvore
  const nodeMap = new Map<string, WbsTreeNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, {
      ...n,
      isLeaf: true,
      rolledUpCostCents: n.estimatedCostCents || 0,
      rolledUpHours: n.estimatedHours || 0,
      children: [],
    });
  }

  // 2. Estabelece relacionamentos pai-filho
  const roots: WbsTreeNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parentId && nodeMap.has(node.parentId)) {
      const parent = nodeMap.get(node.parentId)!;
      parent.children.push(node);
      parent.isLeaf = false;
    } else {
      roots.push(node);
    }
  }

  // 3. Ordena os nós por código/sortOrder
  const sortNodes = (list: WbsTreeNode[]) => {
    list.sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.code.localeCompare(b.code, undefined, { numeric: true });
    });
    for (const item of list) {
      if (item.children.length > 0) {
        sortNodes(item.children);
      }
    }
  };
  sortNodes(roots);

  // 4. Executa o algoritmo recursivo de Roll-up (Bottom-up)
  function computeRollup(node: WbsTreeNode): { cost: number; hours: number } {
    if (node.children.length === 0) {
      node.isLeaf = true;
      node.rolledUpCostCents = node.estimatedCostCents;
      node.rolledUpHours = node.estimatedHours;
      return { cost: node.rolledUpCostCents, hours: node.rolledUpHours };
    }

    node.isLeaf = false;
    let sumCost = 0;
    let sumHours = 0;

    for (const child of node.children) {
      const childTotals = computeRollup(child);
      sumCost += childTotals.cost;
      sumHours += childTotals.hours;
    }

    node.rolledUpCostCents = sumCost;
    node.rolledUpHours = sumHours;
    return { cost: sumCost, hours: sumHours };
  }

  let totalRollupCostCents = 0;
  let totalRollupHours = 0;

  for (const root of roots) {
    const rootTotals = computeRollup(root);
    totalRollupCostCents += rootTotals.cost;
    totalRollupHours += rootTotals.hours;
  }

  // 5. Coleta métricas consolidadas
  let totalWorkPackages = 0;
  let completedDeliverables = 0;
  const disciplineCounts: Partial<Record<DeliveryGroup, number>> = {};

  for (const node of nodeMap.values()) {
    if (node.isLeaf) {
      totalWorkPackages++;
    }
    if (node.status === "COMPLETED" || node.status === "AUDITED") {
      completedDeliverables++;
    }
    disciplineCounts[node.discipline] =
      (disciplineCounts[node.discipline] || 0) + 1;
  }

  return {
    tree: roots,
    metrics: {
      totalDeliverables: nodes.length,
      totalWorkPackages,
      totalRollupCostCents,
      totalRollupHours,
      completedDeliverables,
      disciplineCounts,
    },
  };
}
