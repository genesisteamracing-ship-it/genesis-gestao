import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import type { OfficeSnapshotDTO } from "@/types/office";
import { OfficeAttendanceTable } from "../office-attendance-table";
import { OfficeView } from "../office-view";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/office",
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class DOMMatrixReadOnlyMock {
  m22 = 1;
}

class IntersectionObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(dom.window, "requestIdleCallback", {
  configurable: true,
  value: () => 0,
});
Object.defineProperty(dom.window, "cancelIdleCallback", {
  configurable: true,
  value: () => {},
});

Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  HTMLFormElement: dom.window.HTMLFormElement,
  SVGElement: dom.window.SVGElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  ResizeObserver: ResizeObserverMock,
  IntersectionObserver: IntersectionObserverMock,
  DOMMatrixReadOnly: DOMMatrixReadOnlyMock,
  requestAnimationFrame: () => 0,
  cancelAnimationFrame: () => {},
});

if (typeof globalThis.navigator === "undefined") {
  Object.defineProperty(globalThis, "navigator", {
    value: dom.window.navigator,
    configurable: true,
  });
}

afterEach(() => {
  cleanup();
});

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

test("OfficeView renderiza estado de carregamento (Skeleton)", () => {
  const view = render(
    createElement(OfficeView, {
      initialSnapshot: null,
      isLoadingInitial: true,
      pollIntervalMs: 0,
    })
  );
  assert.ok(view.getByLabelText("Carregando escritório virtual"));
});

test("OfficeView renderiza estado de erro e permite tentar novamente", async () => {
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
});

test("OfficeView renderiza estado vazio quando não há integrantes ativos", () => {
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
});

test("OfficeView exibe escritório, alterna para modo Lista e filtra integrantes", () => {
  const view = render(
    createElement(OfficeView, {
      initialSnapshot: makeSnapshot(),
      pollIntervalMs: 0,
    })
  );

  assert.ok(view.getByText(/Planta da Equipe — Equipe Gênesis/i));
  assert.ok(view.getAllByText("Modelagem da asa dianteira").length >= 1);
  assert.equal(view.container.querySelector(".react-flow__minimap"), null);

  // Alterna para visualização em Lista
  fireEvent.click(view.getByRole("tab", { name: /Lista/i }));
  assert.ok(view.getByText("Nenhuma tarefa em execução"));

  // Busca no HUD filtra para Lucas
  const searchInput = view.getByLabelText("Buscar integrante ou tarefa");
  fireEvent.change(searchInput, { target: { value: "Lucas" } });
  assert.ok(view.getAllByText("Lucas Mendes").length >= 1);
});

test("OfficeView permite marcar presença sem renderizar a tabela de presença no escritório", async () => {
  let markCalls = 0;
  const view = render(
    createElement(OfficeView, {
      initialSnapshot: makeSnapshot({
        canMarkAttendance: true,
        hasMarkedAttendanceToday: false,
        todayIso: "2026-11-25",
        attendances: [],
      }),
      pollIntervalMs: 0,
      onMarkAttendance: async () => {
        markCalls += 1;
        return {
          success: true,
          message: "Presença marcada com sucesso!",
          data: makeSnapshot({
            canMarkAttendance: true,
            hasMarkedAttendanceToday: true,
            todayIso: "2026-11-25",
            attendances: [
              {
                id: "att-1",
                userId: "u-1",
                userName: "Marina Silva",
                deliveryGroup: "ENGINEERING_CAD",
                jobTitle: "Engenheira CAD",
                date: "2026-11-25",
                checkedAt: "2026-11-25T16:30:00.000Z",
                notes: null,
              },
            ],
          }),
        };
      },
    })
  );

  assert.equal(view.queryByText("Presença nos Treinos"), null);
  const markBtn = view.getByRole("button", { name: /Marcar Presença/i });
  fireEvent.click(markBtn);

  await waitFor(() => {
    assert.equal(markCalls, 1);
    assert.ok(view.getByRole("button", { name: /Presença marcada hoje/i }));
  });
});

test("OfficeAttendanceTable exibe registros de presença nos treinos com data formatada", () => {
  const view = render(
    createElement(OfficeAttendanceTable, {
      todayIso: "2026-11-25",
      attendances: [
        {
          id: "att-1",
          userId: "u-1",
          userName: "Marina Silva",
          deliveryGroup: "ENGINEERING_CAD",
          jobTitle: "Engenheira CAD",
          date: "2026-11-25",
          checkedAt: "2026-11-25T16:30:00.000Z",
          notes: null,
        },
      ],
    })
  );

  assert.ok(view.getByText("Presença nos Treinos"));
  assert.ok(view.getAllByText("25/11/2026").length >= 2);
  assert.ok(view.getByText("Presente"));
});
