import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { render, within } from "@testing-library/react";
import { TaskRaci } from "../task-raci";
import type { TaskRecord } from "@/types/tasks";

test("RACI identifies A and the pending executor", () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const original = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", { configurable: true, value: dom.window.document });
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: dom.window });
  try {
    const author = { key: "one", name: "Ana", available: true };
    const member = { key: "two", name: "Bruno", available: true };
    const task: TaskRecord = {
      id: "task", title: "Prototipar", description: null, deliveryGroup: "ENGINEERING_CAD",
      startDate: "2026-11-09", endDate: "2026-11-09", status: "TODO", revision: 0,
      roles: [{ role: "A", person: author }],
    };
    const view = render(createElement(TaskRaci, { tasks: [task], members: [author, member] }));
    assert.ok(view.getByRole("columnheader", { name: "Ana" }));
    assert.ok(view.getByText("Sem executor"));
    assert.equal(view.getByRole("cell", { name: "A" }).textContent, "A");
    assert.ok(view.getByRole("cell", { name: "—" }));
    assert.equal(within(view.getByRole("list", { name: "Legenda RACI" })).getAllByRole("listitem").length, 4);
    view.rerender(createElement(TaskRaci, { members: [author, member], tasks: [{
      ...task,
      roles: [...task.roles, { role: "R", person: member }, { role: "C", person: member }, { role: "I", person: member }],
    }] }));
    const cells = within(view.getByRole("row", { name: /Prototipar/ })).getAllByRole("cell");
    assert.deepEqual(within(cells[1]).getAllByRole("listitem").map((item) => item.textContent), ["R", "C", "I"]);
    view.unmount();
  } finally {
    if (original) Object.defineProperty(globalThis, "document", original);
    else Reflect.deleteProperty(globalThis, "document");
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    dom.window.close();
  }
});
