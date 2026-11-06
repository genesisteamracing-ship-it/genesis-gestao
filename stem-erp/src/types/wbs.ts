import type { DeliveryGroup, WbsNodeStatus } from "@prisma/client";

export type { DeliveryGroup, WbsNodeStatus };

export interface WbsNodeDTO {
  id: string;
  teamId: string;
  parentId: string | null;
  code: string;
  title: string;
  description: string | null;
  discipline: DeliveryGroup;
  ownerId: string | null;
  ownerName: string | null;
  status: WbsNodeStatus;
  estimatedCostCents: number;
  estimatedHours: number;
  sortOrder: number;
  depth: number;
  createdAt: string;
  updatedAt: string;
}

export interface WbsTreeNode extends WbsNodeDTO {
  isLeaf: boolean;
  rolledUpCostCents: number;
  rolledUpHours: number;
  children: WbsTreeNode[];
}

export interface WbsSummaryMetrics {
  totalDeliverables: number;
  totalWorkPackages: number;     // Apenas nós folha (work packages)
  totalRollupCostCents: number;   // Custo total consolidado (Regra dos 100%)
  totalRollupHours: number;       // Horas totais consolidadas (Regra dos 100%)
  completedDeliverables: number;
  disciplineCounts: Partial<Record<DeliveryGroup, number>>;
}

export interface WbsTreeDataResult {
  tree: WbsTreeNode[];
  metrics: WbsSummaryMetrics;
  members: {
    id: string;
    name: string;
    jobTitle: string | null;
    deliveryGroup: DeliveryGroup | null;
  }[];
}
