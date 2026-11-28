import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { JSDOM } from "jsdom";
import * as React from "react";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:3000/presenca",
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
  screen,
  waitFor,
} = require("@testing-library/react") as typeof import("@testing-library/react");
const {
  TrainingAttendanceView,
} = require("../training-attendance-view") as typeof import("../training-attendance-view");
/* eslint-enable @typescript-eslint/no-require-imports */

import type { AttendanceTrackedMemberDTO } from "@/types/attendance";
import type { OfficeAttendanceDTO } from "@/types/office";

afterEach(() => {
  cleanup();
});

const SAMPLE_MEMBERS: AttendanceTrackedMemberDTO[] = [
  {
    id: "u-1",
    name: "Geovanna",
    email: "geovanna@genesis.dev",
    deliveryGroup: "PROJECT_MANAGEMENT",
    jobTitle: "Gestora",
    role: "TEAM_LEAD",
  },
  {
    id: "u-2",
    name: "Artur",
    email: "artur@genesis.dev",
    deliveryGroup: "MANUFACTURING_CNC",
    jobTitle: "Engenheiro Manufatura",
    role: "TEAM_LEAD",
  },
  {
    id: "u-3",
    name: "Isaac Leal",
    email: "isaac@genesis.dev",
    deliveryGroup: "ENGINEERING_CAD",
    jobTitle: "Engenheiro de Projeto",
    role: "TEAM_LEAD",
  },
];

const SAMPLE_ATTENDANCES: OfficeAttendanceDTO[] = [
  {
    id: "att-1",
    userId: "u-1",
    userName: "Geovanna",
    deliveryGroup: "PROJECT_MANAGEMENT",
    jobTitle: "Gestora",
    date: "2026-11-26",
    checkedAt: "2026-11-26T14:10:00.000Z",
    notes: "Pauta de projeto",
  },
  {
    id: "att-2",
    userId: "u-2",
    userName: "Artur",
    deliveryGroup: "MANUFACTURING_CNC",
    jobTitle: "Engenheiro Manufatura",
    date: "2026-11-26",
    checkedAt: "2026-11-26T14:20:00.000Z",
    notes: null,
  },
  {
    id: "att-3",
    userId: "u-1",
    userName: "Geovanna",
    deliveryGroup: "PROJECT_MANAGEMENT",
    jobTitle: "Gestora",
    date: "2026-11-27",
    checkedAt: "2026-11-27T14:05:00.000Z",
    notes: null,
  },
];

test("TrainingAttendanceView renderiza estado de Loading (Skeleton)", () => {
  render(
    React.createElement(TrainingAttendanceView, {
      members: [],
      attendances: [],
      isLoading: true,
    })
  );

  assert.ok(screen.getByLabelText("Carregando presença nos treinos"));
});

test("TrainingAttendanceView renderiza estado de Erro e executa retry", () => {
  let retried = 0;
  render(
    React.createElement(TrainingAttendanceView, {
      members: [],
      attendances: [],
      error: "Falha ao consultar presenças.",
      onRetry: () => {
        retried += 1;
      },
    })
  );

  assert.ok(
    screen.getByText("Não foi possível carregar os registros de presença")
  );
  fireEvent.click(screen.getByRole("button", { name: /Tentar novamente/i }));
  assert.equal(retried, 1);
});

test("TrainingAttendanceView renderiza Empty State quando não há presenças", () => {
  render(
    React.createElement(TrainingAttendanceView, {
      members: SAMPLE_MEMBERS,
      attendances: [],
    })
  );

  assert.ok(screen.getByText("Nenhuma presença registrada ainda"));
});

