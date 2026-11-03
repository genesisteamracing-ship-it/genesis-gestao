import {
  COMMUNICATION_FREQUENCY_LABELS,
  HIERARCHY_TIER_META,
  STAKEHOLDER_GROUP_LABELS,
} from "@/lib/communication-constants";
import type {
  EngagementLevel,
  HierarchyTier,
  OrgMapActionCardDTO,
  OrgMapPartnerBranch,
  OrgMapStakeholderNode,
  StakeholderInterest,
  StakeholderOrgMapTree,
  StakeholderPower,
  StakeholderWithRelations,
} from "@/types/communication";

const ENGAGEMENT_SCORE: Record<EngagementLevel, number> = {
  UNAWARE: 1,
  RESISTANT: 2,
  NEUTRAL: 3,
  SUPPORTIVE: 4,
  LEADING: 5,
};

export function computeHierarchyTier(
  power: StakeholderPower,
  interest: StakeholderInterest
): { tier: HierarchyTier; rankWeight: 4 | 3 | 2 | 1; label: string } {
  if (power === "HIGH" && interest === "HIGH") {
    return {
      tier: "TIER_1_STRATEGIC",
      rankWeight: 4,
      label: HIERARCHY_TIER_META.TIER_1_STRATEGIC.badgeLabel,
    };
  }
  if (power === "HIGH" && interest === "LOW") {
    return {
      tier: "TIER_2_INSTITUTIONAL",
      rankWeight: 3,
      label: HIERARCHY_TIER_META.TIER_2_INSTITUTIONAL.badgeLabel,
    };
  }
  if (power === "LOW" && interest === "HIGH") {
    return {
      tier: "TIER_3_TACTICAL",
      rankWeight: 2,
      label: HIERARCHY_TIER_META.TIER_3_TACTICAL.badgeLabel,
    };
  }
  return {
    tier: "TIER_4_OPERATIONAL",
    rankWeight: 1,
    label: HIERARCHY_TIER_META.TIER_4_OPERATIONAL.badgeLabel,
  };
}

export function resolvePartnerInfo(stakeholder: StakeholderWithRelations): {
  partnerKey: string;
  partnerName: string;
} {
  const rawName =
    stakeholder.sponsor?.name?.trim() ||
    stakeholder.organization?.trim() ||
    STAKEHOLDER_GROUP_LABELS[stakeholder.group];

  const partnerKey = rawName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return {
    partnerKey: partnerKey || stakeholder.group.toLowerCase(),
    partnerName: rawName,
  };
}

function buildActionCards(stakeholder: StakeholderWithRelations): OrgMapActionCardDTO[] {
  const currentScore = ENGAGEMENT_SCORE[stakeholder.currentEngagement] || 3;
  const targetScore = ENGAGEMENT_SCORE[stakeholder.targetEngagement] || 4;
  const baseProgress = Math.min(
    100,
    Math.max(25, Math.round((currentScore / Math.max(1, targetScore)) * 85))
  );

  const activePlans = (stakeholder.plans || []).filter((p) => p.isActive);
  if (activePlans.length > 0) {
    return activePlans.slice(0, 3).map((plan) => ({
      id: plan.id,
      title: plan.title,
      statusLabel: plan.lastDispatchedAt
        ? "Em Execução · Ativo"
        : `Em Andamento · ${COMMUNICATION_FREQUENCY_LABELS[plan.frequency]}`,
      channel: plan.channel,
      frequency: plan.frequency,
      progressPercent: plan.lastDispatchedAt ? Math.min(100, baseProgress + 15) : baseProgress,
      isPlanBacked: true,
    }));
  }

  return [
    {
      id: `auto-plan-${stakeholder.id}`,
      title: stakeholder.notes?.trim()
        ? stakeholder.notes.trim().slice(0, 68)
        : `Alinhamento ${COMMUNICATION_FREQUENCY_LABELS[stakeholder.preferredFrequency]} com ${stakeholder.name}`,
      statusLabel: `Cadência ${COMMUNICATION_FREQUENCY_LABELS[stakeholder.preferredFrequency]}`,
      channel: stakeholder.preferredChannel,
      frequency: stakeholder.preferredFrequency,
      progressPercent: baseProgress,
      isPlanBacked: false,
    },
  ];
}

