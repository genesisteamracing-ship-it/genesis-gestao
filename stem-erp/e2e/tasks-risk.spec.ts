import { expect, openTaskView, test } from "./tasks.fixtures";

test("renders the saved risk path and disables its highlight when a link disappears", async ({ page, loginAs }) => {
  await loginAs("editor");
  await page.goto("/tarefas");
  await openTaskView(page, "Caminhos de risco");
  await page.getByRole("button", { name: "Novo caminho" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Nome do caminho").fill("Impacto no cronograma");
  await dialog.getByLabel("Motivo do risco").fill("Prazo do protótipo");
  for (const [label, task] of [["Tarefa de origem", /Protótipo inicial/], ["Próxima tarefa", /Usinagem de teste/], ["Próxima tarefa", /Validação de pista/]] as const) {
    await dialog.getByRole("combobox", { name: label }).click();
    await page.getByRole("option", { name: task }).click();
    await dialog.getByRole("button", { name: "Adicionar etapa" }).click();
  }
  await dialog.getByRole("button", { name: "Salvar caminho" }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("combobox", { name: "Caminho salvo" }).click();
  await page.getByRole("option", { name: "Impacto no cronograma", exact: true }).click();
  await expect(page.getByText("Prazo do protótipo")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ajustar à Tela" })).toBeVisible();
  await page.getByRole("button", { name: "Sequência textual" }).click();
  await expect(page.getByText(/Protótipo inicial.*Origem/)).toBeVisible();
  await page.getByRole("button", { name: "Destacar no Gantt" }).click();
  await expect(page.getByText("Caminho em destaque · Impacto no cronograma")).toBeVisible();
  await page.getByRole("region", { name: "Cronograma de Gantt" }).getByRole("button", { name: /Validação de pista · .*Em destaque/ }).click();
  await page.getByRole("button", { name: "Remover Usinagem de teste → Validação de pista" }).click();
  await expect(page.getByRole("button", { name: "Remover Usinagem de teste → Validação de pista" })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(page.getByText("Caminho em destaque · Impacto no cronograma")).toHaveCount(0);
  await openTaskView(page, "Caminhos de risco");
  await expect(page.getByText("Caminho incompleto", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Destacar no Gantt" })).toBeDisabled();
});
