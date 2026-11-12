import assert from "node:assert/strict";
import test from "node:test";
import { UserRole } from "@prisma/client";
import { canManageTask, hasElevatedTaskAuthority } from "../task-permissions";

test("AUDITOR nunca pode gerenciar tarefas mesmo sendo criador ou tendo cargo", () => {
  assert.equal(
    canManageTask({ id: "u1", role: UserRole.AUDITOR, jobTitle: "Gestora de Projetos" }, "u1"),
    false,
  );
});

test("SUPER_ADMIN, Técnico, Admin e Gestora de Projetos podem alterar/excluir qualquer tarefa", () => {
  assert.equal(hasElevatedTaskAuthority({ id: "sa", role: UserRole.SUPER_ADMIN }), true);
  assert.equal(
    canManageTask({ id: "sa", role: UserRole.SUPER_ADMIN }, "outro-criador"),
    true,
  );
  assert.equal(
    canManageTask({ id: "tec", role: UserRole.TEAM_LEAD, jobTitle: "Técnico da Equipe" }, "outro"),
    true,
  );
  assert.equal(
    canManageTask({ id: "adm", role: UserRole.FINANCE_MANAGER, jobTitle: "Admin Geral" }, "outro"),
    true,
  );
  assert.equal(
    canManageTask({ id: "gp", role: UserRole.TEAM_LEAD, jobTitle: "Gestora de Projetos" }, "outro"),
    true,
  );
});

test("Integrante comum só pode alterar ou excluir tarefa criada por ele mesmo", () => {
  const member = { id: "member-1", role: UserRole.TEAM_LEAD, jobTitle: "Líder de CAD" };
  assert.equal(canManageTask(member, "member-1"), true);
  assert.equal(canManageTask(member, "member-2"), false);
  assert.equal(canManageTask(member, null), false);
});
