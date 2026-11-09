import type { Page } from "@playwright/test";
import { expect, openTaskMenu, openTaskView, test } from "./tasks.fixtures";

export async function createTaskThroughForm(page: Page, title: string, sector: string, date: string) {
  await page.getByRole("button", { name: "Nova tarefa" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Título").fill(title);
  await dialog.getByRole("combobox", { name: "Setor", exact: true }).click();
  await page.getByRole("option", { name: sector, exact: true }).click();
  await dialog.getByLabel("Início", { exact: true }).fill(date);
  await dialog.getByLabel("Término", { exact: true }).fill(date);
  await dialog.getByRole("button", { name: "Salvar tarefa" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("row").filter({ hasText: title })).toBeVisible();
}

test("assigns the author as A and two people as R", async ({ page, loginAs }, info) => {
  const title = "RACI " + info.project.name;
  await loginAs("editor");
  await page.goto("/tarefas");
  await createTaskThroughForm(page, title, "Engenharia & CAD", "2026-11-09");
  await expect(page.getByRole("row").filter({ hasText: title })).toContainText("Sem executor");
  await page.getByRole("button", { name: "Ações para " + title }).click();
  await page.getByRole("menuitem", { name: "Editar tarefa" }).click();
  const dialog = page.getByRole("dialog");
  const executors = dialog.getByRole("group", { name: "R — Executores" });
  await executors.getByRole("checkbox", { name: "Editora teste" }).check();
  await executors.getByRole("checkbox", { name: "Executora teste" }).check();
  for (const name of ["C — Consultados", "I — Informados"]) {
    await dialog.getByRole("group", { name }).getByRole("checkbox", { name: "Executora teste" }).check();
  }
  await dialog.getByRole("button", { name: "Salvar tarefa" }).click();
  await expect(dialog).toBeHidden();
  await openTaskView(page, "Matriz RACI");
  await expect(page).toHaveURL(/\/tarefas\?tab=raci$/);
  await page.reload();
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row.getByRole("list")).toHaveCount(2);
  for (const [role, token] of [["A", "success"], ["R", "destructive"], ["C", "primary"], ["I", "amber"]]) {
    const letter = row.getByRole("listitem").filter({ hasText: new RegExp(`^${role}$`) }).first();
    await expect(letter).toBeVisible();
    const colorMatches = await letter.evaluate((element, token) => {
      const reference = document.createElement("span");
      reference.style.backgroundColor = `color-mix(in oklab, var(--${token}) 20%, transparent)`;
      document.body.append(reference);
      const expected = getComputedStyle(reference).backgroundColor;
      reference.remove();
      return getComputedStyle(element).backgroundColor === expected;
    }, token);
    expect(colorMatches, `Fundo translúcido do papel ${role}`).toBe(true);
  }
});

test("denies mutation UI to auditor and the module to a user without access", async ({ page, loginAs, context }) => {
  await loginAs("auditor");
  await page.goto("/tarefas");
  await expect(page.getByRole("heading", { name: "Tarefas", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Nova tarefa" })).toHaveCount(0);
  await context.clearCookies();
  await loginAs("denied");
  await page.goto("/tarefas");
  await expect(page).not.toHaveURL(/\/tarefas(?:[/?#]|$)/);
});

test("aligns the menu and creates a task as superadmin in the selected team", async ({ page, loginAs }, info) => {
  const team = process.env[`TASKS_TEST_${info.project.name.toUpperCase()}_ADMIN_TARGET_TEAM`]!;
  await loginAs("admin");
  await page.goto("/tarefas");
  const teamSelector = page.getByRole("combobox", { name: "Selecionar equipe" });
  await teamSelector.click();
  await page.getByRole("option", { name: team, exact: true }).click();
  await expect(teamSelector).toHaveText(team);
  await expect(page.getByRole("row").filter({ hasText: "Protótipo inicial" })).toBeVisible();

  const menu = await openTaskMenu(page);
  const tasks = menu.getByRole("button", { name: "Tarefas", exact: true });
  const finance = menu.getByRole("button", { name: "Finanças", exact: true });
  await expect(menu.getByRole("link", { name: "Lista de tarefas" })).toHaveAttribute("aria-current", "page");
  await expect(menu.getByRole("link", { name: "Caminhos de risco" })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Matriz RACI" })).toBeVisible();
  await expect(finance).toBeVisible();
  await expect.poll(async () => {
    const [taskBounds, financeBounds] = await Promise.all([tasks.boundingBox(), finance.boundingBox()]);
    return taskBounds && financeBounds ? Math.abs(taskBounds.x - financeBounds.x) : null;
  }).toBeLessThan(1);
  await menu.getByRole("link", { name: "Gantt", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Gantt", exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("tablist")).toHaveCount(0);
  await expect(page.getByRole("main").getByRole("button", { name: "Nova tarefa" })).toBeVisible();
  await createTaskThroughForm(page, "Tarefa do superadmin", "Engenharia & CAD", "2026-11-08");
  await expect(page).toHaveURL(/\/tarefas$/);
});
