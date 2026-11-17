import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCartesianPoints,
  buildConsequenceDistribution,
  buildProbabilityDistribution,
  calculateRiskPriority,
} from "../lib/risk-matrix";
import type { RiskItemDTO } from "../types/risks";

function makeRisk(overrides: Partial<RiskItemDTO> = {}): RiskItemDTO {
  return {
    id: "risk-1",
    teamId: "team-1",
    season: "2025/2026",
    entryType: "RISK",
    title: "Atraso na usinagem CNC",
    description: null,
    sector: "MANUFACTURING_CNC",
    probability: "PROVAVEL",
    consequence: "GRANDE",
    priorityScore: 16,
    priorityLevel: "CRITICAL",
    proactiveStrategy: null,
    contingencyPlan: null,
    observations: null,
    evidenceNotes: null,
    evidenceUrl: null,
    status: "IDENTIFIED",
    ownerName: null,
    ownerUserId: null,
    reviewsCount: 0,
    createdAt: "2026-11-12T10:00:00.000Z",
    updatedAt: "2026-11-12T10:00:00.000Z",
    ...overrides,
  };
}

test("calculateRiskPriority computes 5x5 levels and handles None", () => {
  assert.deepEqual(calculateRiskPriority("QUASE_CERTO", "CATASTROFICA"), {
    score: 25,
    level: "CRITICAL",
  });
  assert.deepEqual(calculateRiskPriority("PROVAVEL", "MODERADA"), {
    score: 12,
    level: "HIGH",
  });
  assert.deepEqual(calculateRiskPriority("IMPROVAVEL", "MODERADA"), {
    score: 6,
    level: "MEDIUM",
  });
  assert.deepEqual(calculateRiskPriority("RARA", "PEQUENA"), {
    score: 2,
    level: "LOW",
  });
  assert.deepEqual(calculateRiskPriority("NONE", "CATASTROFICA"), {
    score: 0,
    level: "UNASSESSED",
  });
  assert.deepEqual(calculateRiskPriority("PROVAVEL", "NONE"), {
    score: 0,
    level: "UNASSESSED",
  });
});

test("buildProbabilityDistribution and buildConsequenceDistribution sum to 100%", () => {
  const items = [
    makeRisk({ id: "1", probability: "QUASE_CERTO", consequence: "CATASTROFICA" }),
    makeRisk({ id: "2", probability: "PROVAVEL", consequence: "MODERADA" }),
    makeRisk({ id: "3", probability: "NONE", consequence: "NONE" }),
    makeRisk({ id: "4", probability: "RARA", consequence: "DESPREZIVEL" }),
  ];

  const probDist = buildProbabilityDistribution(items);
  const consDist = buildConsequenceDistribution(items);

  assert.equal(probDist.length, 6);
  assert.equal(consDist.length, 6);

  const probPctSum = probDist.reduce((acc, s) => acc + s.percentage, 0);
  const consPctSum = consDist.reduce((acc, s) => acc + s.percentage, 0);

  assert.equal(probPctSum, 100);
  assert.equal(consPctSum, 100);
  assert.equal(probDist.find((s) => s.key === "NONE")?.count, 1);
  assert.equal(consDist.find((s) => s.key === "NONE")?.count, 1);
});

test("buildCartesianPoints maps coordinates and separates overlapping items", () => {
  const items = [
    makeRisk({ id: "r1", probability: "PROVAVEL", consequence: "GRANDE" }),
    makeRisk({ id: "r2", probability: "PROVAVEL", consequence: "GRANDE" }),
    makeRisk({ id: "r3", probability: "NONE", consequence: "NONE", priorityScore: 0, priorityLevel: "UNASSESSED" }),
  ];

  const points = buildCartesianPoints(items);
  assert.equal(points.length, 3);

  const p1 = points.find((p) => p.id === "r1");
  const p2 = points.find((p) => p.id === "r2");
  const p3 = points.find((p) => p.id === "r3");

  assert.ok(p1 && p2 && p3);
  assert.equal(p1.groupCount, 2);
  assert.equal(p2.groupCount, 2);
  assert.notEqual(`${p1.x},${p1.y}`, `${p2.x},${p2.y}`);
  assert.equal(p3.x, 0);
  assert.equal(p3.y, 0);
});
