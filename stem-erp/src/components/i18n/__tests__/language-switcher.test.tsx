import assert from "node:assert/strict";
import test, { after, afterEach, describe } from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/dashboard",
});

Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  SVGElement: dom.window.SVGElement,
  DocumentFragment: dom.window.DocumentFragment,
  Element: dom.window.Element,
  Node: dom.window.Node,
  NodeFilter: dom.window.NodeFilter,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
  MouseEvent: dom.window.MouseEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
});

/* eslint-disable @typescript-eslint/no-require-imports */
const {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} = require("@testing-library/react") as typeof import("@testing-library/react");
const {
  LocaleProvider,
} = require("../locale-provider") as typeof import("../locale-provider");
const {
  LanguageSwitcher,
} = require("../language-switcher") as typeof import("../language-switcher");
const {
  LOCALE_STORAGE_KEY,
} = require("@/lib/i18n/locale-types") as typeof import("@/lib/i18n/locale-types");
/* eslint-enable @typescript-eslint/no-require-imports */

afterEach(() => {
  cleanup();
  dom.window.localStorage.clear();
  dom.window.document.cookie = `${LOCALE_STORAGE_KEY}=; path=/; max-age=0`;
  dom.window.document.documentElement.lang = "pt-BR";
});

after(() => {
  dom.window.close();
});

function SampleWorkspaceUi() {
  return React.createElement(
    "div",
    null,
    React.createElement(LanguageSwitcher, { size: "sm", showCode: "always" }),
    React.createElement("h1", null, "Escritório Virtual"),
    React.createElement("button", { type: "button", title: "Exportar CSV" }, "Planejar Recurso"),
    React.createElement("input", {
      placeholder: "Buscar integrante...",
      defaultValue: "Felipe Bastos",
    })
  );
}

describe("LanguageSwitcher", () => {
  test("renderiza bandeiras do Brasil e EUA e alterna idioma PT-BR <-> EN-US", async () => {
    render(
      React.createElement(LocaleProvider, null, React.createElement(SampleWorkspaceUi))
    );

    const ptButton = screen.getByRole("button", { name: "Português (Brasil)" });
    const enButton = screen.getByRole("button", { name: "English (United States)" });

    assert.equal(ptButton.getAttribute("aria-pressed"), "true");
    assert.equal(enButton.getAttribute("aria-pressed"), "false");
    assert.equal(screen.getByRole("heading", { level: 1 }).textContent, "Escritório Virtual");

    fireEvent.click(enButton);

    await waitFor(() => {
      assert.equal(enButton.getAttribute("aria-pressed"), "true");
      assert.equal(ptButton.getAttribute("aria-pressed"), "false");
      assert.equal(screen.getByRole("heading", { level: 1 }).textContent, "Virtual Office");
    });

    const exportBtn = screen.getByRole("button", { name: "Plan Resource" });
    assert.equal(exportBtn.getAttribute("title"), "Export CSV");

    const input = screen.getByPlaceholderText("Search member...") as HTMLInputElement;
    assert.equal(input.value, "Felipe Bastos");
    assert.equal(dom.window.document.documentElement.lang, "en-US");
    assert.equal(dom.window.localStorage.getItem(LOCALE_STORAGE_KEY), "en-US");

    fireEvent.click(ptButton);

    await waitFor(() => {
      assert.equal(ptButton.getAttribute("aria-pressed"), "true");
      assert.equal(enButton.getAttribute("aria-pressed"), "false");
      assert.equal(screen.getByRole("heading", { level: 1 }).textContent, "Escritório Virtual");
    });

    assert.equal(dom.window.document.documentElement.lang, "pt-BR");
    assert.equal(dom.window.localStorage.getItem(LOCALE_STORAGE_KEY), "pt-BR");
  });

  test("restaura preferencia en-US salva no localStorage ao montar", async () => {
    dom.window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US");

    render(
      React.createElement(LocaleProvider, null, React.createElement(SampleWorkspaceUi))
    );

    await waitFor(() => {
      const enButton = screen.getByRole("button", { name: "English (United States)" });
      assert.equal(enButton.getAttribute("aria-pressed"), "true");
      assert.equal(screen.getByRole("heading", { level: 1 }).textContent, "Virtual Office");
    });
  });
});
