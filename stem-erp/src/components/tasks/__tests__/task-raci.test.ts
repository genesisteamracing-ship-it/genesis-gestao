import assert from "node:assert/strict";
import { test } from "node:test";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { render } from "@testing-library/react";
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
    const task: TaskRecord = {
      id: "task", title: "Prototipar", description: null, deliveryGroup: "ENGINEERING_CAD",
      startDate: "2026-11-09", endDate: "2026-11-09", status: "TODO", revision: 0,
      roles: [{ role: "A", person: author }],
    };
    const view = render(createElement(TaskRaci, { tasks: [task], members: [author] }));
    assert.ok(view.getByRole("columnheader", { name: "Ana" }));
    assert.ok(view.getByText("Sem executor"));
    assert.equal(view.getByRole("cell", { name: "A" }).textContent, "A");
    view.unmount();
  } finally {
    if (original) Object.defineProperty(globalThis, "document", original);
    else Reflect.deleteProperty(globalThis, "document");
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    dom.window.close();
  }
});
