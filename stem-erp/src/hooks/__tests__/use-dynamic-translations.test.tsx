import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import { cleanup, render, waitFor } from "@testing-library/react";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n/locale-types";
import { clearClientPdfTranslationCache } from "@/lib/i18n/pdf-translate-client";
import { useDynamicTranslations } from "../use-dynamic-translations";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/planejamento",
});

globalThis.window = dom.window as unknown as typeof globalThis.window;
globalThis.document = dom.window.document;
if (!globalThis.navigator) {
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
    writable: true,
  });
}
globalThis.Element = dom.window.Element;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Node = dom.window.Node;
globalThis.Text = dom.window.Text;
globalThis.NodeFilter = dom.window.NodeFilter;
globalThis.MutationObserver = dom.window.MutationObserver;
globalThis.localStorage = dom.window.localStorage;
globalThis.sessionStorage = dom.window.sessionStorage;

function TestHarness({
  items,
  fetchImpl,
}: {
  items: readonly string[];
  fetchImpl?: typeof fetch;
}) {
  const { translate } = useDynamicTranslations(
    items,
    "Budget Planning table",
    fetchImpl
  );
  return (
    <ul>
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`} data-testid={`item-${idx}`}>
          {translate(item)}
        </li>
      ))}
    </ul>
  );
}

describe("useDynamicTranslations", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearClientPdfTranslationCache();
  });

  afterEach(() => {
    cleanup();
  });

  test("em pt-BR mantem os textos originais sem chamar a API de traducao", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "pt-BR");
    let fetchCalls = 0;
    const mockFetch: typeof fetch = async () => {
      fetchCalls += 1;
      return new Response(JSON.stringify({ ok: true, translations: [] }), {
        status: 200,
      });
    };

    const view = render(
      <LocaleProvider>
        <TestHarness
          items={["aerografo", "Parafuso sextavado M4 inox"]}
          fetchImpl={mockFetch}
        />
      </LocaleProvider>
    );

    assert.equal(view.getByTestId("item-0").textContent, "aerografo");
    assert.equal(
      view.getByTestId("item-1").textContent,
      "Parafuso sextavado M4 inox"
    );
    assert.equal(fetchCalls, 0);
  });

  test("em en-US traduz itens do glossario e recursos dinamicos via /api/translate", async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, "en-US");
    let fetchCalls = 0;
    const mockFetch: typeof fetch = async (url, init) => {
      fetchCalls += 1;
      assert.equal(String(url), "/api/translate");
      const body = JSON.parse(String(init?.body)) as { texts: string[] };
      // "aerografo" e resolvido localmente pelo glossario, apenas o item dinamico vai para a API
      assert.deepEqual(body.texts, ["Parafuso sextavado M4 inox"]);

      return new Response(
        JSON.stringify({
          ok: true,
          fallback: false,
          translations: ["M4 stainless steel hex bolt"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const view = render(
      <LocaleProvider>
        <TestHarness
          items={["aerografo", "Parafuso sextavado M4 inox"]}
          fetchImpl={mockFetch}
        />
      </LocaleProvider>
    );

    await waitFor(() => {
      assert.equal(view.getByTestId("item-0").textContent, "Airbrush");
      assert.equal(
        view.getByTestId("item-1").textContent,
        "M4 stainless steel hex bolt"
      );
    });
    assert.equal(fetchCalls, 1);
  });
});
