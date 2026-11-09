import { expect, test } from "./tasks.fixtures";

test("keeps dates across scales and identifies cross-sector dependencies", async ({ page, loginAs }) => {
  await loginAs("editor");
  await page.goto("/tarefas");
  await page.getByRole("tab", { name: "Gantt", exact: true }).click();
  const chart = page.getByRole("region", { name: "Cronograma de Gantt" });
  const bar = chart.getByRole("button", { name: /Protótipo inicial · 10\/11\/2026 até 10\/11\/2026/ });
  await expect(bar).toBeVisible();
  await page.getByRole("button", { name: "Semanas" }).click();
  await expect(bar).toBeVisible();
  const times: number[] = [];
  for (let index = 0; index < 20; index++) {
    const scale = index % 2 ? "Semanas" : "Dias";
    const start = Date.now();
    await chart.getByRole("button", { name: scale, exact: true }).click();
    await expect(chart.getByRole("button", { name: scale, exact: true })).toHaveAttribute("aria-pressed", "true");
    times.push(Date.now() - start);
  }
  expect(times.filter((ms) => ms <= 2000).length).toBeGreaterThanOrEqual(19);

  await page.getByRole("combobox", { name: "Filtrar por setor" }).click();
  await page.getByRole("option", { name: "Engenharia & CAD", exact: true }).click();
  await chart.getByText("Dependências (1)", { exact: true }).click();
  await expect(chart.getByText(/Usinagem de teste.*Fora do filtro/)).toBeVisible();
  await bar.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toContainText("10/11/2026");
});
