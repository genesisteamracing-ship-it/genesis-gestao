import { expect, test as base, type Page } from "@playwright/test";

type TaskTestRole = "editor" | "auditor" | "denied" | "admin";

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

export async function openTaskMenu(page: Page) {
  const drawer = page.getByRole("button", { name: "Abrir menu de navegação" });
  const mobile = test.info().project.use.isMobile === true;
  if (mobile) await drawer.click();
  const menu = mobile ? page.getByRole("dialog") : page.getByRole("complementary", { name: "Menu Lateral" });
  const group = menu.getByRole("button", { name: "Tarefas", exact: true });
  await expect(group).toBeVisible();
  if (await group.getAttribute("aria-expanded") === "false") await group.click();
  return menu;
}

export async function openTaskView(page: Page, name: string) {
  const menu = await openTaskMenu(page);
  await menu.getByRole("link", { name, exact: true }).click();
}
