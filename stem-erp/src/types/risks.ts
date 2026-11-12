import type {
  DeliveryGroup,
  RiskConsequence,
  RiskEntryType,
  RiskLifecycleStatus,
  RiskPriorityLevel,
  RiskProbability,
} from "@prisma/client";

export interface RiskItemDTO {
  id: string;
  teamId: string;
  season: string;
  entryType: RiskEntryType;
  title: string;
  description: string | null;
  sector: DeliveryGroup;
  probability: RiskProbability;
  consequence: RiskConsequence;
  priorityScore: number;
  priorityLevel: RiskPriorityLevel;
  proactiveStrategy: string | null;
  contingencyPlan: string | null;
  observations: string | null;
  evidenceNotes: string | null;
  evidenceUrl: string | null;
  status: RiskLifecycleStatus;
  ownerName: string | null;
  ownerUserId: string | null;
  reviewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RiskReviewDTO {
  id: string;
  riskItemId: string;
  previousProbability: RiskProbability;
  newProbability: RiskProbability;
  previousConsequence: RiskConsequence;
  newConsequence: RiskConsequence;
  previousStatus: RiskLifecycleStatus;
  newStatus: RiskLifecycleStatus;
  notes: string;
  evidenceNotes: string | null;
  evidenceUrl: string | null;
  reviewerName: string;
  reviewedAt: string;
}

export interface DistributionSlice {
  key: string;
  label: string;
  count: number;
  percentage: number;
  tone: "critical" | "high" | "medium" | "low" | "info" | "muted";
}

export interface CartesianPoint {
  id: string;
  title: string;
  entryType: RiskEntryType;
  sector: DeliveryGroup;
  probability: RiskProbability;
  consequence: RiskConsequence;
  priorityLevel: RiskPriorityLevel;
  priorityScore: number;
  x: number;
  y: number;
  z: number;
  groupCount: number;
}

export interface RiskTeamMemberOption {
  id: string;
  name: string;
  deliveryGroup: DeliveryGroup | null;
}

export interface RiskModuleDataDTO {
  items: RiskItemDTO[];
  members: RiskTeamMemberOption[];
  canEdit: boolean;
}
