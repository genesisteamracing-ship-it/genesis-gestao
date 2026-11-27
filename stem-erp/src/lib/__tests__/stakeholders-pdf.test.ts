import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildStakeholdersPdfData,
  buildStakeholdersPdfFilename,
  resolveStakeholderQuadrant,
  STAKEHOLDER_QUADRANT_CONFIG,
  STAKEHOLDERS_PDF_COLORS,
} from "../stakeholders-pdf-layout";
import { STATEMENT_PDF_COLORS } from "../financial-statement-pdf-layout";
import type { StakeholderWithRelations } from "@/types/communication";

function makeStakeholder(
  overrides: Partial<StakeholderWithRelations> & {
    id: string;
    name: string;
  }
): StakeholderWithRelations {
  return {
    teamId: "team-1",
    sponsorId: null,
    parentStakeholderId: null,
    organization: "Empresa Parceira",
    roleOrJobTitle: "Diretor",
    group: "SPONSORS",
    email: "contato@empresa.com",
    phone: "(11) 99999-0000",
    power: "HIGH",
    interest: "HIGH",
    currentEngagement: "SUPPORTIVE",
    targetEngagement: "LEADING",
    preferredChannel: "EMAIL",
    preferredFrequency: "MONTHLY",
    notes: null,
    createdAt: new Date("2026-10-01T12:00:00.000Z"),
    updatedAt: new Date("2026-10-01T12:00:00.000Z"),
    sponsor: null,
    plans: [],
    communications: [],
    ...overrides,
  };
}

describe("Matriz de Stakeholders Poder × Interesse PDF (buildStakeholdersPdfData)", () => {
  it("deve retornar matriz vazia quando não houver stakeholders", () => {
    const data = buildStakeholdersPdfData({
      stakeholders: [],
      teamName: "Equipe Gênesis",
    });

    assert.equal(data.totalStakeholders, 0);
    assert.equal(data.quadrants.KEEP_SATISFIED.length, 0);
    assert.equal(data.quadrants.MANAGE_CLOSELY.length, 0);
    assert.equal(data.quadrants.MONITOR.length, 0);
    assert.equal(data.quadrants.KEEP_INFORMED.length, 0);
    assert.equal(data.filterLabel, "Todos os Grupos");
  });

  it("deve manter paleta Azul e Amarelo no cabeçalho e cores translúcidas suaves nos 4 quadrantes", () => {
    assert.deepEqual(STAKEHOLDERS_PDF_COLORS, STATEMENT_PDF_COLORS);
    assert.equal(
      STAKEHOLDER_QUADRANT_CONFIG.KEEP_SATISFIED.title,
      "Manter satisfeito"
    );
    assert.equal(
      STAKEHOLDER_QUADRANT_CONFIG.MANAGE_CLOSELY.title,
      "Gerenciar de perto e envolver"
    );
    assert.equal(STAKEHOLDER_QUADRANT_CONFIG.MONITOR.title, "Monitorar");
    assert.equal(
      STAKEHOLDER_QUADRANT_CONFIG.KEEP_INFORMED.title,
      "Manter informado"
    );

    // Todos os fundos dos quadrantes devem ser translúcidos/claros (todos canais >= 210)
    for (const cfg of Object.values(STAKEHOLDER_QUADRANT_CONFIG)) {
      const [r, g, b] = cfg.bgColor;
      assert.ok(
        r >= 210 && g >= 210 && b >= 210,
        `Quadrante ${cfg.key} deve ter fundo translúcido claro`
      );
    }
  });

  it("deve distribuir stakeholders nos 4 quadrantes Poder × Interesse ordenados alfabeticamente", () => {
    assert.equal(resolveStakeholderQuadrant("HIGH", "HIGH"), "MANAGE_CLOSELY");
    assert.equal(resolveStakeholderQuadrant("HIGH", "LOW"), "KEEP_SATISFIED");
    assert.equal(resolveStakeholderQuadrant("LOW", "HIGH"), "KEEP_INFORMED");
    assert.equal(resolveStakeholderQuadrant("LOW", "LOW"), "MONITOR");

    const stakeholders: StakeholderWithRelations[] = [
      makeStakeholder({
        id: "st-1",
        name: "Ana Diretora",
        power: "HIGH",
        interest: "HIGH",
        currentEngagement: "LEADING",
        organization: "Tech Corp",
        roleOrJobTitle: "CEO",
      }),
      makeStakeholder({
        id: "st-2",
        name: "Bruno Conselho",
        power: "HIGH",
        interest: "LOW",
        currentEngagement: "RESISTANT",
        organization: "SESI",
        roleOrJobTitle: "Diretoria",
      }),
      makeStakeholder({
        id: "st-3",
        name: "Carlos Mentor",
        power: "LOW",
        interest: "HIGH",
        currentEngagement: "SUPPORTIVE",
        organization: "SENAI",
        roleOrJobTitle: "Instrutor",
      }),
      makeStakeholder({
        id: "st-4",
        name: "Daniela Apoio",
        power: "LOW",
        interest: "LOW",
        currentEngagement: "NEUTRAL",
        organization: null,
        roleOrJobTitle: null,
        group: "COMMUNITY_FANS",
      }),
    ];

    const data = buildStakeholdersPdfData({
      stakeholders,
      teamName: "Equipe Gênesis",
    });

    assert.equal(data.totalStakeholders, 4);
    assert.equal(data.quadrants.MANAGE_CLOSELY[0].name, "Ana Diretora");
    assert.equal(data.quadrants.MANAGE_CLOSELY[0].subtitle, "Tech Corp • CEO");
    assert.equal(
      data.quadrants.MANAGE_CLOSELY[0].engagementLabel,
      "Líder Defensor"
    );

    assert.equal(data.quadrants.KEEP_SATISFIED[0].name, "Bruno Conselho");
    assert.equal(data.quadrants.KEEP_INFORMED[0].name, "Carlos Mentor");
    assert.equal(data.quadrants.MONITOR[0].name, "Daniela Apoio");
    assert.equal(
      data.quadrants.MONITOR[0].subtitle,
      "Comunidade & Apoiadores"
    );
  });

  it("deve refletir o filtro de grupo e gerar nome de arquivo sanitizado", () => {
    const data = buildStakeholdersPdfData({
      stakeholders: [
        makeStakeholder({
          id: "st-1",
          name: "Maria Coordenadora",
          group: "SCHOOL_LEADERSHIP",
        }),
      ],
      groupFilter: "SCHOOL_LEADERSHIP",
    });

    assert.equal(data.filterLabel, "Direção & Coordenação Escolar");
    assert.equal(
      buildStakeholdersPdfFilename("Equipe Gênesis", new Date(2026, 10, 27)),
      "matriz-stakeholders-equipe-genesis-2026-11-27.pdf"
    );
  });
});
