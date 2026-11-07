import type { Edge, Node } from "@xyflow/react";
import type {
  OrgMapPartnerBranch,
  OrgMapStakeholderNode,
  StakeholderOrgMapTree,
} from "@/types/communication";

export interface StakeholderFlowNodeData extends Record<string, unknown> {
  node: OrgMapStakeholderNode;
  onSelectNode: (node: OrgMapStakeholderNode) => void;
  onAddSubordinate: (node: OrgMapStakeholderNode) => void;
  onAddLateral?: (node: OrgMapStakeholderNode) => void;
}

export interface StakeholderPartnerNodeData extends Record<string, unknown> {
  branch: OrgMapPartnerBranch;
  onAddStakeholder: (partnerName: string, sponsorId: string | null) => void;
}

export interface StakeholderTeamRootNodeData extends Record<string, unknown> {
  teamName: string;
  totalPartners: number;
  totalStakeholders: number;
  totalPlans: number;
}

const NODE_WIDTH = 250;
const NODE_HEIGHT = 150;
const HORIZONTAL_GAP = 40;
const VERTICAL_GAP = 90;

function computeSubtreeWidth(node: OrgMapStakeholderNode): number {
  if (node.children.length === 0) {
    return NODE_WIDTH;
  }
  const childrenWidth = node.children.reduce(
    (acc, child) => acc + computeSubtreeWidth(child),
    0
  );
  const gaps = (node.children.length - 1) * HORIZONTAL_GAP;
  return Math.max(NODE_WIDTH, childrenWidth + gaps);
}

function computeBranchWidth(branch: OrgMapPartnerBranch): number {
  if (branch.rootNodes.length === 0) {
    return NODE_WIDTH;
  }
  const rootsWidth = branch.rootNodes.reduce(
    (acc, root) => acc + computeSubtreeWidth(root),
    0
  );
  const gaps = (branch.rootNodes.length - 1) * HORIZONTAL_GAP;
  return Math.max(NODE_WIDTH, rootsWidth + gaps);
}

interface StakeholderToFlowElementsParams {
  tree: StakeholderOrgMapTree;
  collapsedPartners?: Record<string, boolean>;
  onSelectNode: (node: OrgMapStakeholderNode) => void;
  onAddSubordinate: (node: OrgMapStakeholderNode) => void;
  onAddLateral: (node: OrgMapStakeholderNode) => void;
  onAddStakeholderToPartner: (partnerName: string, sponsorId: string | null) => void;
}

export function stakeholdersToFlowElements({
  tree,
  collapsedPartners = {},
  onSelectNode,
  onAddSubordinate,
  onAddLateral,
  onAddStakeholderToPartner,
}: StakeholderToFlowElementsParams): {
  nodes: Node[];
  edges: Edge[];
} {
  if (tree.partners.length === 0) {
    return { nodes: [], edges: [] };
  }

  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // 1. Calcular larguras de cada parceiro
  let totalForestWidth = 0;
  const branchWidths = tree.partners.map((branch) => {
    const isCollapsed = Boolean(collapsedPartners[branch.partnerKey]);
    const width = isCollapsed ? NODE_WIDTH : computeBranchWidth(branch);
    totalForestWidth += width;
    return { branch, width, isCollapsed };
  });

  const gapsBetweenPartners = Math.max(0, tree.partners.length - 1) * (HORIZONTAL_GAP * 2);
  const fullWidth = totalForestWidth + gapsBetweenPartners;
  const teamRootX = Math.max(0, fullWidth / 2 - 130);

  // 2. Nó Mestre da Equipe (Nível 0)
  const teamNodeId = "team-root-node";
  nodes.push({
    id: teamNodeId,
    type: "stakeholderTeamRoot",
    position: { x: teamRootX, y: 0 },
    data: {
      teamName: tree.teamName,
      totalPartners: tree.totalPartners,
      totalStakeholders: tree.totalStakeholders,
      totalPlans: tree.totalPlans,
    } as StakeholderTeamRootNodeData,
  });

  // 3. Nós dos Parceiros (Nível 1) e Stakeholders (Nível 2+)
  let currentStartX = 0;
  const partnerY = 170;

  for (const { branch, width, isCollapsed } of branchWidths) {
    const partnerNodeId = `partner-${branch.partnerKey}`;
    const partnerX = currentStartX + width / 2 - NODE_WIDTH / 2;

    nodes.push({
      id: partnerNodeId,
      type: "stakeholderPartner",
      position: { x: partnerX, y: partnerY },
      data: {
        branch,
        onAddStakeholder: onAddStakeholderToPartner,
      } as StakeholderPartnerNodeData,
    });

    edges.push({
      id: `edge-${teamNodeId}->${partnerNodeId}`,
      source: teamNodeId,
      target: partnerNodeId,
      type: "smoothstep",
      style: { stroke: "var(--border)", strokeWidth: 1.5 },
    });

    if (!isCollapsed && branch.rootNodes.length > 0) {
      let rootStartX = currentStartX;
      const stakeholderStartY = partnerY + NODE_HEIGHT + VERTICAL_GAP;

      for (const rootStakeholder of branch.rootNodes) {
        const rootWidth = computeSubtreeWidth(rootStakeholder);
        layoutStakeholderSubtree(
          rootStakeholder,
          rootStartX,
          stakeholderStartY,
          partnerNodeId
        );
        rootStartX += rootWidth + HORIZONTAL_GAP;
      }
    }

    currentStartX += width + HORIZONTAL_GAP * 2;
  }

  function layoutStakeholderSubtree(
    node: OrgMapStakeholderNode,
    startX: number,
    startY: number,
    parentId: string
  ) {
    const width = computeSubtreeWidth(node);
    const nodeX = startX + width / 2 - NODE_WIDTH / 2;
    const nodeId = `stakeholder-${node.id}`;

    nodes.push({
      id: nodeId,
      type: "stakeholderNode",
      position: { x: nodeX, y: startY },
      data: {
        node,
        onSelectNode,
        onAddSubordinate,
        onAddLateral,
      } as StakeholderFlowNodeData,
    });

    edges.push({
      id: `edge-${parentId}->${nodeId}`,
      source: parentId,
      target: nodeId,
      type: "smoothstep",
      style: { stroke: "var(--border)", strokeWidth: 1.5 },
    });

    if (node.children.length > 0) {
      let childStartX = startX;
      const nextY = startY + NODE_HEIGHT + VERTICAL_GAP;

      for (const child of node.children) {
        const childWidth = computeSubtreeWidth(child);
        layoutStakeholderSubtree(child, childStartX, nextY, nodeId);
        childStartX += childWidth + HORIZONTAL_GAP;
      }
    }
  }

  return { nodes, edges };
}
