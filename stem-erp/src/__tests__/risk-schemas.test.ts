import test from "node:test";
import assert from "node:assert/strict";
import {
  createRiskItemSchema,
  registerRiskReviewSchema,
  updateRiskItemSchema,
} from "../lib/risk-schemas";

test("createRiskItemSchema validates required fields and enum options including NONE", () => {
  const valid = createRiskItemSchema.safeParse({
    season: "2025/2026",
    entryType: "RISK",
    title: "Falta de filamento para impressão 3D",
    sector: "ENGINEERING_CAD",
    probability: "POSSIVEL",
    consequence: "MODERADA",
    proactiveStrategy: "Manter estoque mínimo de segurança",
    contingencyPlan: "Acionar fornecedor local de contingência",
    observations: "Monitorar estoque semanalmente",
  });

  assert.equal(valid.success, true);

  const validNone = createRiskItemSchema.safeParse({
    season: "2025/2026",
    entryType: "OPPORTUNITY",
    title: "Parceria técnica com universidade",
    sector: "MARKETING_SPONSOR",
    probability: "NONE",
    consequence: "NONE",
    evidenceNotes: "E-mail inicial enviado ao laboratório",
    evidenceUrl: "https://exemplo.com/evidencia",
  });

  assert.equal(validNone.success, true);
});

test("createRiskItemSchema rejects short title and invalid evidenceUrl", () => {
  const bad = createRiskItemSchema.safeParse({
    season: "2025/2026",
    entryType: "RISK",
    title: "Oi",
    sector: "ENGINEERING_CAD",
    probability: "RARA",
    consequence: "PEQUENA",
    evidenceUrl: "nao-e-url",
  });

  assert.equal(bad.success, false);
});

test("updateRiskItemSchema requires id", () => {
  const missingId = updateRiskItemSchema.safeParse({
    season: "2025/2026",
    entryType: "RISK",
    title: "Risco válido",
    sector: "PROJECT_MANAGEMENT",
    probability: "RARA",
    consequence: "PEQUENA",
  });

  assert.equal(missingId.success, false);
});

test("registerRiskReviewSchema validates review notes and new states", () => {
  const valid = registerRiskReviewSchema.safeParse({
    riskItemId: "risk-123",
    newProbability: "IMPROVAVEL",
    newConsequence: "PEQUENA",
    newStatus: "MITIGATED",
    notes: "Estoque de segurança adquirido e validado.",
    evidenceNotes: "Nota fiscal anexada",
  });

  assert.equal(valid.success, true);

  const emptyNotes = registerRiskReviewSchema.safeParse({
    riskItemId: "risk-123",
    newProbability: "IMPROVAVEL",
    newConsequence: "PEQUENA",
    newStatus: "MITIGATED",
    notes: "ok",
  });

  assert.equal(emptyNotes.success, false);
});
