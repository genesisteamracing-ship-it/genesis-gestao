import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
  DEFAULT_LOCALE,
  getStoredLocale,
  isValidLocale,
  LOCALE_STORAGE_KEY,
  persistLocale,
} from "../locale-types";
import { translateUiText } from "../translations";

describe("locale-types", () => {
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "document", {
      value: originalDocument,
      configurable: true,
      writable: true,
    });
  });

  test("isValidLocale aceita apenas pt-BR e en-US", () => {
    assert.equal(isValidLocale("pt-BR"), true);
    assert.equal(isValidLocale("en-US"), true);
    assert.equal(isValidLocale("es-ES"), false);
    assert.equal(isValidLocale(null), false);
    assert.equal(isValidLocale(undefined), false);
    assert.equal(isValidLocale(123), false);
  });

  test("getStoredLocale retorna pt-BR quando window nao existe", () => {
    Object.defineProperty(globalThis, "window", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    assert.equal(getStoredLocale(), DEFAULT_LOCALE);
  });

  test("persistLocale grava localStorage, cookie e html lang e getStoredLocale recupera", () => {
    const store = new Map<string, string>();
    const mockDocument = {
      cookie: "",
      documentElement: { lang: "pt-BR" },
    };

    Object.defineProperty(globalThis, "window", {
      value: {
        localStorage: {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, val: string) => {
            store.set(key, val);
          },
        },
      },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, "document", {
      value: mockDocument,
      configurable: true,
      writable: true,
    });

    persistLocale("en-US");
    assert.equal(store.get(LOCALE_STORAGE_KEY), "en-US");
    assert.equal(mockDocument.documentElement.lang, "en-US");
    assert.match(mockDocument.cookie, /stem-erp-locale=en-US/);
    assert.equal(getStoredLocale(), "en-US");
  });
});

describe("translateUiText", () => {
  test("retorna o texto original sem alteracao quando locale eh pt-BR", () => {
    assert.equal(translateUiText("Escritório Virtual", "pt-BR"), "Escritório Virtual");
    assert.equal(
      translateUiText("Mostrando 1-10 de 25 lançamentos", "pt-BR"),
      "Mostrando 1-10 de 25 lançamentos"
    );
  });

  test("traduz rotulos de navegacao, titulos, dominios e controles em en-US", () => {
    assert.equal(translateUiText("Escritório Virtual", "en-US"), "Virtual Office");
    assert.equal(translateUiText("Livro Caixa", "en-US"), "Cash Ledger");
    assert.equal(translateUiText("Presença nos Treinos", "en-US"), "Training Attendance");
    assert.equal(translateUiText("Engenharia & CAD", "en-US"), "Engineering & CAD");
    assert.equal(
      translateUiText("Exportar relatório PDF", "en-US"),
      "Export PDF report"
    );
  });

  test("preserva espacos nas bordas e sufixos de dois pontos ou obrigatoriedade", () => {
    assert.equal(translateUiText("  Dashboard  ", "en-US"), "  Dashboard  ");
    assert.equal(translateUiText(" itens", "en-US"), " items");
    assert.equal(translateUiText("Equipe:", "en-US"), "Team:");
    assert.equal(translateUiText("Organização *", "en-US"), "Organization *");
  });

  test("traduz padroes dinamicos comuns com regex", () => {
    assert.equal(
      translateUiText("Mostrando 1-10 de 25 lançamentos", "en-US"),
      "Showing 1-10 of 25 transactions"
    );
    assert.equal(translateUiText("Página 2 de 4", "en-US"), "Page 2 of 4");
    assert.equal(translateUiText("Ações para Carlos", "en-US"), "Actions for Carlos");
    assert.equal(
      translateUiText("• Setor: Engenharia & CAD", "en-US"),
      "• Sector: Engineering & CAD"
    );
    assert.equal(translateUiText("Semana 3", "en-US"), "Week 3");
    assert.equal(translateUiText("Mês 2", "en-US"), "Month 2");
    assert.equal(translateUiText("5 dias", "en-US"), "5 days");
    assert.equal(translateUiText("1 hora", "en-US"), "1 hour");
    assert.equal(translateUiText("Editar Equipe", "en-US"), "Edit Team");
    assert.equal(translateUiText("Excluir Tarefa", "en-US"), "Delete Task");
  });

  test("traduz titulos, descricoes, meses e indicadores dos dashboards em en-US", () => {
    assert.equal(
      translateUiText("Fluxo de Caixa na Linha do Tempo", "en-US"),
      "Cash Flow Timeline"
    );
    assert.equal(
      translateUiText(
        "Origens (Verde) vs. Aplicações (Vermelho) e evolução do Saldo Acumulado\n              (Linha Azul DashStack)",
        "en-US"
      ),
      "Revenues (Green) vs. Expenses (Red) and Cumulative Balance trend (Blue Line)"
    );
    assert.equal(
      translateUiText("Cronograma Físico-Financeiro (Previsto vs. Realizado)", "en-US"),
      "Physical-Financial Schedule (Planned vs. Actual)"
    );
    assert.equal(translateUiText("Dentro do Orçamento", "en-US"), "Within Budget");
    assert.equal(translateUiText("Variação:", "en-US"), "Variance:");
    assert.equal(translateUiText("Ago/2025", "en-US"), "Aug/2025");
    assert.equal(translateUiText("Fev/2026", "en-US"), "Feb/2026");
    assert.equal(
      translateUiText("Investimento vs. Retorno por Patrocinador", "en-US"),
      "Investment vs. Return by Sponsor"
    );
    assert.equal(
      translateUiText("Presenças e Faltas por Treino", "en-US"),
      "Attendances and Absences per Training"
    );
    assert.equal(translateUiText("5 treinos no período", "en-US"), "5 trainings in period");
    assert.equal(
      translateUiText("14/05/2026 · 2 faltas", "en-US"),
      "14/05/2026 · 2 absences"
    );
  });

  test("preserva nomes proprios, valores monetarios, e-mails e codigos WBS intactos", () => {
    assert.equal(translateUiText("Equipe Gênesis", "en-US"), "Equipe Gênesis");
    assert.equal(translateUiText("R$ 1.500,00", "en-US"), "R$ 1.500,00");
    assert.equal(translateUiText("ana@genesis.com", "en-US"), "ana@genesis.com");
    assert.equal(translateUiText("1.2.3", "en-US"), "1.2.3");
  });
});
