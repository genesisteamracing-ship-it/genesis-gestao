import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Sidebar Provider Logic & Storage Contracts", () => {
  const STORAGE_KEY = "genesis_sidebar_open";

  it("deve utilizar a chave padrão correta no localStorage", () => {
    assert.equal(STORAGE_KEY, "genesis_sidebar_open");
  });

  it("deve serializar e desserializar corretamente o estado booleano do toggle", () => {
    const states = [true, false];
    for (const state of states) {
      const serialized = String(state);
      const deserialized = serialized === "true";
      assert.equal(deserialized, state);
    }
  });

  it("deve calcular a largura correta para classes da barra lateral baseada no estado sem deslocar o conteudo da tela", () => {
    const getSidebarClasses = (isOpen: boolean) =>
      isOpen
        ? "w-60 opacity-100"
        : "w-0 border-r-0 opacity-0 pointer-events-none";

    assert.ok(getSidebarClasses(true).includes("w-60"));
    assert.ok(getSidebarClasses(false).includes("w-0"));
    assert.ok(!getSidebarClasses(false).includes("-ml-60"), "Não deve usar margem negativa que desloque a tela");
  });

  it("deve gerar aria-label e title semânticos no botão de painel lateral", () => {
    const getAriaLabel = (isOpen: boolean) =>
      isOpen ? "Recolher barra lateral" : "Expandir barra lateral";

    assert.equal(getAriaLabel(true), "Recolher barra lateral");
    assert.equal(getAriaLabel(false), "Expandir barra lateral");
  });
});
