import assert from "node:assert/strict";
import test, { after, afterEach } from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";
import type { TaskMilestoneRecord, TaskRecord } from "@/types/tasks";

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
  HTMLFormElement: dom.window.HTMLFormElement,
  HTMLButtonElement: dom.window.HTMLButtonElement,
  HTMLInputElement: dom.window.HTMLInputElement,
  HTMLTextAreaElement: dom.window.HTMLTextAreaElement,
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
  AppRouterContext,
} = require("next/dist/shared/lib/app-router-context.shared-runtime") as typeof import("next/dist/shared/lib/app-router-context.shared-runtime");
const { TaskGantt } = require("../task-gantt") as typeof import("../task-gantt");
const {
  TaskGanttMilestoneFormDialog,
} = require("../task-gantt-milestone-form-dialog") as typeof import("../task-gantt-milestone-form-dialog");
const {
  TaskGanttMilestoneTrack,
} = require("../task-gantt-milestone-track") as typeof import("../task-gantt-milestone-track");
const {
  TaskGanttMilestoneVerifyDialog,
} = require("../task-gantt-milestone-verify-dialog") as typeof import("../task-gantt-milestone-verify-dialog");
/* eslint-enable @typescript-eslint/no-require-imports */

type AppRouterInstance = React.ComponentProps<typeof AppRouterContext.Provider>["value"];

const mockRouter: AppRouterInstance = {
  back: () => {},
  forward: () => {},
  refresh: () => {},
  push: () => {},
  replace: () => {},
  prefetch: () => {},
  bfcacheId: "test-bfcache",
};

afterEach(() => {
  cleanup();
});

after(() => {
  dom.window.close();
});

function makeTask(overrides: Partial<TaskRecord> = {}): TaskRecord {
  return {
    id: "task-1",
    title: "Modelagem da Asa",
    description: null,
    deliveryGroup: "ENGINEERING_CAD",
    startDate: "2026-05-18",
    endDate: "2026-05-22",
    baselineStartDate: "2026-05-18",
    baselineEndDate: "2026-05-22",
    isAtRisk: false,
    isCritical: false,
    status: "IN_PROGRESS",
    completedAt: null,
    cancelledAt: null,
    revision: 0,
    canManage: true,
    roles: [{ role: "A", person: { key: "u1", name: "Ana", available: true } }],
    ...overrides,
  };
}

function makeMilestone(overrides: Partial<TaskMilestoneRecord> = {}): TaskMilestoneRecord {
  return {
    id: "ms-1",
    title: "Revisão CAD Semana 1",
    description: "Validar interferências antes do CNC",
    targetDate: "2026-05-22",
    revision: 0,
    criteria: [
      { id: "crit-1", title: "Arquivo STEP sem erros", sortOrder: 0 },
      { id: "crit-2", title: "Massa aprovada", sortOrder: 1 },
    ],
    taskIds: ["task-1"],
    checks: [
      {
        criterionId: "crit-1",
        taskId: "task-1",
        status: "APPROVED",
        notes: null,
        checkedByName: "Ana",
        checkedAt: "2026-05-21T12:00:00.000Z",
      },
      {
        criterionId: "crit-2",
        taskId: "task-1",
        status: "PENDING",
        notes: null,
        checkedByName: null,
        checkedAt: null,
      },
    ],
    ...overrides,
  };
}

test("TaskGanttMilestoneTrack exibe marcos clicáveis e permite adicionar na semana quando canEdit=true", () => {
  let addedDate = "";
  let selectedId = "";
  const milestone = makeMilestone();

  const view = render(
    React.createElement(TaskGanttMilestoneTrack, {
      milestones: [milestone],
      fromDay: 20591,
      dayWidth: 44,
      ticks: [0, 2, 4],
      tickStep: 2,
      labelWidth: 216,
      todayIso: "2026-05-20",
      canEdit: true,
      onAddAtDate: (iso) => {
        addedDate = iso;
      },
      onSelectMilestone: (id) => {
        selectedId = id;
      },
    }),
  );

  const milestoneBtn = view.getByRole("button", {
    name: /Marco Revisão CAD Semana 1/i,
  });
  assert.ok(view.getByText("0/1"));
  fireEvent.click(milestoneBtn);
  assert.equal(selectedId, "ms-1");

  const addSlotBtn = view.getByRole("button", {
    name: /Adicionar marco na semana de 20\/05/i,
  });
  fireEvent.click(addSlotBtn);
  assert.equal(addedDate, "2026-05-20");

  view.rerender(
    React.createElement(TaskGanttMilestoneTrack, {
      milestones: [milestone],
      fromDay: 20591,
      dayWidth: 44,
      ticks: [0, 2, 4],
      tickStep: 2,
      labelWidth: 216,
      todayIso: "2026-05-20",
      canEdit: false,
      onAddAtDate: () => {},
      onSelectMilestone: () => {},
    }),
  );

  assert.equal(view.queryByRole("button", { name: /Novo marco/i }), null);
});

