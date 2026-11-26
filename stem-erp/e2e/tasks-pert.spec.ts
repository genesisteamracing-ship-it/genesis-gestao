import { expect, openTaskView, test } from "./tasks.fixtures";

test("renders PERT network canvas, highlights critical path, and switches to table view", async ({
  page,
  loginAs,
}) => {
  await loginAs("editor");
  await page.goto("/tarefas");
  await openTaskView(page, "Rede PERT");
  await expect(page).toHaveURL(/\/tarefas\?tab=pert$/);
  await expect(page.getByRole("heading", { name: "Rede PERT", exact: true })).toBeVisible();

  await expect(page.getByText("Prazo mínimo (Te)")).toBeVisible();
  await expect(page.getByText("Caminho crítico", { exact: true })).toBeVisible();

  const highlightBtn = page.getByRole("button", { name: /Destacar caminho crítico/i });
  await highlightBtn.click();
  await expect(page.getByRole("button", { name: /Mostrando caminho crítico/i })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByRole("button", { name: "Tabela" }).click();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByText(/Mostrando \d+-\d+ de \d+ atividades/)).toBeVisible();
});

test("opens PERT view on mobile viewport without breaking layout", async ({ page, loginAs }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await loginAs("editor");
  await page.goto("/tarefas?tab=pert");
  await expect(page.getByRole("heading", { name: "Rede PERT", exact: true })).toBeVisible();
  await expect(page.getByText("Prazo mínimo (Te)")).toBeVisible();
});
