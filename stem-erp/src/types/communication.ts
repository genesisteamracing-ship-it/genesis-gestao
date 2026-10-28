import type {
  StakeholderGroup,
  StakeholderPower,
  StakeholderInterest,
  EngagementLevel,
  CommunicationChannel,
  CommunicationFrequency,
  FeedbackSentiment,
} from "@prisma/client";

export type {
  StakeholderGroup,
  StakeholderPower,
  StakeholderInterest,
  EngagementLevel,
  CommunicationChannel,
  CommunicationFrequency,
  FeedbackSentiment,
};

export interface StakeholderWithRelations {
  id: string;
  teamId: string;
  sponsorId: string | null;
  name: string;
  organization: string | null;
  roleOrJobTitle: string | null;
  group: StakeholderGroup;
  email: string | null;
  phone: string | null;
  power: StakeholderPower;
  interest: StakeholderInterest;
  currentEngagement: EngagementLevel;
  targetEngagement: EngagementLevel;
  preferredChannel: CommunicationChannel;
  preferredFrequency: CommunicationFrequency;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  sponsor?: {
    id: string;
    name: string;
    tier: string;
  } | null;
  plans: CommunicationPlanSummary[];
  communications: CommunicationLogSummary[];
}

export interface CommunicationPlanSummary {
  id: string;
  teamId: string;
  stakeholderId: string;
  title: string;
  channel: CommunicationChannel;
  frequency: CommunicationFrequency;
  customApproach: string | null;
  keyInformation: string | null;
  responsibleMemberId: string | null;
  responsibleMemberName: string | null;
  isActive: boolean;
  lastDispatchedAt: Date | null;
  nextDispatchDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunicationLogSummary {
  id: string;
  teamId: string;
  stakeholderId: string;
  planId: string | null;
  subject: string;
  channel: CommunicationChannel;
  sentAt: Date;
  dispatchedByName: string;
  contentSummary: string;
  reportTypeIncluded: string | null;
  evidenceLink: string | null;
  feedbacks: CommunicationFeedbackSummary[];
  stakeholder?: {
    id: string;
    name: string;
    organization: string | null;
    group: StakeholderGroup;
  };
}

export interface CommunicationFeedbackSummary {
  id: string;
  communicationLogId: string;
  receivedAt: Date;
  sentiment: FeedbackSentiment;
  stakeholderResponse: string;
  continuousImprovementAction: string | null;
  isAddressed: boolean;
  createdAt: Date;
}

export interface CommunicationMetrics {
  totalStakeholders: number;
  totalPlans: number;
  totalDispatches: number;
  engagementAverageScore: number; // 1 (UNAWARE) a 5 (LEADING)
  highPowerCount: number;
  pendingFeedbacksCount: number;
  addressedFeedbacksCount: number;
  addressedFeedbacksPercent: number;
  dispatchesByChannel: Record<CommunicationChannel, number>;
  stakeholdersByGroup: Record<StakeholderGroup, number>;
}

export interface StakeholderMatrixItem {
  id: string;
  name: string;
  organization: string | null;
  group: StakeholderGroup;
  power: StakeholderPower;
  interest: StakeholderInterest;
  currentEngagement: EngagementLevel;
  targetEngagement: EngagementLevel;
  preferredChannel: CommunicationChannel;
  preferredFrequency: CommunicationFrequency;
  quadrant: "MANAGE_CLOSELY" | "KEEP_SATISFIED" | "KEEP_INFORMED" | "MONITOR";
}

export interface ReportDataPayload {
  teamName: string;
  generatedAt: Date;
  financialMetrics: {
    totalRevenueCents: number;
    totalExpenseCents: number;
    currentBalanceCents: number;
    inKindTotalCents: number;
    projectedRunwayMonths: number;
  };
  roiMetrics: {
    totalDirectInvestmentCents: number;
    totalDeliveredValueCents: number;
    roiPercentage: number;
    topSponsors: Array<{
      name: string;
      tier: string;
      investmentCents: number;
      deliveredCents: number;
      ratio: number;
    }>;
  };
  recentActions: Array<{
    date: Date;
    title: string;
    sponsorName: string;
    reachCount: number | null;
    valueCents: number;
  }>;
}

export interface GeneratedCommunicationMessage {
  subject: string;
  whatsappText: string;
  whatsappLink: string;
  emailSubject: string;
  emailHtml: string;
  emailPlainText: string;
}
