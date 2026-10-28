import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { DashboardKPIsDTO } from "@/types/financial";
import { formatCurrencyFromCents } from "@/lib/utils";

describe("KPI Cards & Dashboard Metrics", () => {
  const mockKpis: DashboardKPIsDTO = {
    totalPlannedBudgetCents: 5000000, // R$ 50.000,00
    totalOriginsCents: 3500000, // R$ 35.000,00
    totalApplicationsCents: 2000000, // R$ 20.000,00
    currentCashBalanceCents: 1500000, // R$ 15.000,00
    totalResourcesCount: 12,
    totalTransactionsCount: 25,
  };

  it("deve calcular corretamente a porcentagem de cobertura de arrecadação", () => {
    const coverage = (
      (mockKpis.totalOriginsCents / mockKpis.totalPlannedBudgetCents) *
      100
    ).toFixed(1);

    assert.equal(coverage, "70.0");
  });

  it("deve calcular corretamente a porcentagem de execução do orçamento", () => {
    const execution = (
      (mockKpis.totalApplicationsCents / mockKpis.totalPlannedBudgetCents) *
      100
    ).toFixed(1);

    assert.equal(execution, "40.0");
  });

  it("deve calcular a margem de saldo em caixa sobre o total arrecadado", () => {
    const margin = (
      (mockKpis.currentCashBalanceCents / mockKpis.totalOriginsCents) *
      100
    ).toFixed(1);

    assert.equal(margin, "42.9");
  });

  it("deve formatar valores monetários a partir de centavos no padrão brasileiro", () => {
    const normalizeSpace = (str: string) => str.replace(/\u00A0/g, " ");

    assert.equal(
      normalizeSpace(formatCurrencyFromCents(mockKpis.totalOriginsCents)),
      "R$ 35.000,00"
    );
    assert.equal(
      normalizeSpace(formatCurrencyFromCents(mockKpis.totalApplicationsCents)),
      "R$ 20.000,00"
    );
    assert.equal(
      normalizeSpace(formatCurrencyFromCents(mockKpis.currentCashBalanceCents)),
      "R$ 15.000,00"
    );
  });

  it("deve identificar saldo positivo e negativo", () => {
    assert.equal(mockKpis.currentCashBalanceCents >= 0, true);

    const negativeKpis: DashboardKPIsDTO = {
      ...mockKpis,
      currentCashBalanceCents: -50000,
    };
    assert.equal(negativeKpis.currentCashBalanceCents >= 0, false);
  });
});