test("TrainingAttendanceView exibe dashboards, faltas automáticas e exporta relatórios", async () => {
  const exportedIndividualPdf: string[] = [];
  const exportedIndividualCsv: string[] = [];
  let exportedTeamPdfCalls = 0;

  render(
    React.createElement(TrainingAttendanceView, {
      members: SAMPLE_MEMBERS,
      attendances: SAMPLE_ATTENDANCES,
      todayIso: "2026-11-28",
      teamName: "Equipe Gênesis",
      seasonLabel: "2025/2026",
      onExportIndividualPdfOverride: ({ memberSummary }) => {
        exportedIndividualPdf.push(memberSummary.userId);
      },
      onExportIndividualCsvOverride: ({ memberSummary }) => {
        exportedIndividualCsv.push(memberSummary.userId);
      },
      onExportTeamPdfOverride: () => {
        exportedTeamPdfCalls += 1;
      },
    })
  );

  // KPIs e Gráficos
  assert.ok(screen.getByText("Taxa de Presença"));
  assert.ok(screen.getByText("50.0%"));
  assert.ok(screen.getByText("Presenças e Faltas por Treino"));
  assert.ok(screen.getByText("Proporção Geral"));
  assert.ok(screen.getByText("Frequência por Integrante"));
  assert.ok(screen.getByText("Taxa de Presença por Setor (%)"));

  // Presenças e Faltas Automáticas na tabela
  assert.ok(screen.getAllByText("Presente").length >= 3);
  assert.ok(screen.getAllByText("Falta").length >= 3);

  // Filtro de busca na tabela diária
  const searchInput = screen.getByLabelText(
    "Buscar registro por integrante ou setor"
  );
  fireEvent.change(searchInput, { target: { value: "Isaac" } });
  assert.ok(screen.getByText("Mostrando 1-02 de 2 registros"));
  fireEvent.change(searchInput, { target: { value: "" } });

  // Exportação Geral (PDF)
  fireEvent.click(
    screen.getByRole("button", { name: /Relatório Geral \(PDF\)/i })
  );
  await waitFor(() => {
    assert.equal(exportedTeamPdfCalls, 1);
  });

  // Alternar para aba Resumo por Integrante e abrir Menu de Engrenagem
  const membersTab = screen.getByRole("tab", { name: /Resumo por Integrante/i });
  fireEvent.mouseDown(membersTab);
  fireEvent.click(membersTab);

  await waitFor(() => {
    assert.ok(screen.getByText("100%"));
  });

  const gearButton = screen.getAllByRole("button", {
    name: /Ações para Geovanna/i,
  })[0];
  fireEvent.pointerDown(gearButton, { button: 0, pointerType: "mouse" });

  await waitFor(() => {
    assert.ok(screen.getByText("Relatório Individual (PDF)"));
  });
  fireEvent.click(screen.getByText("Relatório Individual (PDF)"));
  await waitFor(() => {
    assert.deepEqual(exportedIndividualPdf, ["u-1"]);
  });

  // Abrir novamente para exportar CSV individual da linha
  await waitFor(() => {
    const btn = screen.getAllByRole("button", {
      name: /Ações para Geovanna/i,
    })[0] as HTMLButtonElement;
    assert.equal(btn.disabled, false);
  });
  const gearButtonAgain = screen.getAllByRole("button", {
    name: /Ações para Geovanna/i,
  })[0];
  fireEvent.keyDown(gearButtonAgain, { key: "Enter" });
  await waitFor(() => {
    assert.ok(screen.getByText("Histórico Individual (CSV)"));
  });
  fireEvent.click(screen.getByText("Histórico Individual (CSV)"));
  await waitFor(() => {
    assert.deepEqual(exportedIndividualCsv, ["u-1"]);
  });

  // Abrir modal de Relatório Individual no topo e submeter
  fireEvent.click(
    screen.getByRole("button", { name: /Relatório Individual/i })
  );
  await waitFor(() => {
    assert.ok(screen.getByText("Exportar Relatório"));
  });
  fireEvent.click(screen.getByRole("button", { name: /Exportar Relatório/i }));
  await waitFor(() => {
    assert.equal(exportedIndividualPdf.length, 2);
  });
});

test("TrainingAttendanceView pagina em blocos fixos de 10 com 4 controles de navegação", () => {
  const manyMembers: AttendanceTrackedMemberDTO[] = Array.from(
    { length: 12 },
    (_, idx) => ({
      id: `m-${idx + 1}`,
      name: `Integrante ${String(idx + 1).padStart(2, "0")}`,
      email: `m${idx + 1}@genesis.dev`,
      deliveryGroup: "ENGINEERING_CAD",
      jobTitle: "Integrante",
      role: "TEAM_LEAD",
    })
  );

  const singleAttendance: OfficeAttendanceDTO[] = [
    {
      id: "att-pag-1",
      userId: "m-1",
      userName: "Integrante 01",
      deliveryGroup: "ENGINEERING_CAD",
      jobTitle: "Integrante",
      date: "2026-11-27",
      checkedAt: "2026-11-27T14:00:00.000Z",
      notes: null,
    },
  ];

  render(
    React.createElement(TrainingAttendanceView, {
      members: manyMembers,
      attendances: singleAttendance,
      todayIso: "2026-11-28",
    })
  );

  assert.ok(screen.getByText("Mostrando 1-10 de 12 registros"));
  assert.ok(screen.getByText("Página 1 de 2"));
  assert.ok(screen.getByRole("button", { name: "Primeira página" }));
  assert.ok(screen.getByRole("button", { name: "Página anterior" }));
  assert.ok(screen.getByRole("button", { name: "Próxima página" }));
  assert.ok(screen.getByRole("button", { name: "Última página" }));

  fireEvent.click(screen.getByRole("button", { name: "Próxima página" }));
  assert.ok(screen.getByText("Mostrando 11-12 de 12 registros"));
  assert.ok(screen.getByText("Página 2 de 2"));
});
