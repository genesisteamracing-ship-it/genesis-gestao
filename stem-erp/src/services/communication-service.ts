import { prisma } from "@/lib/prisma";
import type {
  CommunicationChannel,
  CommunicationLogSummary,
  CommunicationMetrics,
  CommunicationPlanSummary,
  ReportDataPayload,
  StakeholderGroup,
  StakeholderMatrixItem,
  StakeholderWithRelations,
} from "@/types/communication";
import type {
  CreateCommunicationLogInput,
  CreateCommunicationPlanInput,
  CreateFeedbackInput,
  CreateStakeholderInput,
  UpdateStakeholderInput,
} from "@/lib/validations/communication";

function mapQuadrant(
  power: "LOW" | "HIGH",
  interest: "LOW" | "HIGH"
): "MANAGE_CLOSELY" | "KEEP_SATISFIED" | "KEEP_INFORMED" | "MONITOR" {
  if (power === "HIGH" && interest === "HIGH") return "MANAGE_CLOSELY";
  if (power === "HIGH" && interest === "LOW") return "KEEP_SATISFIED";
  if (power === "LOW" && interest === "HIGH") return "KEEP_INFORMED";
  return "MONITOR";
}

export async function getStakeholders(
  teamId: string,
  filterGroup?: StakeholderGroup
): Promise<StakeholderWithRelations[]> {
  const stakeholders = await prisma.stakeholder.findMany({
    where: {
      teamId,
      ...(filterGroup ? { group: filterGroup } : {}),
    },
    include: {
      sponsor: {
        select: {
          id: true,
          name: true,
          tier: true,
        },
      },
      plans: {
        orderBy: { createdAt: "desc" },
      },
      communications: {
        orderBy: { sentAt: "desc" },
        take: 5,
        include: {
          feedbacks: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return stakeholders as unknown as StakeholderWithRelations[];
}

export async function getStakeholderById(
  teamId: string,
  id: string
): Promise<StakeholderWithRelations | null> {
  const stakeholder = await prisma.stakeholder.findFirst({
    where: { id, teamId },
    include: {
      sponsor: {
        select: {
          id: true,
          name: true,
          tier: true,
        },
      },
      plans: true,
      communications: {
        include: { feedbacks: true },
        orderBy: { sentAt: "desc" },
      },
    },
  });

  return stakeholder as unknown as StakeholderWithRelations | null;
}

export async function createStakeholder(
  teamId: string,
  input: CreateStakeholderInput
) {
  return prisma.stakeholder.create({
    data: {
      teamId,
      name: input.name,
      organization: input.organization || null,
      roleOrJobTitle: input.roleOrJobTitle || null,
      group: input.group,
      sponsorId: input.sponsorId || null,
      email: input.email || null,
      phone: input.phone || null,
      power: input.power,
      interest: input.interest,
      currentEngagement: input.currentEngagement,
      targetEngagement: input.targetEngagement,
      preferredChannel: input.preferredChannel,
      preferredFrequency: input.preferredFrequency,
      notes: input.notes || null,
    },
  });
}

export async function updateStakeholder(
  teamId: string,
  input: UpdateStakeholderInput
) {
  return prisma.stakeholder.update({
    where: {
      id: input.id,
      teamId,
    },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.organization !== undefined ? { organization: input.organization || null } : {}),
      ...(input.roleOrJobTitle !== undefined ? { roleOrJobTitle: input.roleOrJobTitle || null } : {}),
      ...(input.group !== undefined ? { group: input.group } : {}),
      ...(input.sponsorId !== undefined ? { sponsorId: input.sponsorId || null } : {}),
      ...(input.email !== undefined ? { email: input.email || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      ...(input.power !== undefined ? { power: input.power } : {}),
      ...(input.interest !== undefined ? { interest: input.interest } : {}),
      ...(input.currentEngagement !== undefined ? { currentEngagement: input.currentEngagement } : {}),
      ...(input.targetEngagement !== undefined ? { targetEngagement: input.targetEngagement } : {}),
      ...(input.preferredChannel !== undefined ? { preferredChannel: input.preferredChannel } : {}),
      ...(input.preferredFrequency !== undefined ? { preferredFrequency: input.preferredFrequency } : {}),
      ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
    },
  });
}

export async function deleteStakeholder(teamId: string, id: string) {
  return prisma.stakeholder.delete({
    where: { id, teamId },
  });
}

export async function createCommunicationPlan(
  teamId: string,
  input: CreateCommunicationPlanInput
) {
  return prisma.communicationPlan.create({
    data: {
      teamId,
      stakeholderId: input.stakeholderId,
      title: input.title,
      channel: input.channel,
      frequency: input.frequency,
      customApproach: input.customApproach || null,
      keyInformation: input.keyInformation || null,
      responsibleMemberName: input.responsibleMemberName,
      nextDispatchDate: input.nextDispatchDate ? new Date(input.nextDispatchDate) : null,
    },
  });
}

export async function getCommunicationPlans(teamId: string): Promise<CommunicationPlanSummary[]> {
  const plans = await prisma.communicationPlan.findMany({
    where: { teamId },
    include: {
      stakeholder: {
        select: {
          id: true,
          name: true,
          organization: true,
          group: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return plans as unknown as CommunicationPlanSummary[];
}

export async function createCommunicationLog(
  teamId: string,
  input: CreateCommunicationLogInput
) {
  const log = await prisma.communicationLog.create({
    data: {
      teamId,
      stakeholderId: input.stakeholderId,
      planId: input.planId || null,
      subject: input.subject,
      channel: input.channel,
      dispatchedByName: input.dispatchedByName,
      contentSummary: input.contentSummary,
      reportTypeIncluded: input.reportTypeIncluded || null,
      evidenceLink: input.evidenceLink || null,
      sentAt: input.sentAt ? new Date(input.sentAt) : new Date(),
    },
  });

  // Atualizar data de último disparo no plano caso vinculado
  if (input.planId) {
    await prisma.communicationPlan.update({
      where: { id: input.planId },
      data: { lastDispatchedAt: new Date() },
    });
  }

  return log;
}

export async function getCommunicationLogs(teamId: string): Promise<CommunicationLogSummary[]> {
  const logs = await prisma.communicationLog.findMany({
    where: { teamId },
    include: {
      stakeholder: {
        select: {
          id: true,
          name: true,
          organization: true,
          group: true,
        },
      },
      feedbacks: {
        orderBy: { receivedAt: "desc" },
      },
    },
    orderBy: { sentAt: "desc" },
  });

  return logs as unknown as CommunicationLogSummary[];
}

export async function createCommunicationFeedback(
  teamId: string,
  input: CreateFeedbackInput
) {
  // Validar se o log pertence à equipe
  const log = await prisma.communicationLog.findFirst({
    where: { id: input.communicationLogId, teamId },
  });

  if (!log) {
    throw new Error("Registro de comunicação não encontrado ou não pertence a esta equipe.");
  }

  return prisma.communicationFeedback.create({
    data: {
      communicationLogId: input.communicationLogId,
      sentiment: input.sentiment,
      stakeholderResponse: input.stakeholderResponse,
      continuousImprovementAction: input.continuousImprovementAction || null,
      isAddressed: input.isAddressed ?? false,
    },
  });
}

export async function updateFeedbackAddressedStatus(
  teamId: string,
  feedbackId: string,
  isAddressed: boolean,
  actionText?: string
) {
  const feedback = await prisma.communicationFeedback.findUnique({
    where: { id: feedbackId },
    include: { communicationLog: true },
  });

  if (!feedback || feedback.communicationLog.teamId !== teamId) {
    throw new Error("Feedback não encontrado.");
  }

  return prisma.communicationFeedback.update({
    where: { id: feedbackId },
    data: {
      isAddressed,
      ...(actionText ? { continuousImprovementAction: actionText } : {}),
    },
  });
}

export async function getStakeholderMatrix(teamId: string): Promise<StakeholderMatrixItem[]> {
  const stakeholders = await prisma.stakeholder.findMany({
    where: { teamId },
    select: {
      id: true,
      name: true,
      organization: true,
      group: true,
      power: true,
      interest: true,
      currentEngagement: true,
      targetEngagement: true,
      preferredChannel: true,
      preferredFrequency: true,
    },
  });

  return stakeholders.map((item) => ({
    ...item,
    quadrant: mapQuadrant(item.power, item.interest),
  }));
}

export async function getCommunicationMetrics(teamId: string): Promise<CommunicationMetrics> {
  const [stakeholders, plansCount, dispatches, feedbacks] = await Promise.all([
    prisma.stakeholder.findMany({
      where: { teamId },
      select: { group: true, power: true, currentEngagement: true },
    }),
    prisma.communicationPlan.count({ where: { teamId } }),
    prisma.communicationLog.findMany({
      where: { teamId },
      select: { channel: true },
    }),
    prisma.communicationFeedback.findMany({
      where: { communicationLog: { teamId } },
      select: { isAddressed: true },
    }),
  ]);

  const scoreMap = {
    UNAWARE: 1,
    RESISTANT: 2,
    NEUTRAL: 3,
    SUPPORTIVE: 4,
    LEADING: 5,
  };

  const totalScore = stakeholders.reduce(
    (acc, s) => acc + (scoreMap[s.currentEngagement] || 3),
    0
  );
  const engagementAverageScore = stakeholders.length > 0 
    ? Number((totalScore / stakeholders.length).toFixed(1)) 
    : 0;

  const stakeholdersByGroup: Record<StakeholderGroup, number> = {
    SPONSORS: 0,
    SCHOOL_LEADERSHIP: 0,
    PARENTS_GUARDIANS: 0,
    TECHNICAL_MENTORS: 0,
    COMMUNITY_FANS: 0,
    COMPETITION_OFFICIALS: 0,
  };

  stakeholders.forEach((s) => {
    stakeholdersByGroup[s.group] = (stakeholdersByGroup[s.group] || 0) + 1;
  });

  const dispatchesByChannel: Record<CommunicationChannel, number> = {
    WHATSAPP: 0,
    EMAIL: 0,
    MEETING: 0,
    REPORT_PDF: 0,
  };

  dispatches.forEach((d) => {
    dispatchesByChannel[d.channel] = (dispatchesByChannel[d.channel] || 0) + 1;
  });

  const addressedFeedbacksCount = feedbacks.filter((f) => f.isAddressed).length;
  const pendingFeedbacksCount = feedbacks.length - addressedFeedbacksCount;
  const addressedFeedbacksPercent = feedbacks.length > 0
    ? Math.round((addressedFeedbacksCount / feedbacks.length) * 100)
    : 100;

  return {
    totalStakeholders: stakeholders.length,
    totalPlans: plansCount,
    totalDispatches: dispatches.length,
    engagementAverageScore,
    highPowerCount: stakeholders.filter((s) => s.power === "HIGH").length,
    pendingFeedbacksCount,
    addressedFeedbacksCount,
    addressedFeedbacksPercent,
    dispatchesByChannel,
    stakeholdersByGroup,
  };
}

export async function getReportDataPayload(teamId: string): Promise<ReportDataPayload> {
  const [team, transactions, returnActions, sponsors] = await Promise.all([
    prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    }),
    prisma.transaction.findMany({
      where: { teamId },
      select: {
        type: true,
        amountCents: true,
        budgetResource: {
          select: { acquisitionStrategy: true },
        },
      },
    }),
    prisma.returnAction.findMany({
      where: { teamId },
      include: {
        sponsor: { select: { name: true } },
      },
      orderBy: { date: "desc" },
      take: 10,
    }),
    prisma.sponsor.findMany({
      where: { teamId },
      include: {
        transactions: {
          where: { type: "ORIGIN" },
          select: { amountCents: true },
        },
        returnActions: {
          select: { returnCents: true },
        },
      },
    }),
  ]);

  let totalRevenueCents = 0;
  let totalExpenseCents = 0;
  let inKindTotalCents = 0;

  transactions.forEach((tx) => {
    if (tx.type === "ORIGIN") {
      totalRevenueCents += tx.amountCents;
    } else {
      totalExpenseCents += tx.amountCents;
    }
    if (tx.budgetResource?.acquisitionStrategy === "BARTER_PARTNERSHIP") {
      inKindTotalCents += tx.amountCents;
    }
  });

  const currentBalanceCents = totalRevenueCents - totalExpenseCents;
  const averageMonthlyBurn = totalExpenseCents > 0 ? Math.round(totalExpenseCents / 4) : 1;
  const projectedRunwayMonths = currentBalanceCents > 0
    ? Math.max(1, Math.round(currentBalanceCents / (averageMonthlyBurn || 1)))
    : 0;

  let totalDirectInvestmentCents = 0;
  let totalDeliveredValueCents = 0;

  const topSponsors = sponsors.map((sp) => {
    const investmentCents = sp.transactions.reduce((acc, tx) => acc + tx.amountCents, 0);
    const deliveredCents = sp.returnActions.reduce((acc, ra) => acc + ra.returnCents, 0);
    totalDirectInvestmentCents += investmentCents;
    totalDeliveredValueCents += deliveredCents;

    const ratio = investmentCents > 0 ? Number((deliveredCents / investmentCents).toFixed(2)) : 0;
    return {
      name: sp.name,
      tier: sp.tier,
      investmentCents,
      deliveredCents,
      ratio,
    };
  });

  const roiPercentage = totalDirectInvestmentCents > 0
    ? Math.round(((totalDeliveredValueCents - totalDirectInvestmentCents) / totalDirectInvestmentCents) * 100)
    : 100;

  return {
    teamName: team?.name || "Equipe Gênesis STEM",
    generatedAt: new Date(),
    financialMetrics: {
      totalRevenueCents,
      totalExpenseCents,
      currentBalanceCents,
      inKindTotalCents,
      projectedRunwayMonths,
    },
    roiMetrics: {
      totalDirectInvestmentCents,
      totalDeliveredValueCents,
      roiPercentage,
      topSponsors,
    },
    recentActions: returnActions.map((ra) => ({
      date: ra.date,
      title: ra.title,
      sponsorName: ra.sponsor.name,
      reachCount: ra.reachCount,
      valueCents: ra.returnCents,
    })),
  };
}
