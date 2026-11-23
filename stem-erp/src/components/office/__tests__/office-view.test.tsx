import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import type { OfficeSnapshotDTO } from "@/types/office";
import { OfficeView } from "../office-view";

function withDom(fn: () => Promise<void> | void) {
  return async () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");

    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    class DOMMatrixReadOnlyMock {
      m22 = 1;
      constructor() {}
    }

    class IntersectionObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    const pendingFrames = new Set<ReturnType<typeof setTimeout>>();

    const scheduleStub = (cb: () => void) => {
      const id = setTimeout(() => {
        pendingFrames.delete(id);
        cb();
      }, 0);
      pendingFrames.add(id);
      return id as unknown as number;
    };
    const cancelStub = (id: number) => {
      const timer = id as unknown as ReturnType<typeof setTimeout>;
      clearTimeout(timer);
      pendingFrames.delete(timer);
    };

    Object.defineProperty(dom.window, "requestIdleCallback", {
      configurable: true,
      value: (cb: () => void) => scheduleStub(cb),
    });
    Object.defineProperty(dom.window, "cancelIdleCallback", {
      configurable: true,
      value: cancelStub,
    });

    const globals = [
      ["document", dom.window.document],
      ["window", dom.window],
      ["self", dom.window],
      ["navigator", dom.window.navigator],
      ["HTMLElement", dom.window.HTMLElement],
      ["HTMLFormElement", dom.window.HTMLFormElement],
      ["SVGElement", dom.window.SVGElement],
      ["Element", dom.window.Element],
      ["Node", dom.window.Node],
      ["ResizeObserver", ResizeObserverMock],
      ["IntersectionObserver", IntersectionObserverMock],
      ["DOMMatrixReadOnly", DOMMatrixReadOnlyMock],
      ["requestAnimationFrame", (cb: FrameRequestCallback) => scheduleStub(() => cb(Date.now()))],
      ["cancelAnimationFrame", cancelStub],
    ] as const;

    const originals = globals.map(
      ([key]) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const
    );

    for (const [key, value] of globals) {
      Object.defineProperty(globalThis, key, { configurable: true, value });
    }

    try {
      await fn();
    } finally {
      cleanup();
      for (const timer of pendingFrames) {
        clearTimeout(timer);
      }
      pendingFrames.clear();
      for (const [key, desc] of originals) {
        if (desc) Object.defineProperty(globalThis, key, desc);
        else Reflect.deleteProperty(globalThis, key);
      }
      dom.window.close();
    }
  };
}

function makeSnapshot(overrides: Partial<OfficeSnapshotDTO> = {}): OfficeSnapshotDTO {
  return {
    teamId: "team-1",
    teamName: "Equipe Gênesis",
    currentUserId: "u-1",
    canAccessTasks: true,
    generatedAt: "2026-11-23T15:00:00.000Z",
    members: [
      {
        id: "u-1",
        name: "Marina Silva",
        email: "marina@genesis.dev",
        jobTitle: "Engenheira CAD",
        role: "TEAM_LEAD",
        deliveryGroup: "ENGINEERING_CAD",
        status: "WORKING",
        activeTask: {
          id: "t-1",
          title: "Modelagem da asa dianteira",
          description: null,
          deliveryGroup: "ENGINEERING_CAD",
          startDate: "2026-11-01",
          endDate: "2026-11-28",
          status: "IN_PROGRESS",
          role: "R",
          isOverdue: false,
          revision: 0,
        },
        activeTasksCount: 1,
        todoTasksCount: 1,
        doneTasksCount: 2,
        overdueTasksCount: 0,
        tasks: [
          {
            id: "t-1",
            title: "Modelagem da asa dianteira",
            description: null,
            deliveryGroup: "ENGINEERING_CAD",
            startDate: "2026-11-01",
            endDate: "2026-11-28",
            status: "IN_PROGRESS",
            role: "R",
            isOverdue: false,
            revision: 0,
          },
        ],
        lastLoginAt: null,
        isCurrentUser: true,
      },
      {
        id: "u-2",
        name: "Lucas Mendes",
        email: "lucas@genesis.dev",
        jobTitle: "Operador CNC",
        role: "TEAM_LEAD",
        deliveryGroup: "MANUFACTURING_CNC",
        status: "IDLE",
        activeTask: null,
        activeTasksCount: 0,
        todoTasksCount: 0,
        doneTasksCount: 1,
        overdueTasksCount: 0,
        tasks: [],
        lastLoginAt: null,
        isCurrentUser: false,
      },
    ],
    summary: {
      totalMembers: 2,
      workingCount: 1,
      overdueCount: 0,
      idleCount: 1,
      totalInProgressTasks: 1,
      totalDoneTasks: 3,
    },
    ...overrides,
  };
}

test(
  "OfficeView renderiza estado de carregamento (Skeleton)",
  withDom(() => {
    const view = render(
      createElement(OfficeView, {
        initialSnapshot: null,
        isLoadingInitial: true,
        pollIntervalMs: 0,
      })
    );
    assert.ok(view.getByLabelText("Carregando escritório virtual"));
  })
);

test(
  "OfficeView renderiza estado de erro e permite tentar novamente",
  withDom(async () => {
    let called = 0;
    const view = render(
      createElement(OfficeView, {
        initialSnapshot: null,
        initialError: "Falha ao consultar banco.",
        pollIntervalMs: 0,
        onRefresh: async () => {
          called += 1;
          return { success: true, data: makeSnapshot() };
        },
      })
    );

    assert.ok(view.getByText("Não foi possível carregar o escritório virtual"));
    fireEvent.click(view.getByRole("button", { name: /Tentar novamente/i }));

    await waitFor(() => {
      assert.equal(called, 1);
      assert.ok(view.getByText(/Planta da Equipe — Equipe Gênesis/i));
    });
  })
);

test(
  "OfficeView renderiza estado vazio quando não há integrantes ativos",
  withDom(() => {
    const view = render(
      createElement(OfficeView, {
        initialSnapshot: makeSnapshot({
          members: [],
          summary: {
            totalMembers: 0,
            workingCount: 0,
            overdueCount: 0,
            idleCount: 0,
            totalInProgressTasks: 0,
            totalDoneTasks: 0,
          },
        }),
        pollIntervalMs: 0,
      })
    );

    assert.ok(view.getByText("Nenhum integrante ativo na equipe"));
  })
);

test(
  "OfficeView exibe escritório, alterna para modo Lista e filtra integrantes",
  withDom(() => {
    const view = render(
      createElement(OfficeView, {
        initialSnapshot: makeSnapshot(),
        pollIntervalMs: 0,
      })
    );

    assert.ok(view.getByText(/Planta da Equipe — Equipe Gênesis/i));
    assert.ok(view.getAllByText("Modelagem da asa dianteira").length >= 1);

    // Alterna para visualização em Lista
    fireEvent.click(view.getByRole("tab", { name: /Lista/i }));
    assert.ok(view.getByText("Nenhuma tarefa em execução"));

    // Busca no HUD filtra para Lucas
    const searchInput = view.getByLabelText("Buscar integrante ou tarefa");
    fireEvent.change(searchInput, { target: { value: "Lucas" } });
    assert.ok(view.getAllByText("Lucas Mendes").length >= 1);
  })
);
