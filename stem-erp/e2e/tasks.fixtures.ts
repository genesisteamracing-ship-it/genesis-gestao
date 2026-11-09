import { expect, test as base } from "@playwright/test";

type TaskTestRole = "editor" | "auditor" | "denied";

export const test = base.extend<{
  loginAs: (role: TaskTestRole) => Promise<void>;
}>({
  loginAs: async ({ page }, provide, info) => {
    await provide(async (role) => {
      const prefix = `TASKS_TEST_${info.project.name.toUpperCase()}_${role.toUpperCase()}`;
      const email = process.env[`${prefix}_EMAIL`];
      const password = process.env[`${prefix}_PASSWORD`];

      if (!email || !password) {
        throw new Error(`Configure ${prefix}_EMAIL e ${prefix}_PASSWORD para uma conta de teste.`);
      }

      await page.goto("/login");
      await page.getByPlaceholder("E-mail de acesso").fill(email);
      await page.getByPlaceholder("Senha", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Entrar na plataforma" }).click();
      await expect(page).not.toHaveURL(/\/login(?:[/?#]|$)/);
    });
  },
});

export { expect };
