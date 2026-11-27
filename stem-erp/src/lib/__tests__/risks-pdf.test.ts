import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildRisksPdfData,
  buildRisksPdfFilename,
  RISKS_PDF_COLORS,
} from "../risks-pdf-layout";
import { STATEMENT_PDF_COLORS } from "../financial-statement-pdf-layout";
import type { RiskItemDTO } from "@/types/risks";

function makeRisk(
  overrides: Partial<RiskItemDTO> & {
    id: string;
    title: string;
  }
): RiskItemDTO {
  return {
    teamId: "team-1",
    season: "2026/2027",
    entryType: "RISK",
    description: null,
    sector: "MANUFACTURING_CNC",
    probability: "POSSIVEL",
    consequence: "GRANDE",
    priorityScore: 12,
    priorityLevel: "HIGH",
    proactiveStrategy: null,
    contingencyPlan: null,
    observations: null,
    evidenceNotes: null,
    evidenceUrl: null,
    status: "IDENTIFIED",
    ownerName: null,
    ownerUserId: null,
    reviewsCount: 0,
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("Matriz de Riscos PDF (buildRisksPdfData)", () => {
  it("deve retornar dados vazios quando não houver riscos cadastrados", () => {
    const data = buildRisksPdfData({
      items: [],
      teamName: "Equipe Gênesis",
      seasonLabel: "2026/2027",
    });

    assert.equal(data.totalCount, 0);
    assert.equal(data.criticalCount, 0);
    assert.equal(data.highCount, 0);
    assert.equal(data.mediumCount, 0);
    assert.equal(data.lowCount, 0);
    assert.equal(data.rows.length, 0);
    assert.equal(data.teamDisplayName, "Equipe Gênesis");
    assert.equal(data.seasonLabel, "2026/2027");
  });

  it("deve seguir exatamente a paleta oficial Azul e Amarelo dos demais PDFs", () => {
    assert.deepEqual(RISKS_PDF_COLORS, STATEMENT_PDF_COLORS);
  });

  it("deve ordenar por score decrescente, contar severidades e resolver observações e tons dos badges", () => {
    const items: RiskItemDTO[] = [
      makeRisk({
        id: "r-low",
        title: "Quebra de equipamentos",
        sector: "PROJECT_MANAGEMENT",
        probability: "IMPROVAVEL",
        consequence: "MODERADA",
        priorityScore: 6,
        priorityLevel: "MEDIUM",
        observations: null,
        proactiveStrategy: "Manutenção preventiva",
      }),
      makeRisk({
        id: "r-crit",
        title: "Falha crítica na usinagem CNC",
        sector: "MANUFACTURING_CNC",
        probability: "PROVAVEL",
        consequence: "CATASTROFICA",
        priorityScore: 20,
        priorityLevel: "CRITICAL",
        observations: "Validar reserva de blocos",
        reviewsCount: 2,
      }),
      makeRisk({
        id: "r-high",
        title: "Falta de orçamento",
        sector: "MARKETING_SPONSOR",
        probability: "POSSIVEL",
        consequence: "GRANDE",
        priorityScore: 12,
        priorityLevel: "HIGH",
        observations: null,
      }),
    ];

    const data = buildRisksPdfData({
      items,
      teamName: "Equipe Gênesis",
    });

    assert.equal(data.totalCount, 3);
    assert.equal(data.criticalCount, 1);
    assert.equal(data.highCount, 1);
    assert.equal(data.mediumCount, 1);
    assert.equal(data.lowCount, 0);
    assert.equal(data.rows.length, 3);

    // 1º: Crítico (score 20)
    assert.equal(data.rows[0].title, "Falha crítica na usinagem CNC");
    assert.equal(data.rows[0].sectorLabel, "Manufatura");
    assert.equal(data.rows[0].probabilityLabel, "Provável");
    assert.equal(data.rows[0].probabilityTone, "red");
    assert.equal(data.rows[0].consequenceLabel, "Catastrófica");
    assert.equal(data.rows[0].consequenceTone, "red");
    assert.equal(data.rows[0].priorityLabel, "Crítico");
    assert.equal(data.rows[0].priorityTone, "red");
    assert.equal(data.rows[0].observations, "Validar reserva de blocos");
    assert.ok(data.rows[0].subtitle.includes("2 revisão(ões)"));

    // 2º: Alto (score 12)
    assert.equal(data.rows[1].title, "Falta de orçamento");
    assert.equal(data.rows[1].sectorLabel, "Marketing");
    assert.equal(data.rows[1].priorityTone, "amber");
    assert.equal(data.rows[1].observations, "—");

    // 3º: Médio (score 6)
    assert.equal(data.rows[2].title, "Quebra de equipamentos");
    assert.equal(data.rows[2].sectorLabel, "Gestão");
    assert.equal(data.rows[2].probabilityTone, "green");
    assert.equal(data.rows[2].consequenceTone, "amber");
    assert.equal(data.rows[2].priorityTone, "blue");
    assert.equal(data.rows[2].observations, "Manutenção preventiva");
  });

  it("deve gerar nome de arquivo sanitizado com data", () => {
    assert.equal(
      buildRisksPdfFilename("Equipe Gênesis", new Date(2026, 10, 27)),
      "matriz-riscos-equipe-genesis-2026-11-27.pdf"
    );
  });
});
