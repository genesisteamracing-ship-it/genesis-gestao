import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { cleanup, fireEvent, render, renderHook, act, within } from "@testing-library/react";
import type { TaskRecord, TaskWorkspace } from "@/types/tasks";
import { MyActivitiesView } from "../my-activities-view";
import { useMyActivities } from "../use-my-activities";

function withDom(fn: () => Promise<void> | void) {
  return async () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    const globals = [
      ["document", dom.window.document],
      ["window", dom.window],
      ["navigator", dom.window.navigator],
      ["HTMLElement", dom.window.HTMLElement],
      ["HTMLFormElement", dom.window.HTMLFormElement],
      ["Element", dom.window.Element],
      ["Node", dom.window.Node],
    ] as const;
    const originals = globals.map(([key]) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
    for (const [key, value] of globals) {
      Object.defineProperty(globalThis, key, { configurable: true, value });
    }
    try {
      await fn();
    } finally {
      cleanup();
      for (const [key, desc] of originals) {
        if (desc) Object.defineProperty(globalThis, key, desc);
        else Reflect.deleteProperty(globalThis, key);
      }
      dom.window.close();
    }
  };
}

const TODAY = "2026-11-12";
const me = { key: "user-1", name: "Marina", available: true };
const other = { key: "user-2", name: "Lucas", available: true };

function makeTask(overrides: Partial<TaskRecord>): TaskRecord {
  return {
    id: "t-1",
    title: "Atividade padrão",
    description: null,
    deliveryGroup: "ENGINEERING_CAD",
    startDate: "2026-11-01",
    endDate: "2026-11-15",
    status: "TODO",
    completedAt: null,
    cancelledAt: null,
    revision: 0,
    roles: [
      { role: "A", person: other },
      { role: "R", person: me },
    ],
    ...overrides,
  };
}

function makeWorkspace(tasks: TaskRecord[], canEdit = true): TaskWorkspace {
  return {
    teamId: "team-1",
    currentUserId: "user-1",
    canEdit,
    members: [me, other],
    tasks,
    edges: [],
    paths: [],
  };
}

test(
  "MyActivitiesView renderiza estado de carregamento (Skeleton)",
  withDom(() => {
    const view = render(
      createElement(MyActivitiesView, {
        workspace: makeWorkspace([]),
        isLoading: true,
        onOpenDetail: () => {},
      }),
    );
    assert.ok(view.getByLabelText("Carregando minhas atividades"));
  }),
);

test(
  "MyActivitiesView renderiza estado vazio com KPIs zerados quando não há tarefas atribuídas",
  withDom(() => {
    const workspace = makeWorkspace([
      makeTask({
        id: "not-mine",
        title: "De outra pessoa",
        roles: [
          { role: "A", person: me },
          { role: "R", person: other },
        ],
      }),
    ]);
    const view = render(
      createElement(MyActivitiesView, {
        workspace,
        todayIso: TODAY,
        onOpenDetail: () => {},
      }),
    );
    assert.ok(view.getByText("Você não possui atividades atribuídas no momento."));
    const kpiRegion = view.getByRole("region", { name: "Indicadores de desempenho individual" });
    assert.ok(within(kpiRegion).getByText("Total atribuído"));
    assert.ok(within(kpiRegion).getByText("—"));
  }),
);

test(
  "MyActivitiesView ordena por prazo limite, exibe KPIs e pagina em 10 itens",
  withDom(() => {
    const tasks: TaskRecord[] = [
      makeTask({ id: "overdue", title: "Entrega atrasada", endDate: "2026-11-10", status: "TODO" }),
      makeTask({ id: "today", title: "Entrega hoje", endDate: "2026-11-12", status: "IN_PROGRESS" }),
      makeTask({
        id: "done",
        title: "Entrega concluída",
        endDate: "2026-11-08",
        status: "DONE",
        completedAt: "2026-11-08T10:00:00Z",
      }),
      ...Array.from({ length: 9 }, (_, index) =>
        makeTask({
          id: `future-${index + 1}`,
          title: `Atividade futura ${index + 1}`,
          endDate: `2026-11-${String(14 + index).padStart(2, "0")}`,
          status: "TODO",
        }),
      ),
    ];

    const view = render(
      createElement(MyActivitiesView, {
        workspace: makeWorkspace(tasks),
        todayIso: TODAY,
        onOpenDetail: () => {},
      }),
    );

    const rows = within(view.getByRole("table", { name: "Minhas atividades" })).getAllByRole("row");
    // 1 header + 10 rows (fixed pageSize = 10)
    assert.equal(rows.length, 11);
    assert.match(rows[1].textContent ?? "", /Entrega atrasada/);
    assert.match(rows[1].textContent ?? "", /Atrasada há 2 dias/);
    assert.match(rows[2].textContent ?? "", /Entrega hoje/);
    assert.match(rows[2].textContent ?? "", /Vence hoje/);

    assert.ok(view.getByText("Mostrando 1-10 de 12 atividades"));
    assert.ok(view.getByText("Página 1 de 2"));

    fireEvent.click(view.getByRole("button", { name: "Próxima página" }));
    assert.ok(view.getByText("Mostrando 11-12 de 12 atividades"));
    assert.ok(view.getByText("Página 2 de 2"));

    const kpiRegion = view.getByRole("region", { name: "Indicadores de desempenho individual" });
    assert.ok(within(kpiRegion).getByText("12"));
    assert.ok(within(kpiRegion).getByText("100%"));
  }),
);

test(
  "MyActivitiesView bloqueia alteração de status para AUDITOR (canEdit = false) e useMyActivities atualiza status e KPIs",
  withDom(async () => {
    const task = makeTask({ id: "t-edit", title: "Revisar relatório", endDate: "2026-11-14", status: "TODO" });

    const auditorView = render(
      createElement(MyActivitiesView, {
        workspace: makeWorkspace([task], false),
        todayIso: TODAY,
        onOpenDetail: () => {},
      }),
    );
    assert.equal(auditorView.queryByLabelText("Status de Revisar relatório"), null);
    assert.ok(auditorView.getByText("A fazer"));
    auditorView.unmount();

    const failHook = renderHook(() =>
      useMyActivities({
        workspace: makeWorkspace([task], true),
        todayIso: TODAY,
        onUpdateStatus: async () => ({ ok: false, message: "Conflito de revisão" }),
      }),
    );
    await act(async () => {
      await failHook.result.current.handleStatusChange(task, "DONE");
    });
    assert.equal(failHook.result.current.errorMessage, "Conflito de revisão");
    assert.equal(failHook.result.current.kpis.completedCount, 0);

    const okHook = renderHook(() =>
      useMyActivities({
        workspace: makeWorkspace([task], true),
        todayIso: TODAY,
        onUpdateStatus: async () => ({ ok: true }),
      }),
    );
    await act(async () => {
      await okHook.result.current.handleStatusChange(task, "DONE");
    });
    assert.equal(okHook.result.current.kpis.completedCount, 1);
    assert.equal(okHook.result.current.kpis.completionRate, 100);

    await act(async () => {
      await okHook.result.current.handleStatusChange(
        okHook.result.current.allMyItems[0].task,
        "CANCELLED",
      );
    });
    assert.equal(okHook.result.current.kpis.cancelledCount, 1);
    assert.equal(okHook.result.current.kpis.completedCount, 0);
  }),
);
