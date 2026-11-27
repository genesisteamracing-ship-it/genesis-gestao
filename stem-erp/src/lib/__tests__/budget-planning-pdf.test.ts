import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BUDGET_PDF_COLORS,
  buildBudgetPlanningData,
  buildBudgetPlanningFilename,
} from "../budget-planning-pdf-layout";
import { STATEMENT_PDF_COLORS } from "../financial-statement-pdf-layout";
import type { BudgetResourceDTO } from "@/types/financial";

function makeResource(
  overrides: Partial<BudgetResourceDTO> & {
    id: string;
    code: string;
    resourceName: string;
    plannedAmountCents: number;
    realizedAmountCents: number;
  }
): BudgetResourceDTO {
  return {
    deliveryGroup: "ENGINEERING_CAD",
    categoryId: "cat-1",
    categoryName: "CAD & Simulação",
    acquisitionStrategy: "DIRECT_PURCHASE",
    allocatedTo: "Maria Silva",
    plannedMonth: 1,
    utilizationForecast: 100,
    transactionsCount: 0,
    createdAt: "2026-10-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("Planejamento Orçamentário PDF (buildBudgetPlanningData)", () => {
  it("deve retornar relatório vazio quando não houver recursos planejados", () => {
    const data = buildBudgetPlanningData({
      resources: [],
      teamName: "Equipe Gênesis",
    });

    assert.equal(data.resourceCount, 0);
    assert.equal(data.rows.length, 0);
    assert.equal(data.totalPlannedCents, 0);
    assert.equal(data.totalRealizedCents, 0);
    assert.equal(data.varianceCents, 0);
    assert.equal(data.executionPercent, 0);
    assert.equal(data.teamDisplayName, "Equipe Gênesis");
  });

  it("deve reutilizar exatamente a paleta Azul e Amarelo do Livro Caixa", () => {
    assert.deepEqual(BUDGET_PDF_COLORS, STATEMENT_PDF_COLORS);
  });

  it("deve agrupar por setor, ordenar por mês/código e calcular subtotais e total geral", () => {
    const resources: BudgetResourceDTO[] = [
      makeResource({
        id: "res-3",
        code: "MKT-01",
        deliveryGroup: "MARKETING_SPONSOR",
        categoryName: "Uniformes",
        resourceName: "Camisetas da Equipe",
        acquisitionStrategy: "FINANCIAL_SPONSOR",
        allocatedTo: "Lucas",
        plannedMonth: 3,
        plannedAmountCents: 100000,
        realizedAmountCents: 120000,
      }),
      makeResource({
        id: "res-2",
        code: "ENG-02",
        deliveryGroup: "ENGINEERING_CAD",
        categoryName: "Prototipagem",
        resourceName: "Filamento Impressão 3D",
        acquisitionStrategy: "BARTER_PARTNERSHIP",
        allocatedTo: "Ana",
        plannedMonth: 2,
        plannedAmountCents: 50000,
        realizedAmountCents: 20000,
      }),
      makeResource({
        id: "res-1",
        code: "ENG-01",
        deliveryGroup: "ENGINEERING_CAD",
        categoryName: "CAD & Simulação",
        resourceName: "Licença CFD",
        acquisitionStrategy: "DIRECT_PURCHASE",
        allocatedTo: "Pedro",
        plannedMonth: 1,
        plannedAmountCents: 150000,
        realizedAmountCents: 100000,
      }),
    ];

    const data = buildBudgetPlanningData({
      resources,
      teamName: "Equipe Gênesis",
      seasonLabel: "Temporada 2026/2027",
      monthLabels: { 1: "Out/26", 2: "Nov/26", 3: "Dez/26" },
    });

    assert.equal(data.resourceCount, 3);
    assert.equal(data.scopeLabel, "Temporada 2026/2027");
    assert.equal(data.totalPlannedCents, 300000);
    assert.equal(data.totalRealizedCents, 240000);
    assert.equal(data.varianceCents, 60000);
    assert.equal(data.executionPercent, 80);

    // 2 recursos ENG + 1 subtotal ENG + 1 recurso MKT + 1 subtotal MKT + 1 total geral = 6 linhas
    assert.equal(data.rows.length, 6);

    assert.equal(data.rows[0].kind, "RESOURCE");
    assert.equal(data.rows[0].code, "ENG-01");
    assert.equal(data.rows[0].monthLabel, "Out/26");
    assert.equal(data.rows[0].strategyLabel, "Compra Direta");
    assert.equal(data.rows[0].isExceeded, false);

    assert.equal(data.rows[1].kind, "RESOURCE");
    assert.equal(data.rows[1].code, "ENG-02");
    assert.equal(data.rows[1].monthLabel, "Nov/26");
    assert.equal(data.rows[1].strategyLabel, "Permuta");

    assert.equal(data.rows[2].kind, "GROUP_SUBTOTAL");
    assert.equal(data.rows[2].resourcePrimary, "Subtotal • Engenharia & CAD");
    assert.equal(data.rows[2].isExceeded, false);

    assert.equal(data.rows[3].kind, "RESOURCE");
    assert.equal(data.rows[3].code, "MKT-01");
    assert.equal(data.rows[3].strategyLabel, "Patrocínio");
    assert.equal(data.rows[3].isExceeded, true);

    assert.equal(data.rows[4].kind, "GROUP_SUBTOTAL");
    assert.equal(
      data.rows[4].resourcePrimary,
      "Subtotal • Marketing & Patrocínio"
    );
    assert.equal(data.rows[4].isExceeded, true);

    assert.equal(data.rows[5].kind, "FINAL_TOTAL");
    assert.equal(data.rows[5].resourcePrimary, "T O T A L   O R Ç A D O");
    assert.equal(data.rows[5].isExceeded, false);
  });

  it("deve derivar o escopo pelos meses quando seasonLabel não for informado e gerar nome de arquivo sanitizado", () => {
    const data = buildBudgetPlanningData({
      resources: [
        makeResource({
          id: "res-1",
          code: "ENG-01",
          resourceName: "Bloco Balsa",
          plannedMonth: 2,
          plannedAmountCents: 20000,
          realizedAmountCents: 0,
        }),
        makeResource({
          id: "res-2",
          code: "ENG-02",
          resourceName: "Tinta Automotiva",
          plannedMonth: 5,
          plannedAmountCents: 30000,
          realizedAmountCents: 0,
        }),
      ],
    });

    assert.equal(data.scopeLabel, "Mês 2 a Mês 5");
    assert.equal(
      buildBudgetPlanningFilename("Equipe Gênesis", new Date(2026, 10, 27)),
      "orcamento-planejamento-equipe-genesis-2026-11-27.pdf"
    );
  });
});
