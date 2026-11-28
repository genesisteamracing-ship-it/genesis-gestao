import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/tarefas",
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

Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLFormElement: dom.window.HTMLFormElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
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
  ResizeObserver: ResizeObserverMock,
  IntersectionObserver: IntersectionObserverMock,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
});

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
  screen,
} = require("@testing-library/react") as typeof import("@testing-library/react");
const { getTodayIsoLocal } = require("@/lib/task-gantt-metrics") as typeof import("@/lib/task-gantt-metrics");
const { formatTaskDate } = require("@/lib/task-schedule") as typeof import("@/lib/task-schedule");
const { TaskForm } = require("../task-form") as typeof import("../task-form");
/* eslint-enable @typescript-eslint/no-require-imports */

import type { TaskPerson, TaskRecord } from "@/types/tasks";

afterEach(() => {
  cleanup();
});

const MEMBERS: TaskPerson[] = [
  { key: "u-1", name: "Geovanna", available: true },
  { key: "u-2", name: "Artur", available: true },
];

test("TaskForm inicia com data de hoje editável, término bloqueado, sem rótulo opcional e calcula O+M+P", () => {
  const todayIso = getTodayIsoLocal();
  const todayBR = formatTaskDate(todayIso);

  render(
    React.createElement(TaskForm, {
      teamId: "team-1",
      members: MEMBERS,
      currentUserId: "u-1",
      currentUserName: "Geovanna",
      defaultStartDate: "2026-11-28",
      onDone: () => {},
    }),
  );

  // Sem "opcional" e com rótulo exato "Estimativa PERT (dias)"
  assert.ok(screen.getByText("Estimativa PERT (dias)"));
  assert.equal(screen.queryByText(/opcional/i), null);

  // Início preenchido e habilitado; Término automático e desabilitado
  const startButton = screen.getByRole("button", { name: "Início (Linha de base)" }) as HTMLButtonElement;
  const endButton = screen.getByRole("button", { name: "Término (Linha de base)" }) as HTMLButtonElement;
  assert.equal(startButton.disabled, false);
  assert.ok(startButton.textContent?.includes("28/11/2026"));
  assert.equal(endButton.disabled, true);
  assert.ok(endButton.textContent?.includes("Automático (O + M + P)"));

  // Quando defaultStartDate não é informado, usa a data de hoje
  cleanup();
  render(
    React.createElement(TaskForm, {
      teamId: "team-1",
      members: MEMBERS,
      defaultStartDate: undefined,
      onDone: () => {},
    }),
  );
  const defaultStartBtn = screen.getByRole("button", { name: "Início (Linha de base)" });
  assert.ok(defaultStartBtn.textContent?.includes(todayBR));

  // Re-render determinístico para testar cálculo automático O + M + P
  cleanup();
  render(
    React.createElement(TaskForm, {
      teamId: "team-1",
      members: MEMBERS,
      defaultStartDate: "2026-11-28",
      onDone: () => {},
    }),
  );

  const inputO = screen.getByLabelText("Otimista (O)") as HTMLInputElement;
  const inputM = screen.getByLabelText("Mais provável (M)") as HTMLInputElement;
  const inputP = screen.getByLabelText("Pessimista (P)") as HTMLInputElement;
  assert.equal(inputO.required, true);
  assert.equal(inputM.required, true);
  assert.equal(inputP.required, true);

  fireEvent.change(inputO, { target: { value: "2" } });
  fireEvent.change(inputM, { target: { value: "4" } });
  fireEvent.change(inputP, { target: { value: "9" } });

  // 28/11/2026 + (2 + 4 + 9 = 15 dias) = 13/12/2026
  const updatedEndBtn = screen.getByRole("button", { name: "Término (Linha de base)" });
  assert.ok(updatedEndBtn.textContent?.includes("13/12/2026"));
  assert.ok(screen.getByText(/Total: 15 d/));

  // Alterar P de 9 para 10 -> 16 dias -> 14/12/2026
  fireEvent.change(inputP, { target: { value: "10" } });
  assert.ok(updatedEndBtn.textContent?.includes("14/12/2026"));
  assert.ok(screen.getByText(/Total: 16 d/));
});

test("TaskForm na edição de tarefa legada sem PERT mantém término exibido bloqueado e recalcula ao preencher PERT", () => {
  const legacyTask: TaskRecord = {
    id: "t-legacy",
    title: "Tarefa legada",
    description: null,
    deliveryGroup: "ENGINEERING_CAD",
    startDate: "2026-11-10",
    endDate: "2026-11-20",
    baselineStartDate: "2026-11-10",
    baselineEndDate: "2026-11-20",
    isAtRisk: false,
    isCritical: false,
    optimisticDays: null,
    mostLikelyDays: null,
    pessimisticDays: null,
    status: "TODO",
    completedAt: null,
    cancelledAt: null,
    revision: 0,
    roles: [{ role: "A", person: { key: "u-1", name: "Geovanna", available: true } }],
  };

  render(
    React.createElement(TaskForm, {
      task: legacyTask,
      teamId: "team-1",
      members: MEMBERS,
      onDone: () => {},
    }),
  );

  const endBtn = screen.getByRole("button", { name: "Término atual / previsto" }) as HTMLButtonElement;
  assert.equal(endBtn.disabled, true);
  assert.ok(endBtn.textContent?.includes("20/11/2026"));

  fireEvent.change(screen.getByLabelText("Otimista (O)"), { target: { value: "1" } });
  fireEvent.change(screen.getByLabelText("Mais provável (M)"), { target: { value: "2" } });
  fireEvent.change(screen.getByLabelText("Pessimista (P)"), { target: { value: "3" } });

  // 10/11/2026 + (1 + 2 + 3 = 6 dias) = 16/11/2026
  assert.ok(endBtn.textContent?.includes("16/11/2026"));
});
