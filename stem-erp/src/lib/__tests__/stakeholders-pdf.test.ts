import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildStakeholdersPdfData,
  buildStakeholdersPdfFilename,
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

describe("Diretório de Stakeholders PDF (buildStakeholdersPdfData)", () => {
  it("deve retornar relatório vazio quando não houver stakeholders", () => {
    const data = buildStakeholdersPdfData({
      stakeholders: [],
      teamName: "Equipe Gênesis",
    });

    assert.equal(data.totalStakeholders, 0);
    assert.equal(data.highPowerCount, 0);
    assert.equal(data.activeGroupCount, 0);
    assert.equal(data.rows.length, 0);
    assert.equal(data.filterLabel, "Todos os Grupos");
    assert.equal(data.teamDisplayName, "Equipe Gênesis");
  });

  it("deve seguir exatamente a paleta oficial Azul e Amarelo dos demais PDFs", () => {
    assert.deepEqual(STAKEHOLDERS_PDF_COLORS, STATEMENT_PDF_COLORS);
  });

  it("deve agrupar por grupo, ordenar por nível hierárquico e nome, e gerar subtotais e total geral", () => {
    const stakeholders: StakeholderWithRelations[] = [
      makeStakeholder({
        id: "st-3",
        name: "Carlos Mentor",
        group: "TECHNICAL_MENTORS",
        organization: "SENAI",
        roleOrJobTitle: "Instrutor CNC",
        power: "LOW",
        interest: "HIGH",
        currentEngagement: "LEADING",
        targetEngagement: "LEADING",
        preferredChannel: "WHATSAPP",
        preferredFrequency: "WEEKLY",
        email: null,
        phone: "(11) 98888-1111",
      }),
      makeStakeholder({
        id: "st-2",
        name: "Bruno Analista",
        group: "SPONSORS",
        organization: "Tech Corp",
        roleOrJobTitle: "Analista de Marketing",
        power: "LOW",
        interest: "LOW",
        currentEngagement: "RESISTANT",
        targetEngagement: "NEUTRAL",
        preferredChannel: "MEETING",
        preferredFrequency: "QUARTERLY",
      }),
      makeStakeholder({
        id: "st-1",
        name: "Ana Diretora",
        group: "SPONSORS",
        organization: "Tech Corp",
        roleOrJobTitle: "Diretora Executiva",
        power: "HIGH",
        interest: "HIGH",
        currentEngagement: "SUPPORTIVE",
        targetEngagement: "LEADING",
        preferredChannel: "REPORT_PDF",
        preferredFrequency: "BIWEEKLY",
        sponsor: { id: "sp-1", name: "Tech Corp", tier: "GOLD" },
      }),
    ];

    const data = buildStakeholdersPdfData({
      stakeholders,
      teamName: "Equipe Gênesis",
    });

    assert.equal(data.totalStakeholders, 3);
    assert.equal(data.highPowerCount, 1);
    assert.equal(data.activeGroupCount, 2);

    // 2 SPONSORS + 1 subtotal SPONSORS + 1 TECHNICAL_MENTORS + 1 subtotal TECHNICAL_MENTORS + 1 total geral = 6 linhas
    assert.equal(data.rows.length, 6);

    assert.equal(data.rows[0].kind, "STAKEHOLDER");
    assert.equal(data.rows[0].stakeholderPrimary, "Ana Diretora");
    assert.ok(data.rows[0].stakeholderSecondary.includes("Patrocinador GOLD"));
    assert.equal(data.rows[0].matrixPrimary, "Nível 1 · Estratégico");
    assert.equal(data.rows[0].engagementTone, "positive");
    assert.equal(data.rows[0].engagementSecondary, "Meta: Líder Defensor");
    assert.equal(data.rows[0].channelPrimary, "Relatório PDF");
    assert.equal(data.rows[0].channelSecondary, "Quinzenal");

    assert.equal(data.rows[1].kind, "STAKEHOLDER");
    assert.equal(data.rows[1].stakeholderPrimary, "Bruno Analista");
    assert.equal(data.rows[1].matrixPrimary, "Nível 4 · Base / Operacional");
    assert.equal(data.rows[1].engagementTone, "negative");

    assert.equal(data.rows[2].kind, "GROUP_SUBTOTAL");
    assert.equal(
      data.rows[2].stakeholderPrimary,
      "Subtotal • Patrocinadores Corporativos"
    );
    assert.equal(data.rows[2].matrixPrimary, "1 alto poder");
    assert.equal(data.rows[2].channelPrimary, "2 cadastros");

    assert.equal(data.rows[3].kind, "STAKEHOLDER");
    assert.equal(data.rows[3].stakeholderPrimary, "Carlos Mentor");
    assert.equal(data.rows[3].contactPrimary, "(11) 98888-1111");
    assert.equal(data.rows[3].contactSecondary, "");
    assert.equal(data.rows[3].engagementSecondary, "");

    assert.equal(data.rows[4].kind, "GROUP_SUBTOTAL");
    assert.equal(
      data.rows[4].stakeholderPrimary,
      "Subtotal • Mentores e técnicos"
    );
    assert.equal(data.rows[4].channelPrimary, "1 cadastro");

    assert.equal(data.rows[5].kind, "FINAL_TOTAL");
    assert.equal(
      data.rows[5].stakeholderPrimary,
      "T O T A L   D E   S T A K E H O L D E R S"
    );
    assert.equal(data.rows[5].channelPrimary, "3 cadastrados");
  });

  it("deve refletir o filtro de grupo no cabeçalho e gerar nome de arquivo sanitizado", () => {
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
      "stakeholders-equipe-genesis-2026-11-27.pdf"
    );
  });
});
