import test from "node:test";
import assert from "node:assert/strict";
import {
  ensureMinimumContingencyPlans,
  getContingencyPlanLabel,
  parseContingencyPlans,
  serializeContingencyPlans,
} from "../lib/risk-contingency-plans";

test("getContingencyPlanLabel gera rótulos Plano A, B, C, D", () => {
  assert.equal(getContingencyPlanLabel(0), "Plano A");
  assert.equal(getContingencyPlanLabel(1), "Plano B");
  assert.equal(getContingencyPlanLabel(2), "Plano C");
  assert.equal(getContingencyPlanLabel(3), "Plano D");
});

test("ensureMinimumContingencyPlans garante ao menos 2 slots no formulário", () => {
  assert.deepEqual(ensureMinimumContingencyPlans([]), ["", ""]);
  assert.deepEqual(ensureMinimumContingencyPlans(["Plano legado"]), [
    "Plano legado",
    "",
  ]);
  assert.deepEqual(ensureMinimumContingencyPlans(["A", "B", "C"]), [
    "A",
    "B",
    "C",
  ]);
});

test("serializeContingencyPlans e parseContingencyPlans preservam planos A, B, C, D e texto multilinha", () => {
  const serialized = serializeContingencyPlans([
    "Acionar fornecedor local",
    "Usar peça reserva\nCom inspeção dimensional",
    "Terceirizar usinagem em parceiro",
    "Reaproveitar protótipo anterior",
  ]);

  assert.equal(
    serialized,
    [
      "Plano A: Acionar fornecedor local",
      "Plano B: Usar peça reserva\nCom inspeção dimensional",
      "Plano C: Terceirizar usinagem em parceiro",
      "Plano D: Reaproveitar protótipo anterior",
    ].join("\n")
  );

  assert.deepEqual(parseContingencyPlans(serialized), [
    "Acionar fornecedor local",
    "Usar peça reserva\nCom inspeção dimensional",
    "Terceirizar usinagem em parceiro",
    "Reaproveitar protótipo anterior",
  ]);
});

test("parseContingencyPlans suporta vazio e registros legados sem prefixo Plano X:", () => {
  assert.deepEqual(parseContingencyPlans(null), []);
  assert.deepEqual(parseContingencyPlans("   "), []);
  assert.deepEqual(parseContingencyPlans("Usar usinagem reserva"), [
    "Usar usinagem reserva",
  ]);
});
