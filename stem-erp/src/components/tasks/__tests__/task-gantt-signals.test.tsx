import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { cleanup, render } from "@testing-library/react";
import { TaskGanttKpis } from "../task-gantt-kpis";
import { TaskGanttLegend } from "../task-gantt-legend";
import { dependencyConnectorStyles } from "../task-gantt";
import type { GanttSummary } from "@/lib/task-gantt-metrics";

function withDom(fn: () => Promise<void> | void) {
  return async () => {
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    const globals = [
      ["document", dom.window.document],
      ["window", dom.window],
      ["navigator", dom.window.navigator],
      ["HTMLElement", dom.window.HTMLElement],
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

test(
  "TaskGanttKpis renderiza os 4 cards executivos com barra de progresso acessível",
  withDom(() => {
    const summary: GanttSummary = {
      progressPercent: 78,
      criticalCount: 3,
      deviationDays: 4,
      milestoneStatus: "AT_RISK",
      milestoneLabel: "Sob atenção",
    };

    const view = render(createElement(TaskGanttKpis, { summary }));

    assert.ok(view.getByText("Progresso geral:"));
    assert.ok(view.getByText("78%"));
    const progressbar = view.getByRole("progressbar", { name: "Progresso geral do cronograma" });
    assert.equal(progressbar.getAttribute("aria-valuenow"), "78");

    assert.ok(view.getByText("Atividades críticas:"));
    assert.ok(view.getByText("3"));

    assert.ok(view.getByText("Desvio atual:"));
    assert.ok(view.getByText("+4 dias"));

    assert.ok(view.getByText("Marco final:"));
    assert.ok(view.getByText("Sob atenção"));
  }),
);

test(
  "TaskGanttKpis renderiza estado vazio e desvio zerado corretamente",
  withDom(() => {
    const summary: GanttSummary = {
      progressPercent: 0,
      criticalCount: 0,
      deviationDays: 0,
      milestoneStatus: "EMPTY",
      milestoneLabel: "Sem atividades",
    };

    const view = render(createElement(TaskGanttKpis, { summary }));

    assert.ok(view.getByText("0%"));
    assert.ok(view.getByText("0 dias"));
    assert.ok(view.getByText("Sem atividades"));
  }),
);

test(
  "TaskGanttLegend exibe todos os 5 sinais da legenda de status",
  withDom(() => {
    const view = render(createElement(TaskGanttLegend));

    assert.ok(view.getByText("Legenda (status)"));
    assert.ok(view.getByText("Verde: em dia"));
    assert.ok(view.getByText("(dentro do planejado)"));
    assert.ok(view.getByText("Amarelo: atenção"));
    assert.ok(view.getByText("(risco de atraso)"));
    assert.ok(view.getByText("Vermelho: atraso"));
    assert.ok(view.getByText("(fora do planejado)"));
    assert.ok(view.getByText("Cinza: linha de base"));
    assert.ok(view.getByText("(planejado)"));
    assert.ok(view.getByText("Caminho crítico"));
    assert.ok(view.getByText("(define o prazo final)"));
  }),
);

test(
  "TaskGanttLegend renderiza em barra horizontal compacta (flex-wrap) sem coluna vertical fixa",
  withDom(() => {
    const view = render(createElement(TaskGanttLegend, { className: "w-full" }));
    const aside = view.getByLabelText("Legenda de status do Gantt");
    const list = aside.querySelector("ul");

    assert.ok(aside.className.includes("w-full"));
    assert.ok(list);
    assert.ok(list.className.includes("flex-wrap"));
    assert.equal(list.className.includes("xl:grid-cols-1"), false);
  }),
);

test("dependencyConnectorStyles oculta a bolinha atrás da tarefa por padrão e revela com deslize no hover/foco", () => {
  const idle = dependencyConnectorStyles({ state: "idle" });
  const idleHandle = idle.handle();
  const idleStem = idle.stem();

  assert.ok(idleHandle.includes("z-[5]"));
  assert.ok(idleHandle.includes("opacity-0"));
  assert.ok(idleHandle.includes("-translate-x-5"));
  assert.ok(idleHandle.includes("pointer-events-none"));
  assert.ok(idleHandle.includes("group-hover/task:translate-x-0"));
  assert.ok(idleHandle.includes("group-hover/task:opacity-100"));
  assert.ok(idleHandle.includes("group-hover/task:pointer-events-auto"));
  assert.ok(idleHandle.includes("group-focus-within/task:translate-x-0"));
  assert.ok(idleStem.includes("scale-x-0"));
  assert.ok(idleStem.includes("group-hover/task:scale-x-100"));

  const active = dependencyConnectorStyles({ state: "active" });
  assert.ok(active.handle().includes("translate-x-0"));
  assert.ok(active.handle().includes("opacity-100"));
  assert.ok(active.handle().includes("pointer-events-auto"));
  assert.ok(active.stem().includes("scale-x-100"));

  const suppressed = dependencyConnectorStyles({ state: "suppressed" });
  assert.ok(suppressed.handle().includes("opacity-0"));
  assert.ok(suppressed.handle().includes("-translate-x-5"));
  assert.ok(suppressed.handle().includes("pointer-events-none"));
  assert.ok(suppressed.stem().includes("scale-x-0"));
});
