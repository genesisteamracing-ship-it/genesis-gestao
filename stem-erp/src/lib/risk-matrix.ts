import type {
  RiskConsequence,
  RiskEntryType,
  RiskLifecycleStatus,
  RiskPriorityLevel,
  RiskProbability,
} from "@prisma/client";
import type {
  CartesianPoint,
  DistributionSlice,
  RiskItemDTO,
} from "@/types/risks";

export const RISK_PROBABILITY_ORDER: readonly RiskProbability[] = [
  "QUASE_CERTO",
  "PROVAVEL",
  "POSSIVEL",
  "IMPROVAVEL",
  "RARA",
  "NONE",
] as const;

export const RISK_CONSEQUENCE_ORDER: readonly RiskConsequence[] = [
  "CATASTROFICA",
  "GRANDE",
  "MODERADA",
  "PEQUENA",
  "DESPREZIVEL",
  "NONE",
] as const;

export const RISK_PROBABILITY_LABELS: Record<RiskProbability, string> = {
  QUASE_CERTO: "Quase certo",
  PROVAVEL: "Provável",
  POSSIVEL: "Possível",
  IMPROVAVEL: "Improvável",
  RARA: "Rara",
  NONE: "None",
};

export const RISK_CONSEQUENCE_LABELS: Record<RiskConsequence, string> = {
  CATASTROFICA: "Catastrófica",
  GRANDE: "Grande",
  MODERADA: "Moderada",
  PEQUENA: "Pequena",
  DESPREZIVEL: "Desprezível",
  NONE: "None",
};

export const RISK_ENTRY_TYPE_LABELS: Record<RiskEntryType, string> = {
  RISK: "Risco",
  OPPORTUNITY: "Oportunidade",
};

export const RISK_STATUS_LABELS: Record<RiskLifecycleStatus, string> = {
  IDENTIFIED: "Identificado",
  MONITORING: "Em monitoramento",
  MITIGATED: "Mitigado",
  OCCURRED: "Ocorrido",
  CLOSED: "Encerrado",
};

export const RISK_PRIORITY_LABELS: Record<RiskPriorityLevel, string> = {
  CRITICAL: "Crítico",
  HIGH: "Alto",
  MEDIUM: "Médio",
  LOW: "Baixo",
  UNASSESSED: "Não avaliado",
};

export const PROBABILITY_WEIGHTS: Record<RiskProbability, number> = {
  NONE: 0,
  RARA: 1,
  IMPROVAVEL: 2,
  POSSIVEL: 3,
  PROVAVEL: 4,
  QUASE_CERTO: 5,
};

export const CONSEQUENCE_WEIGHTS: Record<RiskConsequence, number> = {
  NONE: 0,
  DESPREZIVEL: 1,
  PEQUENA: 2,
  MODERADA: 3,
  GRANDE: 4,
  CATASTROFICA: 5,
};

const PROBABILITY_TONES: Record<RiskProbability, DistributionSlice["tone"]> = {
  QUASE_CERTO: "critical",
  PROVAVEL: "high",
  POSSIVEL: "medium",
  IMPROVAVEL: "info",
  RARA: "low",
  NONE: "muted",
};

const CONSEQUENCE_TONES: Record<RiskConsequence, DistributionSlice["tone"]> = {
  CATASTROFICA: "critical",
  GRANDE: "high",
  MODERADA: "medium",
  PEQUENA: "info",
  DESPREZIVEL: "low",
  NONE: "muted",
};

export function calculateRiskPriority(
  probability: RiskProbability,
  consequence: RiskConsequence
): { score: number; level: RiskPriorityLevel } {
  const probWeight = PROBABILITY_WEIGHTS[probability];
  const consWeight = CONSEQUENCE_WEIGHTS[consequence];

  if (probWeight === 0 || consWeight === 0) {
    return { score: 0, level: "UNASSESSED" };
  }

  const score = probWeight * consWeight;
  if (score >= 15) return { score, level: "CRITICAL" };
  if (score >= 9) return { score, level: "HIGH" };
  if (score >= 4) return { score, level: "MEDIUM" };
  return { score, level: "LOW" };
}

function buildDistribution<T extends string>(
  keys: readonly T[],
  counts: Map<T, number>,
  total: number,
  labels: Record<T, string>,
  tones: Record<T, DistributionSlice["tone"]>
): DistributionSlice[] {
  return keys.map((key) => {
    const count = counts.get(key) ?? 0;
    const percentage = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
    return {
      key,
      label: labels[key],
      count,
      percentage,
      tone: tones[key],
    };
  });
}

export function buildProbabilityDistribution(
  items: Pick<RiskItemDTO, "probability">[]
): DistributionSlice[] {
  const counts = new Map<RiskProbability, number>();
  for (const item of items) {
    counts.set(item.probability, (counts.get(item.probability) ?? 0) + 1);
  }
  return buildDistribution(
    RISK_PROBABILITY_ORDER,
    counts,
    items.length,
    RISK_PROBABILITY_LABELS,
    PROBABILITY_TONES
  );
}

export function buildConsequenceDistribution(
  items: Pick<RiskItemDTO, "consequence">[]
): DistributionSlice[] {
  const counts = new Map<RiskConsequence, number>();
  for (const item of items) {
    counts.set(item.consequence, (counts.get(item.consequence) ?? 0) + 1);
  }
  return buildDistribution(
    RISK_CONSEQUENCE_ORDER,
    counts,
    items.length,
    RISK_CONSEQUENCE_LABELS,
    CONSEQUENCE_TONES
  );
}

const JITTER_OFFSETS: ReadonlyArray<[number, number]> = [
  [0, 0],
  [0.16, 0.14],
  [-0.16, -0.14],
  [0.16, -0.14],
  [-0.16, 0.14],
  [0.24, 0],
  [-0.24, 0],
  [0, 0.24],
  [0, -0.24],
];

export function buildCartesianPoints(items: RiskItemDTO[]): CartesianPoint[] {
  const buckets = new Map<string, RiskItemDTO[]>();

  for (const item of items) {
    const key = `${item.probability}:${item.consequence}`;
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  const points: CartesianPoint[] = [];

  for (const group of buckets.values()) {
    const groupCount = group.length;
    group.forEach((item, index) => {
      const baseX = CONSEQUENCE_WEIGHTS[item.consequence];
      const baseY = PROBABILITY_WEIGHTS[item.probability];
      const [dx, dy] =
        groupCount > 1
          ? JITTER_OFFSETS[index % JITTER_OFFSETS.length]
          : [0, 0];

      points.push({
        id: item.id,
        title: item.title,
        entryType: item.entryType,
        sector: item.sector,
        probability: item.probability,
        consequence: item.consequence,
        priorityLevel: item.priorityLevel,
        priorityScore: item.priorityScore,
        x: Number((baseX + dx).toFixed(2)),
        y: Number((baseY + dy).toFixed(2)),
        z: Math.max(80, Math.min(220, item.priorityScore * 8 + 80)),
        groupCount,
      });
    });
  }

  return points;
}
