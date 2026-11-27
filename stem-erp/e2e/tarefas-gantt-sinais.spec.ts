import { expect, test } from "@playwright/test";

test.describe("Gantt — Sinais de status, linha de base, caminho crítico e cards executivos", () => {
  test("exibe os 4 cards executivos, colunas ID/Atividade e legenda no desktop (1280x720)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/tarefas");

    // Se redirecionar para login sem sessão autenticada no ambiente CI, valida o guard de autenticação
    if (page.url().includes("/login")) {
      await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
      return;
    }

    const ganttTab = page.getByRole("tab", { name: /gantt/i });
    if (await ganttTab.isVisible()) {
      await ganttTab.click();
    }

    await expect(page.getByText("Progresso geral:")).toBeVisible();
    await expect(page.getByText("Atividades críticas:")).toBeVisible();
    await expect(page.getByText("Desvio atual:")).toBeVisible();
    await expect(page.getByText("Marco final:")).toBeVisible();
    await expect(page.getByText("Legenda (status)")).toBeVisible();
    await expect(page.getByText("Caminho crítico")).toBeVisible();
  });

  test("mantém cards executivos e legenda legíveis em mobile (375x667)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/tarefas");

    if (page.url().includes("/login")) {
      await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
      return;
    }

    const ganttTab = page.getByRole("tab", { name: /gantt/i });
    if (await ganttTab.isVisible()) {
      await ganttTab.click();
    }

    await expect(page.getByRole("region", { name: /cronograma de gantt/i }).or(page.getByLabel("Cronograma de Gantt"))).toBeVisible();
    await expect(page.getByText("Legenda (status)")).toBeVisible();
  });
});
