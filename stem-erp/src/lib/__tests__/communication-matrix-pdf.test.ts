import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
  CommunicationPlanSummary,
  StakeholderWithRelations,
} from "@/types/communication";
import { exportCommunicationMatrixToPdf } from "../communication-matrix-pdf-export";
import {
  buildCommunicationMatrixPdfData,
  buildCommunicationMatrixPdfFilename,
  COMMUNICATION_MATRIX_PDF_COLORS,
  resolveDefaultCommunicationApproach,
} from "../communication-matrix-pdf-layout";
import { STATEMENT_PDF_COLORS } from "../financial-statement-pdf-layout";

function makePlan(
  overrides: Partial<CommunicationPlanSummary> & { id: string; title: string },
): CommunicationPlanSummary {
  return {
    teamId: "team-1",
    stakeholderId: "st-1",
    channel: "EMAIL",
    frequency: "MONTHLY",
    customApproach: null,
    keyInformation: null,
    responsibleMemberId: null,
    responsibleMemberName: null,
    isActive: true,
    lastDispatchedAt: null,
    nextDispatchDate: null,
    createdAt: new Date("2026-10-01T12:00:00.000Z"),
    updatedAt: new Date("2026-10-01T12:00:00.000Z"),
    ...overrides,
  };
}

function makeStakeholder(
  overrides: Partial<StakeholderWithRelations> & { id: string; name: string },
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

describe("Matriz de Comunicação PDF Tabular (buildCommunicationMatrixPdfData)", () => {
  it("deve retornar matriz vazia quando não houver stakeholders", () => {
    const data = buildCommunicationMatrixPdfData({
      stakeholders: [],
      teamName: "Equipe Gênesis",
    });

    assert.equal(data.totalRows, 0);
    assert.equal(data.totalStakeholders, 0);
    assert.equal(data.rows.length, 0);
    assert.equal(data.filterLabel, "Todos os Grupos");
    assert.deepEqual(COMMUNICATION_MATRIX_PDF_COLORS, STATEMENT_PDF_COLORS);
  });

  it("deve ordenar por prioridade estratégica, expandir planos ativos e gerar abordagens padrão", () => {
    const stakeholders: StakeholderWithRelations[] = [
      makeStakeholder({
        id: "st-monitor",
        name: "Comunidade Geral",
        organization: null,
        roleOrJobTitle: null,
        group: "COMMUNITY_FANS",
        power: "LOW",
        interest: "LOW",
        currentEngagement: "NEUTRAL",
        targetEngagement: "NEUTRAL",
        preferredChannel: "WHATSAPP",
        preferredFrequency: "QUARTERLY",
      }),
      makeStakeholder({
        id: "st-informed",
        name: "Eduardo",
        organization: "Ansys",
        roleOrJobTitle: "Mentor CAE",
        group: "TECHNICAL_MENTORS",
        power: "LOW",
        interest: "HIGH",
        currentEngagement: "NEUTRAL",
        targetEngagement: "SUPPORTIVE",
        preferredChannel: "WHATSAPP",
        preferredFrequency: "MONTHLY",
        notes: "Validar simulações CFD antes das revisões semanais.",
      }),
      makeStakeholder({
        id: "st-satisfied",
        name: "Samara",
        organization: "SESI",
        roleOrJobTitle: "Diretora",
        group: "SCHOOL_LEADERSHIP",
        power: "HIGH",
        interest: "LOW",
        currentEngagement: "NEUTRAL",
        targetEngagement: "SUPPORTIVE",
        preferredChannel: "EMAIL",
        preferredFrequency: "BIWEEKLY",
      }),
      makeStakeholder({
        id: "st-manage",
        name: "Adam",
        organization: "SESI",
        roleOrJobTitle: "Técnico",
        group: "SPONSORS",
        power: "HIGH",
        interest: "HIGH",
        currentEngagement: "SUPPORTIVE",
        targetEngagement: "LEADING",
        preferredChannel: "EMAIL",
        preferredFrequency: "WEEKLY",
        plans: [
          makePlan({
            id: "pl-1",
            stakeholderId: "st-manage",
            title: "Report de Manufatura",
            channel: "REPORT_PDF",
            frequency: "WEEKLY",
            keyInformation: "Status CNC e cronograma crítico",
            responsibleMemberName: "Pedro (Gestor)",
            isActive: true,
          }),
          makePlan({
            id: "pl-2",
            stakeholderId: "st-manage",
            title: "Alinhamento Rápido",
            channel: "MEETING",
            frequency: "BIWEEKLY",
            isActive: true,
          }),
          makePlan({
            id: "pl-inactive",
            stakeholderId: "st-manage",
            title: "Plano Desativado",
            channel: "WHATSAPP",
            frequency: "MONTHLY",
            isActive: false,
          }),
        ],
      }),
    ];

    const data = buildCommunicationMatrixPdfData({
      stakeholders,
      teamName: "Equipe Gênesis",
    });

    assert.equal(data.totalStakeholders, 4);
    // st-manage expande 2 planos ativos + 3 outros stakeholders sem plano = 5 linhas
    assert.equal(data.totalRows, 5);
    assert.deepEqual(data.quadrantCounts, {
      MANAGE_CLOSELY: 1,
      KEEP_SATISFIED: 1,
      KEEP_INFORMED: 1,
      MONITOR: 1,
    });
    assert.deepEqual(data.channelCounts, {
      EMAIL: 1,
      WHATSAPP: 2,
      MEETING: 1,
      REPORT_PDF: 1,
    });

    // 1ª e 2ª linhas: Gerenciar de perto (Adam) com dois planos ativos
    assert.equal(data.rows[0].stakeholderName, "Adam");
    assert.equal(data.rows[0].strategyLabel, "Gerenciar de perto");
    assert.equal(data.rows[0].strategyTone, "red");
    assert.equal(data.rows[0].channelLabel, "Relatório PDF");
    assert.equal(data.rows[0].engagementPrimary, "Atual: Apoiador");
    assert.equal(data.rows[0].engagementSecondary, "Meta: Líder Defensor");
    assert.equal(
      data.rows[0].contentApproach,
      "Report de Manufatura - Status CNC e cronograma crítico",
    );
    assert.equal(data.rows[0].responsibleLabel, "Pedro (Gestor)");

    assert.equal(data.rows[1].stakeholderName, "Adam");
    assert.equal(data.rows[1].channelLabel, "Reunião");

    // 3ª linha: Manter satisfeito (Samara) com abordagem padrão preenchida
    assert.equal(data.rows[2].stakeholderName, "Samara");
    assert.equal(data.rows[2].strategyLabel, "Manter satisfeito");
    assert.equal(data.rows[2].strategyTone, "green");
    assert.equal(
      data.rows[2].contentApproach,
      resolveDefaultCommunicationApproach("SCHOOL_LEADERSHIP", "HIGH", "LOW"),
    );

    // 4ª linha: Manter informado (Eduardo) usando notes
    assert.equal(data.rows[3].stakeholderName, "Eduardo");
    assert.equal(data.rows[3].strategyLabel, "Manter informado");
    assert.equal(data.rows[3].strategyTone, "blue");
    assert.equal(
      data.rows[3].contentApproach,
      "Validar simulações CFD antes das revisões semanais.",
    );

    // 5ª linha: Monitorar (Comunidade Geral) sem gap de engajamento
    assert.equal(data.rows[4].stakeholderName, "Comunidade Geral");
    assert.equal(data.rows[4].strategyLabel, "Monitorar");
    assert.equal(data.rows[4].engagementPrimary, "Neutro");
    assert.equal(data.rows[4].engagementSecondary, null);
  });

  it("deve aplicar filtro por grupo e gerar nome de arquivo sanitizado", () => {
    const data = buildCommunicationMatrixPdfData({
      stakeholders: [
        makeStakeholder({
          id: "st-1",
          name: "Diretora",
          group: "SCHOOL_LEADERSHIP",
        }),
        makeStakeholder({
          id: "st-2",
          name: "Patrocinador",
          group: "SPONSORS",
        }),
      ],
      groupFilter: "SCHOOL_LEADERSHIP",
    });

    assert.equal(data.filterLabel, "Direção & Coordenação Escolar");
    assert.equal(data.totalStakeholders, 1);
    assert.equal(data.rows[0].stakeholderName, "Diretora");
    assert.equal(
      buildCommunicationMatrixPdfFilename("Equipe Gênesis", new Date(2026, 10, 28)),
      "matriz-comunicacao-equipe-genesis-2026-11-28.pdf",
    );
  });

  it("deve rejeitar exportação PDF quando lista de stakeholders estiver vazia", async () => {
    await assert.rejects(
      () => exportCommunicationMatrixToPdf({ stakeholders: [] }),
      /Não há stakeholders cadastrados/,
    );
  });
});
