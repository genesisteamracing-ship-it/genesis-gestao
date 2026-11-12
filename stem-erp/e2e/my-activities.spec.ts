import { expect, openTaskView, test } from "./tasks.fixtures";
import { createTaskThroughForm } from "./tasks-raci.spec";

test("displays assigned activities ordered by deadline, updates status and recalculates KPIs", async ({
  page,
  loginAs,
}, info) => {
  const title = "Minha Atividade " + info.project.name;
  await loginAs("editor");
  await page.goto("/tarefas");
  await createTaskThroughForm(page, title, "Engenharia & CAD", "2026-11-12");

  await page.getByRole("button", { name: "Ações para " + title }).click();
  await page.getByRole("menuitem", { name: "Editar tarefa" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("group", { name: "R — Executores" }).getByRole("checkbox", { name: "Editora teste" }).check();
  await dialog.getByRole("button", { name: "Salvar tarefa" }).click();
  await expect(dialog).toBeHidden();

  await openTaskView(page, "Minhas atividades");
  await expect(page).toHaveURL(/\/tarefas\?tab=my-activities$/);

  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row).toBeVisible();

  await page.getByRole("combobox", { name: "Status de " + title }).click();
  await page.getByRole("option", { name: "Concluída", exact: true }).click();
  await expect(page.getByText("Status da atividade atualizado.")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("region", { name: "Indicadores de desempenho individual" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: title })).toContainText("Concluída");
});

test("renders my activities and KPIs cleanly on mobile viewport (375x667)", async ({ page, loginAs }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await loginAs("editor");
  await page.goto("/tarefas?tab=my-activities");
  await expect(page.getByRole("heading", { name: "Minhas atividades" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Indicadores de desempenho individual" })).toBeVisible();
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(hasOverflow).toBe(false);
});
