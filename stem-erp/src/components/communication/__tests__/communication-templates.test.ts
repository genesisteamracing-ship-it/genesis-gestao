import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatCurrency,
  getGreetingForGroup,
  generateCommunicationReport,
} from "../../../lib/communication-templates";
import type { ReportDataPayload } from "../../../types/communication";

describe("Communication Templates Generator", () => {
  it("deve formatar valores em centavos para a moeda brasileira (R$)", () => {
    assert.match(formatCurrency(150000), /R\$\s?1\.500,00/);
    assert.match(formatCurrency(0), /R\$\s?0,00/);
    assert.match(formatCurrency(4550), /R\$\s?45,50/);
  });

  it("deve personalizar a saudação de acordo com o grupo do stakeholder", () => {
    const spGreeting = getGreetingForGroup("SPONSORS", "Roberto");
    assert.ok(spGreeting.includes("Prezado(a) Roberto"));

    const schoolGreeting = getGreetingForGroup("SCHOOL_LEADERSHIP", "Prof. Alberto");
    assert.ok(schoolGreeting.includes("Prezada Direção"));
    assert.ok(schoolGreeting.includes("Prof. Alberto"));

    const parentsGreeting = getGreetingForGroup("PARENTS_GUARDIANS", "Mariana");
    assert.ok(parentsGreeting.includes("Olá Mariana, pais e familiares"));

    const mentorGreeting = getGreetingForGroup("TECHNICAL_MENTORS", "Eng. Carlos");
    assert.ok(mentorGreeting.includes("Fala Eng. Carlos, mentor(a)!"));

    const officialGreeting = getGreetingForGroup("COMPETITION_OFFICIALS", "Comissão F1");
    assert.ok(officialGreeting.includes("Prezada Comissão Organizadora"));
  });

  it("deve gerar mensagem para WhatsApp e E-mail com dados de balanço financeiro", () => {
    const mockData: ReportDataPayload = {
      teamName: "Equipe Gênesis STEM",
      generatedAt: new Date("2026-10-27T10:00:00Z"),
      financialMetrics: {
        totalRevenueCents: 1200000,
        totalExpenseCents: 450000,
        currentBalanceCents: 750000,
        inKindTotalCents: 200000,
        projectedRunwayMonths: 5,
      },
      roiMetrics: {
        totalDirectInvestmentCents: 1000000,
        totalDeliveredValueCents: 2500000,
        roiPercentage: 150,
        topSponsors: [],
      },
      recentActions: [],
    };

    const res = generateCommunicationReport({
      recipientName: "Diretor Marcos",
      recipientPhone: "11987654321",
      group: "SCHOOL_LEADERSHIP",
      reportType: "FINANCIAL",
      data: mockData,
      customMessage: "Concluímos a fase regional em 1º lugar!",
    });

    // Validar WhatsApp
    assert.ok(res.whatsappText.includes("EQUIPE GÊNESIS STEM | RELATÓRIO OFICIAL DE TRANSPARÊNCIA"));
    assert.ok(res.whatsappText.includes("BALANÇO FINANCEIRO DA TEMPORADA"));
    assert.ok(res.whatsappText.includes("Concluímos a fase regional em 1º lugar!"));
    assert.ok(res.whatsappLink.includes("https://wa.me/5511987654321?text="));

    // Validar Email
    assert.ok(res.emailSubject.includes("Relatório Oficial"));
    assert.ok(res.emailHtml.includes("Diretor Marcos"));
    assert.ok(res.emailHtml.includes("Runway"));
  });

  it("deve gerar prestação de contas de ROI com entregas recentes de patrocínio", () => {
    const mockData: ReportDataPayload = {
      teamName: "Equipe Gênesis STEM",
      generatedAt: new Date("2026-10-27T10:00:00Z"),
      financialMetrics: {
        totalRevenueCents: 500000,
        totalExpenseCents: 200000,
        currentBalanceCents: 300000,
        inKindTotalCents: 0,
        projectedRunwayMonths: 3,
      },
      roiMetrics: {
        totalDirectInvestmentCents: 2000000,
        totalDeliveredValueCents: 4800000,
        roiPercentage: 140,
        topSponsors: [
          {
            name: "Bosch",
            tier: "GOLD",
            investmentCents: 1500000,
            deliveredCents: 3600000,
            ratio: 2.4,
          },
        ],
      },
      recentActions: [
        {
          date: new Date("2026-10-20"),
          title: "Logo no Bico do Carro",
          sponsorName: "Bosch",
          reachCount: 15000,
          valueCents: 200000,
        },
      ],
    };

    const res = generateCommunicationReport({
      recipientName: "Renata (Bosch)",
      group: "SPONSORS",
      reportType: "ROI",
      data: mockData,
    });

    assert.ok(res.whatsappText.includes("RETORNO SOBRE O INVESTIMENTO"));
    assert.ok(res.whatsappText.includes("140%"));
    assert.ok(res.whatsappText.includes("Logo no Bico do Carro"));
    assert.ok(res.whatsappText.includes("15.000 pessoas"));
    assert.ok(res.emailHtml.includes("Índice Geral de Retorno"));
  });
});
