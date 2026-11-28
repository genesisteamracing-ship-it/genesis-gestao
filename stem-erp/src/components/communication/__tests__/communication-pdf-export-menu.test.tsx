import assert from "node:assert/strict";
import test, { after, afterEach } from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/comunicacao",
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class PointerEventMock extends dom.window.MouseEvent {
  pointerType: string;
  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.pointerType = props.pointerType ?? "mouse";
  }
}

Object.defineProperty(dom.window, "PointerEvent", {
  configurable: true,
  value: PointerEventMock,
});

Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  SVGElement: dom.window.SVGElement,
  DocumentFragment: dom.window.DocumentFragment,
  Element: dom.window.Element,
  Node: dom.window.Node,
  NodeFilter: dom.window.NodeFilter,
  Event: dom.window.Event,
  CustomEvent: dom.window.CustomEvent,
  MouseEvent: dom.window.MouseEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  PointerEvent: PointerEventMock,
  MutationObserver: dom.window.MutationObserver,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  ResizeObserver: ResizeObserverMock,
  IntersectionObserver: IntersectionObserverMock,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
});

if (!dom.window.HTMLElement.prototype.scrollIntoView) {
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
}
if (!dom.window.HTMLElement.prototype.hasPointerCapture) {
  dom.window.HTMLElement.prototype.hasPointerCapture = () => false;
}
if (!dom.window.HTMLElement.prototype.releasePointerCapture) {
  dom.window.HTMLElement.prototype.releasePointerCapture = () => {};
}

if (typeof globalThis.navigator === "undefined") {
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });
}

/* eslint-disable @typescript-eslint/no-require-imports */
const {
  cleanup,
  fireEvent,
  render,
  waitFor,
} = require("@testing-library/react") as typeof import("@testing-library/react");
const {
  CommunicationPdfExportMenu,
} = require("../communication-pdf-export-menu") as typeof import("../communication-pdf-export-menu");
/* eslint-enable @typescript-eslint/no-require-imports */

afterEach(() => {
  cleanup();
});

after(() => {
  dom.window.close();
});

test("CommunicationPdfExportMenu permite escolher entre Matriz de Comunicação (Tabela) e Matriz Poder × Interesse", async () => {
  let matrixTableCalls = 0;
  let stakeholdersQuadrantCalls = 0;

  const view = render(
    React.createElement(CommunicationPdfExportMenu, {
      disabled: false,
      isExporting: false,
      onExportCommunicationMatrix: () => {
        matrixTableCalls += 1;
      },
      onExportStakeholdersMatrix: () => {
        stakeholdersQuadrantCalls += 1;
      },
    }),
  );

  const trigger = view.getByRole("button", { name: /Exportar relatório PDF/i });
  fireEvent.pointerDown(trigger, { button: 0, pointerType: "mouse" });

  await waitFor(() => {
    assert.ok(view.getByText("Matriz de Comunicação (Tabela)"));
    assert.ok(view.getByText("Matriz Poder × Interesse"));
  });

  fireEvent.click(view.getByText("Matriz de Comunicação (Tabela)"));
  assert.equal(matrixTableCalls, 1);

  fireEvent.keyDown(trigger, { key: "Enter" });
  await waitFor(() => {
    assert.ok(view.getByText("Matriz Poder × Interesse"));
  });

  fireEvent.click(view.getByText("Matriz Poder × Interesse"));
  assert.equal(stakeholdersQuadrantCalls, 1);
});

test("CommunicationPdfExportMenu respeita estados disabled e isExporting", () => {
  const view = render(
    React.createElement(CommunicationPdfExportMenu, {
      disabled: true,
      isExporting: false,
      onExportCommunicationMatrix: () => {},
      onExportStakeholdersMatrix: () => {},
    }),
  );

  const btnDisabled = view.getByRole("button", {
    name: /Exportar relatório PDF/i,
  }) as HTMLButtonElement;
  assert.equal(btnDisabled.disabled, true);
  assert.ok(view.getByText("Relatório PDF"));

  view.rerender(
    React.createElement(CommunicationPdfExportMenu, {
      disabled: false,
      isExporting: true,
      size: "sm",
      onExportCommunicationMatrix: () => {},
      onExportStakeholdersMatrix: () => {},
    }),
  );

  const btnLoading = view.getByRole("button", {
    name: /Exportar relatório PDF/i,
  }) as HTMLButtonElement;
  assert.equal(btnLoading.disabled, true);
  assert.ok(view.getByText("Exportando..."));
});
