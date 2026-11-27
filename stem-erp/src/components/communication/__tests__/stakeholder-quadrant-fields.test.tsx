import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import * as React from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/comunicacao",
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLFormElement: dom.window.HTMLFormElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
  SVGElement: dom.window.SVGElement,
  DocumentFragment: dom.window.DocumentFragment,
  Node: dom.window.Node,
  NodeFilter: dom.window.NodeFilter,
  Element: dom.window.Element,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
  MouseEvent: dom.window.MouseEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  ResizeObserver: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

if (typeof globalThis.navigator === "undefined") {
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });
}

/* eslint-disable @typescript-eslint/no-require-imports */
const { cleanup, render, screen } =
  require("@testing-library/react") as typeof import("@testing-library/react");
const { StakeholderQuadrantFields } =
  require("../stakeholder-quadrant-fields") as typeof import("../stakeholder-quadrant-fields");
/* eslint-enable @typescript-eslint/no-require-imports */

test.afterEach(() => {
  cleanup();
});

test("StakeholderQuadrantFields exibe ao vivo os 4 quadrantes corretos e todos os 3 rótulos", () => {
  const cases = [
    {
      power: "HIGH" as const,
      interest: "HIGH" as const,
      expectedBadge: "Quadrante: Gerenciar de perto e envolver",
    },
    {
      power: "HIGH" as const,
      interest: "LOW" as const,
      expectedBadge: "Quadrante: Manter satisfeito",
    },
    {
      power: "LOW" as const,
      interest: "HIGH" as const,
      expectedBadge: "Quadrante: Manter informado",
    },
    {
      power: "LOW" as const,
      interest: "LOW" as const,
      expectedBadge: "Quadrante: Monitorar",
    },
  ];

  for (const testCase of cases) {
    render(
      <StakeholderQuadrantFields
        power={testCase.power}
        interest={testCase.interest}
        parentStakeholderId={null}
        parentOptions={[{ id: "st-1", name: "Diretoria SESI" }]}
        onPowerChange={() => {}}
        onInterestChange={() => {}}
        onParentChange={() => {}}
      />
    );

    assert.ok(screen.getByText(testCase.expectedBadge));
    assert.ok(screen.getByText("Poder sobre o Projeto"));
    assert.ok(screen.getByText("Nível de Interesse"));
    assert.ok(screen.getByText("Superior na Organização (Opcional)"));

    cleanup();
  }
});