test("TaskGanttMilestoneFormDialog permite criar marco com critérios de aceitação e seleção de tarefas", async () => {
  let submitted: unknown = null;
  let savedCalled = false;
  const tasks = [
    makeTask({ id: "task-1", title: "Modelagem da Asa", endDate: "2026-05-20" }),
    makeTask({ id: "task-2", title: "Usinagem CNC", endDate: "2026-05-28" }),
  ];

  const view = render(
    React.createElement(TaskGanttMilestoneFormDialog, {
      open: true,
      onOpenChange: () => {},
      teamId: "team-1",
      tasks,
      defaultDate: "2026-05-22",
      onSaved: () => {
        savedCalled = true;
      },
      onSubmitMilestone: async (payload) => {
        submitted = payload;
        return { ok: true };
      },
    }),
  );

  fireEvent.input(view.getByLabelText("Nome do marco"), {
    target: { value: "Gate Projeto Aero" },
  });
  fireEvent.input(view.getByLabelText("Critério de aceitação 1"), {
    target: { value: "Simulação CFD converge abaixo de 1%" },
  });
  fireEvent.click(view.getByRole("button", { name: /Adicionar critério/i }));
  fireEvent.input(view.getByLabelText("Critério de aceitação 2"), {
    target: { value: "Massa final <= 55g" },
  });

  fireEvent.click(view.getByRole("button", { name: /Selecionar até esta data/i }));
  fireEvent.click(view.getByRole("button", { name: /Criar marco/i }));

  await waitFor(() => {
    assert.equal(savedCalled, true);
  });

  assert.deepEqual(submitted, {
    teamId: "team-1",
    title: "Gate Projeto Aero",
    description: undefined,
    targetDate: "2026-05-22",
    criteria: [
      { title: "Simulação CFD converge abaixo de 1%" },
      { title: "Massa final <= 55g" },
    ],
    taskIds: ["task-1"],
  });
});

test("TaskGanttMilestoneVerifyDialog exibe estado vazio sem tarefas e verifica critérios quando há tarefas", () => {
  let toggled: { criterionId: string; status: string } | null = null;
  const emptyMilestone = makeMilestone({ taskIds: [], checks: [] });
  const tasks = [makeTask()];

  const view = render(
    React.createElement(TaskGanttMilestoneVerifyDialog, {
      milestone: emptyMilestone,
      tasks,
      todayIso: "2026-05-20",
      canEdit: true,
      pendingCheckKey: null,
      isDeleting: false,
      onOpenChange: () => {},
      onEdit: () => {},
      onDelete: () => {},
      onToggleCheck: () => {},
    }),
  );

  assert.ok(view.getByText("Nenhuma tarefa vinculada a este marco."));
  assert.ok(view.getByText("Sem tarefas vinculadas"));

  const populated = makeMilestone();
  view.rerender(
    React.createElement(TaskGanttMilestoneVerifyDialog, {
      milestone: populated,
      tasks,
      todayIso: "2026-05-20",
      canEdit: true,
      pendingCheckKey: null,
      isDeleting: false,
      onOpenChange: () => {},
      onEdit: () => {},
      onDelete: () => {},
      onToggleCheck: (params) => {
        toggled = { criterionId: params.criterionId, status: params.status };
      },
    }),
  );

  assert.ok(view.getByText("0 de 1 tarefa aprovada"));
  assert.ok(view.getByText("Pendente", { selector: "div" }));

  const secondGroup = view.getByRole("group", {
    name: /Avaliação do critério Massa aprovada para Modelagem da Asa/i,
  });
  const approveBtn = Array.from(secondGroup.querySelectorAll("button")).find((btn) =>
    btn.textContent?.includes("Aprovado"),
  );
  assert.ok(approveBtn);
  fireEvent.click(approveBtn);
  assert.deepEqual(toggled, { criterionId: "crit-2", status: "APPROVED" });

  view.rerender(
    React.createElement(TaskGanttMilestoneVerifyDialog, {
      milestone: populated,
      tasks,
      todayIso: "2026-05-20",
      canEdit: false,
      pendingCheckKey: null,
      isDeleting: false,
      onOpenChange: () => {},
      onEdit: () => {},
      onDelete: () => {},
      onToggleCheck: () => {},
    }),
  );

  assert.equal(view.queryByRole("button", { name: /Editar marco/i }), null);
  assert.equal(view.queryByRole("button", { name: /Excluir marco/i }), null);
});

test("TaskGantt destaca caminho crítico apenas em vermelho sem losango e renderiza losango somente para marcos", async () => {
  const criticalTask = makeTask({
    id: "task-crit",
    title: "Usinagem Chassi",
    isCritical: true,
  });
  const milestone = makeMilestone({ taskIds: ["task-crit"] });

  const view = render(
    React.createElement(
      AppRouterContext.Provider,
      { value: mockRouter },
      React.createElement(TaskGantt, {
        visible: [criticalTask],
        tasks: [criticalTask],
        edges: [],
        milestones: [milestone],
        open: () => {},
        teamId: "team-1",
        canEdit: true,
      }),
    ),
  );

  const barBtn = view.getByRole("button", {
    name: /Usinagem Chassi · .*Caminho crítico/i,
  });
  const barWrapper = barBtn.parentElement;
  assert.ok(barWrapper);
  assert.ok(barWrapper.className.includes("bg-destructive"));
  assert.equal(barWrapper.querySelector(".rotate-45"), null);
  assert.equal(view.queryByTitle("Caminho crítico (define o prazo final)"), null);

  const milestoneBtn = view.getByRole("button", { name: /Marco Revisão CAD Semana 1/i });
  assert.ok(milestoneBtn.querySelector(".rotate-45"));
  fireEvent.click(milestoneBtn);

  await waitFor(() => {
    assert.ok(view.getByText(/Verificação por tarefa/i));
  });
});
