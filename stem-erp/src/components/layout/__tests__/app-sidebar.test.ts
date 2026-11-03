import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { COMMUNICATION_SUB_ITEMS } from "../app-sidebar";

describe("Sidebar Communication Submodules Contracts", () => {
  it("deve conter exatamente 5 submódulos de comunicação mapeados a partir das abas da página", () => {
    assert.equal(COMMUNICATION_SUB_ITEMS.length, 5);
  });

  it("deve mapear os submódulos corretos para as abas de comunicação", () => {
    const expectedSubmodules = [
      { tabKey: "mapa", label: "Mapa Hierárquico", href: "/comunicacao?tab=mapa" },
      { tabKey: "relatorios", label: "Gerador de Relatórios", href: "/comunicacao?tab=relatorios" },
      { tabKey: "stakeholders", label: "Diretório", href: "/comunicacao?tab=stakeholders" },
      { tabKey: "historico", label: "Histórico", href: "/comunicacao?tab=historico" },
      { tabKey: "matriz", label: "Matriz Mendelow", href: "/comunicacao?tab=matriz" },
    ];

    expectedSubmodules.forEach((expected, index) => {
      const actual = COMMUNICATION_SUB_ITEMS[index];
      assert.equal(actual.tabKey, expected.tabKey);
      assert.equal(actual.label, expected.label);
      assert.equal(actual.href, expected.href);
      assert.ok(actual.icon, `O submódulo ${expected.label} deve possuir um ícone definido`);
    });
  });
});