function wouldCreateCycle(
  childId: string,
  candidateParentId: string,
  parentMap: Map<string, string | null>
): boolean {
  let cursor: string | null = candidateParentId;
  const visited = new Set<string>([childId]);
  while (cursor) {
    if (visited.has(cursor)) return true;
    visited.add(cursor);
    cursor = parentMap.get(cursor) ?? null;
  }
  return false;
}

function assignDepthsRecursively(node: OrgMapStakeholderNode, depth: number): void {
  node.depth = depth;
  for (const child of node.children) {
    assignDepthsRecursively(child, depth + 1);
  }
}

export function buildStakeholderHierarchyTree(params: {
  teamName: string;
  stakeholders: StakeholderWithRelations[];
  searchQuery?: string;
  partnerFilter?: string;
}): StakeholderOrgMapTree {
  const { teamName, stakeholders, searchQuery = "", partnerFilter = "ALL" } = params;
  const normalizedQuery = searchQuery.trim().toLowerCase();

  // 1. Filtrar stakeholders caso haja busca textual
  const matchingStakeholders = normalizedQuery
    ? stakeholders.filter((s) => {
        const partner = resolvePartnerInfo(s);
        return (
          s.name.toLowerCase().includes(normalizedQuery) ||
          (s.roleOrJobTitle || "").toLowerCase().includes(normalizedQuery) ||
          partner.partnerName.toLowerCase().includes(normalizedQuery) ||
          STAKEHOLDER_GROUP_LABELS[s.group].toLowerCase().includes(normalizedQuery)
        );
      })
    : stakeholders;

  // 2. Agrupar por Parceiro/Organização
  const groupedByPartner = new Map<
    string,
    {
      partnerName: string;
      sponsorId: string | null;
      sponsorTier: string | null;
      items: StakeholderWithRelations[];
    }
  >();

  for (const item of matchingStakeholders) {
    const { partnerKey, partnerName } = resolvePartnerInfo(item);
    if (partnerFilter !== "ALL" && partnerKey !== partnerFilter) {
      continue;
    }

    const existing = groupedByPartner.get(partnerKey);
    if (!existing) {
      groupedByPartner.set(partnerKey, {
        partnerName,
        sponsorId: item.sponsor?.id || item.sponsorId || null,
        sponsorTier: item.sponsor?.tier || null,
        items: [item],
      });
    } else {
      existing.items.push(item);
      if (!existing.sponsorId && (item.sponsor?.id || item.sponsorId)) {
        existing.sponsorId = item.sponsor?.id || item.sponsorId || null;
        existing.sponsorTier = item.sponsor?.tier || null;
      }
    }
  }

  const partners: OrgMapPartnerBranch[] = [];
  const activeGroups = new Set<string>();
  let totalPlans = 0;
  let totalLogs = 0;

  for (const [partnerKey, groupData] of groupedByPartner.entries()) {
    // Ordenar os stakeholders do parceiro por peso de Poder/Interesse decrescente, depois engajamento, depois nome
    const sortedItems = [...groupData.items].sort((a, b) => {
      const rankA = computeHierarchyTier(a.power, a.interest).rankWeight;
      const rankB = computeHierarchyTier(b.power, b.interest).rankWeight;
      if (rankB !== rankA) return rankB - rankA;

      const engA = ENGAGEMENT_SCORE[a.currentEngagement] || 3;
      const engB = ENGAGEMENT_SCORE[b.currentEngagement] || 3;
      if (engB !== engA) return engB - engA;

      return a.name.localeCompare(b.name, "pt-BR");
    });

    const nodeMap = new Map<string, OrgMapStakeholderNode>();
    const parentLookup = new Map<string, string | null>();

    for (const s of sortedItems) {
      activeGroups.add(s.group);
      const { tier, rankWeight } = computeHierarchyTier(s.power, s.interest);
      nodeMap.set(s.id, {
        id: s.id,
        stakeholder: s,
        partnerKey,
        partnerName: groupData.partnerName,
        tier,
        rankWeight,
        depth: 1,
        children: [],
        actionCards: buildActionCards(s),
      });
      parentLookup.set(s.id, s.parentStakeholderId ?? null);
    }

    // 3. Resolver vínculos explícitos (`parentStakeholderId`) dentro do mesmo parceiro
    const attachedNodeIds = new Set<string>();
    for (const s of sortedItems) {
      const explicitParentId = s.parentStakeholderId;
      if (
        explicitParentId &&
        explicitParentId !== s.id &&
        nodeMap.has(explicitParentId) &&
        !wouldCreateCycle(s.id, explicitParentId, parentLookup)
      ) {
        const parentNode = nodeMap.get(explicitParentId)!;
        const childNode = nodeMap.get(s.id)!;
        parentNode.children.push(childNode);
        attachedNodeIds.add(s.id);
      }
    }

    // 4. Para os nós sem pai explícito no parceiro, encadear verticalmente pelos degraus de Poder e Interesse
    // Ex: SESI -> Diretoria (Peso 4) -> Técnicos (Peso 2) -> Professores (Peso 1)
    const unattachedNodes = sortedItems
      .filter((s) => !attachedNodeIds.has(s.id))
      .map((s) => nodeMap.get(s.id)!);

    const distinctWeights = Array.from(
      new Set(unattachedNodes.map((n) => n.rankWeight))
    ).sort((a, b) => b - a);

    const rootNodes: OrgMapStakeholderNode[] = [];

    if (distinctWeights.length > 0) {
      const topWeight = distinctWeights[0];
      const topTierNodes = unattachedNodes.filter((n) => n.rankWeight === topWeight);
      rootNodes.push(...topTierNodes);

      let previousTierRepresentative = topTierNodes[0];
      for (let i = 1; i < distinctWeights.length; i++) {
        const currentWeight = distinctWeights[i];
        const currentTierNodes = unattachedNodes.filter(
          (n) => n.rankWeight === currentWeight
        );
        if (previousTierRepresentative && currentTierNodes.length > 0) {
          previousTierRepresentative.children.push(...currentTierNodes);
          previousTierRepresentative = currentTierNodes[0];
        }
      }
    }

    for (const root of rootNodes) {
      assignDepthsRecursively(root, 1);
    }

    const branchPlans = sortedItems.reduce(
      (acc, s) => acc + (s.plans?.filter((p) => p.isActive).length || 0),
      0
    );
    const branchLogs = sortedItems.reduce(
      (acc, s) => acc + (s.communications?.length || 0),
      0
    );
    totalPlans += branchPlans;
    totalLogs += branchLogs;

    partners.push({
      partnerKey,
      partnerName: groupData.partnerName,
      sponsorId: groupData.sponsorId,
      sponsorTier: groupData.sponsorTier,
      primaryGroup: sortedItems[0]?.group ?? "SPONSORS",
      totalStakeholders: sortedItems.length,
      totalActivePlans: branchPlans,
      totalLogs: branchLogs,
      highPowerCount: sortedItems.filter((s) => s.power === "HIGH").length,
      rootNodes,
    });
  }

  // Ordenar ramos de parceiros: maior poder e mais stakeholders primeiro
  partners.sort((a, b) => {
    if (b.highPowerCount !== a.highPowerCount) {
      return b.highPowerCount - a.highPowerCount;
    }
    if (b.totalStakeholders !== a.totalStakeholders) {
      return b.totalStakeholders - a.totalStakeholders;
    }
    return a.partnerName.localeCompare(b.partnerName, "pt-BR");
  });

  return {
    teamName,
    totalPartners: partners.length,
    totalGroupsActive: activeGroups.size,
    totalStakeholders: partners.reduce((acc, p) => acc + p.totalStakeholders, 0),
    totalPlans,
    totalLogs,
    partners,
  };
}
