import assert from "node:assert/strict";
import { test } from "node:test";
import type { TaskPerson } from "@/types/tasks";

test("RACI assignment logic excludes responsible from consulted and marks remaining as informed", () => {
  const members: TaskPerson[] = [
    { key: "ana", name: "Ana", available: true },
    { key: "artur", name: "Artur", available: true },
    { key: "geovanna", name: "Geovanna", available: true },
    { key: "isaac", name: "Isaac Leal", available: true },
    { key: "ane", name: "Ane Gaby", available: true },
  ];

  const authorKey = "ana";
  let selectedResponsibleKeys = ["artur"];
  let selectedConsultedKeys = ["geovanna"];

  // 1. Consulted options must exclude responsible members and author
  const getConsultedOptions = (responsible: string[]) =>
    members.filter(
      (m) => !responsible.includes(m.key) && m.key !== authorKey && m.available
    );

  let consultedOptions = getConsultedOptions(selectedResponsibleKeys);
  assert.ok(!consultedOptions.some((m) => m.key === "artur"), "Artur não pode aparecer em consultados quando é responsável");
  assert.ok(!consultedOptions.some((m) => m.key === "ana"), "Ana (autora) não pode aparecer em consultados");
  assert.ok(consultedOptions.some((m) => m.key === "geovanna"), "Geovanna pode aparecer em consultados");
  assert.ok(consultedOptions.some((m) => m.key === "isaac"), "Isaac pode aparecer em consultados");
  assert.ok(consultedOptions.some((m) => m.key === "ane"), "Ane pode aparecer em consultados");

  // 2. Automatic calculation of informed members
  const getAutoInformedKeys = (responsible: string[], consulted: string[]) =>
    members
      .filter(
        (m) =>
          m.available &&
          m.key !== authorKey &&
          !responsible.includes(m.key) &&
          !consulted.includes(m.key)
      )
      .map((m) => m.key);

  let autoInformed = getAutoInformedKeys(selectedResponsibleKeys, selectedConsultedKeys);
  assert.deepEqual(autoInformed.sort(), ["ane", "isaac"].sort(), "Quem não é A, R ou C deve ser automaticamente informado");

  // 3. If an existing consulted member is added to responsible, they are removed from consulted
  const newResponsibleKey = "geovanna";
  selectedResponsibleKeys = [...selectedResponsibleKeys, newResponsibleKey];
  selectedConsultedKeys = selectedConsultedKeys.filter((k) => k !== newResponsibleKey);

  consultedOptions = getConsultedOptions(selectedResponsibleKeys);
  assert.ok(!consultedOptions.some((m) => m.key === "geovanna"), "Geovanna não pode mais aparecer em consultados");

  autoInformed = getAutoInformedKeys(selectedResponsibleKeys, selectedConsultedKeys);
  assert.deepEqual(autoInformed.sort(), ["ane", "isaac"].sort(), "Informados permanecem atualizados e consistentes");

  // 4. Assignments payload has no duplicates and contains all members
  const assignments = [
    ...selectedResponsibleKeys.map((memberKey) => ({ role: "R" as const, memberKey })),
    ...selectedConsultedKeys.map((memberKey) => ({ role: "C" as const, memberKey })),
    ...autoInformed.map((memberKey) => ({ role: "I" as const, memberKey })),
  ];

  const assignedKeys = assignments.map((a) => a.memberKey);
  assert.equal(new Set(assignedKeys).size, assignedKeys.length, "Cada membro tem papel único");
  assert.ok(!assignedKeys.includes(authorKey), "Autor A não é enviado em assignments");
  assert.equal(assignments.length, members.length - 1, "Todos os demais membros recebem um papel (R, C ou I)");
});
