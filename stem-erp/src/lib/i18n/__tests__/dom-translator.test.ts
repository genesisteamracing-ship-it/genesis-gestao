import assert from "node:assert/strict";
import { after, afterEach, describe, test } from "node:test";
import { JSDOM } from "jsdom";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/",
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  Element: dom.window.Element,
  HTMLElement: dom.window.HTMLElement,
  SVGElement: dom.window.SVGElement,
  Node: dom.window.Node,
  NodeFilter: dom.window.NodeFilter,
  MutationObserver: dom.window.MutationObserver,
});

/* eslint-disable @typescript-eslint/no-require-imports */
const {
  applyTranslationsToElement,
  createDomTranslationState,
  DomTextTranslator,
  restoreTranslations,
} = require("../dom-translator") as typeof import("../dom-translator");
/* eslint-enable @typescript-eslint/no-require-imports */

afterEach(() => {
  dom.window.document.body.innerHTML = "";
});

after(() => {
  dom.window.close();
});

describe("dom-translator", () => {
  test("traduz nos de texto e atributos e restaura tudo para pt-BR", () => {
    const root = dom.window.document.createElement("div");
    root.innerHTML = `
      <h1>Escritório Virtual</h1>
      <button title="Exportar CSV" aria-label="Fechar">Cancelar</button>
      <input placeholder="Buscar integrante..." value="Planejamento customizado" />
      <div data-no-translate="true"><span>Planejamento</span></div>
      <code>Livro Caixa</code>
    `;
    dom.window.document.body.appendChild(root);

    const input = root.querySelector("input") as HTMLInputElement;
    const state = createDomTranslationState();

    applyTranslationsToElement(root, state, "en-US");

    assert.equal(root.querySelector("h1")?.textContent, "Virtual Office");
    const button = root.querySelector("button")!;
    assert.equal(button.textContent, "Cancel");
    assert.equal(button.getAttribute("title"), "Export CSV");
    assert.equal(button.getAttribute("aria-label"), "Close");
    assert.equal(input.getAttribute("placeholder"), "Search member...");
    assert.equal(input.value, "Planejamento customizado");
    assert.equal(
      root.querySelector('[data-no-translate="true"] span')?.textContent,
      "Planejamento"
    );
    assert.equal(root.querySelector("code")?.textContent, "Livro Caixa");

    restoreTranslations(state);

    assert.equal(root.querySelector("h1")?.textContent, "Escritório Virtual");
    assert.equal(button.textContent, "Cancelar");
    assert.equal(button.getAttribute("title"), "Exportar CSV");
    assert.equal(button.getAttribute("aria-label"), "Fechar");
    assert.equal(input.getAttribute("placeholder"), "Buscar integrante...");
  });

  test("DomTextTranslator acompanha mutacoes dinamicas no DOM e restaura ao parar", async () => {
    const root = dom.window.document.createElement("div");
    root.innerHTML = "<p>Dashboard</p>";
    dom.window.document.body.appendChild(root);

    const translator = new DomTextTranslator();
    translator.start(root);

    const dynamicSection = dom.window.document.createElement("section");
    dynamicSection.innerHTML = `
      <h2>Gestão de Riscos</h2>
      <span>Mostrando 1-10 de 30 registros</span>
    `;
    root.appendChild(dynamicSection);

    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    assert.equal(
      dynamicSection.querySelector("h2")?.textContent,
      "Risk Management"
    );
    assert.equal(
      dynamicSection.querySelector("span")?.textContent,
      "Showing 1-10 of 30 records"
    );

    translator.stopAndRestore();

    assert.equal(
      dynamicSection.querySelector("h2")?.textContent,
      "Gestão de Riscos"
    );
    assert.equal(
      dynamicSection.querySelector("span")?.textContent,
      "Mostrando 1-10 de 30 registros"
    );
  });
});
