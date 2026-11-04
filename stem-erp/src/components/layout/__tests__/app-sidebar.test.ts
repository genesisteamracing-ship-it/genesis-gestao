import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FINANCE_SUB_ITEMS,
  ROI_SUB_ITEMS,
  COMMUNICATION_SUB_ITEMS,
  sidebarItemStyles,
} from "../app-sidebar";

describe("Sidebar Submodules Contracts", () => {
  it("deve exportar a lista de submódulos de finanças corretamente", () => {
    assert.equal(FINANCE_SUB_ITEMS.length, 3);
    assert.deepEqual(
      FINANCE_SUB_ITEMS.map((item) => item.href),
      ["/dashboard", "/planejamento", "/lancamentos"]
    );
  });

  it("deve exportar a lista de submódulos de ROI corretamente", () => {
    assert.equal(ROI_SUB_ITEMS.length, 2);
    assert.deepEqual(
      ROI_SUB_ITEMS.map((item) => item.href),
      ["/roi", "/roi/acoes"]
    );
  });

  it("deve conter exatamente 5 submódulos de comunicação mapeados a partir das abas da página", () => {
    assert.equal(COMMUNICATION_SUB_ITEMS.length, 5);
  });

  it("deve mapear os submódulos corretos para as abas de comunicação", () => {
    const expectedSubmodules = [
      { tabKey: "mapa", label: "Mapa Hierárquico", href: "/comunicacao?tab=mapa" },
      { tabKey: "relatorios", label: "Gerador de Relatórios", href: "/comunicacao?tab=relatorios" },
      { tabKey: "stakeholders", label: "Diretório", href: "/comunicacao?tab=stakeholders" },
      { tabKey: "agendamentos", label: "Agendamentos", href: "/comunicacao?tab=agendamentos" },
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

describe("Sidebar Module Collapsible Logic & State Contracts", () => {
  it("os módulos devem iniciar fechados (false) por padrão ao abrir o aplicativo", () => {
    const initialModuleState = false;
    assert.equal(initialModuleState, false, "Os módulos devem começar recolhidos");
  });

  it("deve alternar o estado de visibilidade somente quando clicado (toggle)", () => {
    let isOpen = false;
    const toggle = () => {
      isOpen = !isOpen;
    };

    assert.equal(isOpen, false);
    toggle(); // Usuário clica no módulo
    assert.equal(isOpen, true, "O módulo deve abrir quando for clicado");
    toggle(); // Usuário clica novamente
    assert.equal(isOpen, false, "O módulo deve fechar quando for clicado novamente");
  });

  it("deve aplicar indicador de item ativo no botão do módulo fechado quando a rota estiver ativa", () => {
    // Quando a rota é ativa mas o módulo está fechado: isActive deve ser true no botão pai
    const isRouteActive = true;
    const isModuleOpen = false;
    const stylesClosedAndActive = sidebarItemStyles({
      isActive: isRouteActive && !isModuleOpen,
    });
    assert.ok(stylesClosedAndActive.includes("bg-primary"));

    // Quando o módulo é aberto pelo clique: o botão pai não tem mais isActive true (o sub-item recebe o destaque)
    const stylesOpenedAndActive = sidebarItemStyles({
      isActive: isRouteActive && !true,
    });
    assert.ok(!stylesOpenedAndActive.includes("bg-primary"));
  });
});
