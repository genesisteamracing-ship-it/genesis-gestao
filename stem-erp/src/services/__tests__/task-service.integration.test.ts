import { strict as assert } from "node:assert";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

const database = process.env.TASKS_TEST_DATABASE_URL;
test("keeps A, enforces tenant boundaries and serializes reciprocal edges", { skip: !database }, async () => {
  const url = new URL(database!);
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) && url.pathname === "/tasks_test");
  process.env.DATABASE_URL = database;
  process.env.DATABASE_URL_UNPOOLED = database;
  const { prisma } = await import("../../lib/prisma");
  const { resolveTaskScope, saveTask, getTaskWorkspace, changeDependency, saveRiskPath, updateTaskStatus } = await import("../task-service");
  const key = randomUUID();
  const team = await prisma.team.create({ data: { name: key, slug: key } });
  const other = await prisma.team.create({ data: { name: key + "-other", slug: key + "-other" } });
  const actor = await prisma.user.create({ data: { name: "Autora", email: key + "@test.local", passwordHash: "unused", teamId: team.id, canAccessTasks: true } });
  const member = await prisma.user.create({ data: { name: "Execução", email: key + "-member@test.local", passwordHash: "unused", teamId: team.id } });
  const outsider = await prisma.user.create({ data: { name: "Externo", email: key + "-outside@test.local", passwordHash: "unused", teamId: other.id } });
  const user = {
    id: actor.id, sessionId: "test", name: actor.name, email: actor.email, role: actor.role,
    teamId: team.id, teamName: team.name, deliveryGroup: null, jobTitle: null,
    permissions: { tasks: true, finance: false, roi: false, communication: false, team: false },
  };
  const scope = await resolveTaskScope(user);
  assert.ok(scope);
  const input = {
    teamId: team.id, title: "Projeto", deliveryGroup: "ENGINEERING_CAD" as const,
    startDate: "2026-11-09", endDate: "2026-11-09", assignments: [],
  };
  await assert.rejects(saveTask(scope, { ...input, assignments: [{ memberKey: outsider.id, role: "R" }] }), /integrante ativo/);
  const a = await saveTask(scope, input);
  const b = await saveTask(scope, { ...input, title: "Usinagem", deliveryGroup: "MANUFACTURING_CNC" });
  await saveTask(scope, { ...input, id: a, revision: 0, status: "IN_PROGRESS", assignments: [{ memberKey: member.id, role: "R" }] });
  await prisma.user.update({ where: { id: member.id }, data: { isActive: false } });
  const workspace = await getTaskWorkspace(scope);
  const roles = workspace.tasks.find((item) => item.id === a)?.roles;
  assert.deepEqual(roles?.map(({ person, role }) => [person.key, person.available, role]), [[actor.id, true, "A"], [member.id, false, "R"]]);
  await assert.rejects(saveTask(scope, { ...input, id: a, revision: 0, status: "DONE" }), /atualizada/);
  const edits = await Promise.allSettled([
    changeDependency(scope, { teamId: team.id, predecessorId: a, successorId: b }, true),
    changeDependency(scope, { teamId: team.id, predecessorId: b, successorId: a }, true),
  ]);
  assert.equal(edits.filter((result) => result.status === "fulfilled").length, 1);
  const [edge] = (await getTaskWorkspace(scope)).edges;
  await saveRiskPath(scope, { teamId: team.id, name: "Risco", reason: "Prazo", taskIds: [edge.predecessorId, edge.successorId] });
  await changeDependency(scope, { teamId: team.id, ...edge }, false);
  assert.deepEqual((await getTaskWorkspace(scope)).paths[0].missing, [edge]);
  assert.equal((await resolveTaskScope({ ...user, role: "AUDITOR" }))?.canEdit, false);
  assert.equal(await resolveTaskScope({ ...user, teamId: other.id }), null);

  const admin = await prisma.user.update({ where: { id: outsider.id }, data: { role: "SUPER_ADMIN" } });
  const adminScope = await resolveTaskScope({ ...user, id: admin.id, role: admin.role });
  assert.ok(adminScope?.canEdit);
  const created = await saveTask(adminScope, { ...input, title: "Tarefa da equipe ativa" });
  const adminTask = (await getTaskWorkspace(scope)).tasks.find(({ id }) => id === created);
  assert.deepEqual(adminTask?.roles, [{ role: "A", person: { key: admin.id, name: admin.name, available: true } }]);
  await assert.rejects(saveTask(adminScope, { ...input, teamId: other.id }), /equipe ativa mudou/);
  await assert.rejects(saveTask(adminScope, { ...input, assignments: [{ memberKey: admin.id, role: "R" }] }), /integrante ativo/);
  await prisma.user.update({ where: { id: admin.id }, data: { role: "TEAM_LEAD" } });
  await assert.rejects(saveTask(adminScope, input), /acesso à equipe mudou/);
  await updateTaskStatus(scope, { teamId: team.id, taskId: b, status: "DONE", revision: 0 });
  const doneTask = (await getTaskWorkspace(scope)).tasks.find((item) => item.id === b);
  assert.ok(doneTask?.completedAt);
  assert.equal(doneTask?.cancelledAt, null);

  await updateTaskStatus(scope, { teamId: team.id, taskId: b, status: "CANCELLED", revision: 1 });
  const cancelledTask = (await getTaskWorkspace(scope)).tasks.find((item) => item.id === b);
  assert.equal(cancelledTask?.completedAt, null);
  assert.ok(cancelledTask?.cancelledAt);

  await updateTaskStatus(scope, { teamId: team.id, taskId: b, status: "TODO", revision: 2 });
  const reopenedTask = (await getTaskWorkspace(scope)).tasks.find((item) => item.id === b);
  assert.equal(reopenedTask?.completedAt, null);
  assert.equal(reopenedTask?.cancelledAt, null);

  await assert.rejects(
    updateTaskStatus(scope, { teamId: team.id, taskId: b, status: "DONE", revision: 0 }),
    /atualizada/,
  );
  const auditorScope = await resolveTaskScope({ ...user, role: "AUDITOR" });
  assert.ok(auditorScope);
  await assert.rejects(
    updateTaskStatus(auditorScope, { teamId: team.id, taskId: b, status: "DONE", revision: 3 }),
    /somente para consulta/,
  );

  await prisma.$disconnect();
});
