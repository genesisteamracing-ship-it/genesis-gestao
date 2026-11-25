import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createTransactionSchema,
  resolveTransactionDocumentRef,
  shouldShowNfeCodeField,
} from "../financial";

describe("Código da NF-e em lançamentos de despesas", () => {
  it("deve exibir o campo de código da NF-e apenas para despesas (APPLICATION) com método NFE", () => {
    assert.equal(shouldShowNfeCodeField("APPLICATION", "NFE"), true);
    assert.equal(shouldShowNfeCodeField("APPLICATION", "RECEIPT"), false);
    assert.equal(shouldShowNfeCodeField("APPLICATION", "BANK_PIX_STATEMENT"), false);
    assert.equal(shouldShowNfeCodeField("APPLICATION", "SPONSOR_CONTRACT"), false);
    assert.equal(shouldShowNfeCodeField("ORIGIN", "NFE"), false);
  });

  it("deve normalizar o código da NF-e quando aplicável e limpar quando não for despesa NF-e", () => {
    assert.equal(
      resolveTransactionDocumentRef("APPLICATION", "NFE", "  NFE-000123  "),
      "NFE-000123"
    );
    assert.equal(
      resolveTransactionDocumentRef("APPLICATION", "NFE", "   "),
      undefined
    );
    assert.equal(
      resolveTransactionDocumentRef("APPLICATION", "RECEIPT", "NFE-000123"),
      undefined
    );
    assert.equal(
      resolveTransactionDocumentRef("ORIGIN", "NFE", "NFE-000123"),
      undefined
    );
  });

  it("deve validar documentRef no createTransactionSchema rejeitando códigos com mais de 60 caracteres", () => {
    const basePayload = {
      date: "2026-04-10",
      type: "APPLICATION" as const,
      deliveryGroup: "MANUFACTURING_CNC" as const,
      categoryId: "cat-1",
      description: "Compra de bloco CNC",
      trackingMethod: "NFE" as const,
      amountCents: 25000,
    };

    const valid = createTransactionSchema.safeParse({
      ...basePayload,
      documentRef: "35260412345678000199550010000012341000012345",
    });
    assert.equal(valid.success, true);

    const tooLong = createTransactionSchema.safeParse({
      ...basePayload,
      documentRef: "A".repeat(61),
    });
    assert.equal(tooLong.success, false);
  });
});
