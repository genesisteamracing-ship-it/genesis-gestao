import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildFinancialStatementData,
  buildFinancialStatementFilename,
  formatStatementAmount,
  STATEMENT_PDF_COLORS,
} from "../financial-statement-pdf-layout";
import type { TransactionDTO } from "@/types/financial";

function makeTx(
  overrides: Partial<TransactionDTO> & {
    id: string;
    date: string;
    type: TransactionDTO["type"];
    amountCents: number;
  }
): TransactionDTO {
  return {
    referenceMonth: 1,
    deliveryGroup: "MANUFACTURING_CNC",
    categoryId: "cat-1",
    categoryName: "Usinagem",
    budgetResourceId: null,
    budgetResourceCode: null,
    budgetResourceName: null,
    acquisitionStrategy: null,
    description: "Lançamento teste",
    trackingMethod: "NFE",
    documentRef: null,
    sponsorId: null,
    sponsorName: null,
    sponsorTier: null,
    createdAt: "2026-10-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("Extrato Financeiro PDF (buildFinancialStatementData)", () => {
  it("deve retornar extrato vazio quando não houver transações", () => {
    const data = buildFinancialStatementData({
      transactions: [],
      teamName: "Equipe Gênesis",
    });
    assert.equal(data.transactionCount, 0);
    assert.equal(data.rows.length, 0);
    assert.equal(data.finalBalanceCents, 0);
    assert.equal(data.teamDisplayName, "Equipe Gênesis");
  });

  it("deve usar paleta azul e amarelo da Equipe Gênesis", () => {
    const [br, bg, bb] = STATEMENT_PDF_COLORS.brandBlue;
    assert.ok(bb > br && bb > bg, "Cor principal deve ser azul");

    const [yr, yg, yb] = STATEMENT_PDF_COLORS.brandYellow;
    assert.ok(yr > 200 && yg > 170 && yb < 80, "Cor de destaque deve ser amarelo");
  });

  it("deve ordenar cronologicamente, incluir coluna Código NF-e e calcular Saldo do dia e S A L D O final", () => {
    const transactions: TransactionDTO[] = [
      makeTx({
        id: "tx-3",
        date: "2026-10-05T12:00:00.000Z",
        type: "APPLICATION",
        amountCents: 4000,
        description: "Compra de rolamentos",
        trackingMethod: "NFE",
        documentRef: "NFE-001245",
      }),
      makeTx({
        id: "tx-1",
        date: "2026-10-01T12:00:00.000Z",
        type: "ORIGIN",
        amountCents: 15000,
        description: "Patrocínio Ouro",
        trackingMethod: "SPONSOR_CONTRACT",
        documentRef: null,
      }),
      makeTx({
        id: "tx-2",
        date: "2026-10-01T15:00:00.000Z",
        type: "APPLICATION",
        amountCents: 2500,
        description: "Compra de tinta automotiva",
        trackingMethod: "NFE",
        documentRef: "35261012345678000199550010000012341000012345",
      }),
    ];

    const data = buildFinancialStatementData({
      transactions,
      teamName: "Equipe Gênesis",
    });

    assert.equal(data.transactionCount, 3);
    assert.equal(data.totalEntriesCents, 15000);
    assert.equal(data.totalExitsCents, 6500);
    assert.equal(data.finalBalanceCents, 8500);
    assert.equal(data.periodLabel, "01/10/2026 a 05/10/2026");

    // 2 txs dia 01 + 1 Saldo do dia + 1 tx dia 05 + 1 Saldo do dia + 1 SALDO final = 6 linhas
    assert.equal(data.rows.length, 6);

    assert.equal(data.rows[0].kind, "TRANSACTION");
    assert.equal(data.rows[0].nfeCode, "—");
    assert.equal(data.rows[0].amountFormatted, "150,00 (+)");

    assert.equal(data.rows[1].kind, "TRANSACTION");
    assert.equal(
      data.rows[1].nfeCode,
      "35261012345678000199550010000012341000012345"
    );
    assert.equal(data.rows[1].amountFormatted, "25,00 (-)");

    assert.equal(data.rows[2].kind, "DAILY_BALANCE");
    assert.equal(data.rows[2].historyPrimary, "Saldo do dia");
    assert.equal(data.rows[2].amountFormatted, "125,00 (+)");

    assert.equal(data.rows[3].kind, "TRANSACTION");
    assert.equal(data.rows[3].nfeCode, "NFE-001245");
    assert.equal(data.rows[3].amountFormatted, "40,00 (-)");

    assert.equal(data.rows[4].kind, "DAILY_BALANCE");
    assert.equal(data.rows[4].amountFormatted, "85,00 (+)");

    assert.equal(data.rows[5].kind, "FINAL_BALANCE");
    assert.equal(data.rows[5].historyPrimary, "S A L D O");
    assert.equal(data.rows[5].amountFormatted, "85,00 (+)");
  });

  it("deve formatar valores negativos e gerar nome de arquivo sanitizado", () => {
    assert.equal(formatStatementAmount(10875, "positive"), "108,75 (+)");
    assert.equal(formatStatementAmount(9997, "negative"), "99,97 (-)");
    assert.equal(
      buildFinancialStatementFilename("Equipe Gênesis", new Date(2026, 10, 25)),
      "extrato-financeiro-equipe-genesis-2026-11-25.pdf"
    );
  });
});
