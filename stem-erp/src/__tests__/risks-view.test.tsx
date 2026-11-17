import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import * as React from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/riscos",
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

/* eslint-disable @typescript-eslint/no-require-imports */
const {
  cleanup,
  fireEvent,
  render,
  screen,
} = require("@testing-library/react") as typeof import("@testing-library/react");
const { RisksView } = require("../components/risks/risks-view") as typeof import("../components/risks/risks-view");
/* eslint-enable @typescript-eslint/no-require-imports */
import type { RiskItemDTO } from "../types/risks";

test.afterEach(() => {
  cleanup();
});

const SAMPLE_ITEMS: RiskItemDTO[] = [
  {
    id: "r1",
    teamId: "t1",
    season: "2025/2026",
    entryType: "RISK",
    title: "Falha no corte CNC do chassi",
    description: "Desgaste de fresa",
    sector: "MANUFACTURING_CNC",
    probability: "PROVAVEL",
    consequence: "GRANDE",
    priorityScore: 16,
    priorityLevel: "CRITICAL",
    proactiveStrategy: "Inspeção prévia de ferramenta",
    contingencyPlan: "Usar usinagem reserva",
    observations: "Acompanhar lote 2",
    evidenceNotes: null,
    evidenceUrl: null,
    status: "MONITORING",
    ownerName: "Ana",
    ownerUserId: "u1",
    reviewsCount: 1,
    createdAt: "2026-11-12T10:00:00.000Z",
    updatedAt: "2026-11-12T10:00:00.000Z",
  },
  {
    id: "o1",
    teamId: "t1",
    season: "2025/2026",
    entryType: "OPPORTUNITY",
    title: "Patrocínio de laboratório de túnel de vento",
    description: null,
    sector: "MARKETING_SPONSOR",
    probability: "POSSIVEL",
    consequence: "MODERADA",
    priorityScore: 9,
    priorityLevel: "HIGH",
    proactiveStrategy: "Enviar portfólio técnico",
    contingencyPlan: null,
    observations: "Reunião agendada",
    evidenceNotes: "Proposta enviada",
    evidenceUrl: "https://exemplo.com/proposta",
    status: "IDENTIFIED",
    ownerName: "Lucas",
    ownerUserId: "u2",
    reviewsCount: 0,
    createdAt: "2026-11-12T11:00:00.000Z",
    updatedAt: "2026-11-12T11:00:00.000Z",
  },
];

test("RisksView renders Empty State when no risks exist", () => {
  render(
    <RisksView
      season="2025/2026"
      initialItems={[]}
      initialMembers={[]}
      initialCanEdit={true}
    />
  );

  assert.ok(screen.getByText("Nenhum risco cadastrado"));
  assert.ok(
    screen.getByRole("button", { name: /Cadastrar Primeiro Risco/i })
  );
});

test("RisksView renders Success state with charts, required table columns and opens create dialog", () => {
  render(
    <RisksView
      season="2025/2026"
      initialItems={SAMPLE_ITEMS}
      initialMembers={[{ id: "u1", name: "Ana", deliveryGroup: "MANUFACTURING_CNC" }]}
      initialCanEdit={true}
    />
  );

  assert.ok(screen.getByText("Distribuição por Chance (%)"));
  assert.ok(screen.getByText("Distribuição por Consequência (%)"));
  assert.ok(
    screen.getByText("Plano Cartesiano (Chance × Consequência)")
  );

  // Required table headers
  assert.ok(screen.getByRole("columnheader", { name: "Setor" }));
  assert.ok(
    screen.getByRole("columnheader", { name: "Probabilidade de ocorrer" })
  );
  assert.ok(
    screen.getByRole("columnheader", { name: "Consequência de ocorrência" })
  );
  assert.ok(screen.getByRole("columnheader", { name: "Risco" }));
  assert.ok(screen.getByRole("columnheader", { name: "Observações" }));

  // Row content
  assert.ok(screen.getByText("Falha no corte CNC do chassi"));
  assert.ok(screen.getByText("Acompanhar lote 2"));

  // Open create dialog
  fireEvent.click(screen.getByRole("button", { name: /Novo Risco/i }));
  assert.ok(screen.getByRole("dialog"));
  assert.ok(screen.getByText("Novo Registro de Risco"));
});

test("RisksView hides write controls for read-only users", () => {
  render(
    <RisksView
      season="2025/2026"
      initialItems={SAMPLE_ITEMS}
      initialMembers={[]}
      initialCanEdit={false}
    />
  );

  assert.equal(
    screen.queryByRole("button", { name: /Novo Risco/i }),
    null
  );
});
