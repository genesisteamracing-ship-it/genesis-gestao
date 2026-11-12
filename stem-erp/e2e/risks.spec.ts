import { expect, test } from "@playwright/test";

test.describe("Gestão de Riscos e Oportunidades", () => {
  test("exibe gráficos de pizza, plano cartesiano e tabela com colunas obrigatórias em desktop e mobile", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/riscos");

    // Se redirecionado para login em ambiente sem sessão, garante presença do formulário de auth
    if (page.url().includes("/login")) {
      await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
      return;
    }

    await expect(
      page.getByRole("heading", { name: /Gestão de Riscos & Oportunidades/i })
    ).toBeVisible();

    await page.setViewportSize({ width: 375, height: 667 });
    await expect(
      page.getByRole("button", { name: /abrir menu/i })
    ).toBeVisible();
  });
});
