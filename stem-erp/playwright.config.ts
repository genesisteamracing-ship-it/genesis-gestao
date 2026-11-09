import { defineConfig } from "@playwright/test";

const testDatabase = process.env.TASKS_TEST_DATABASE_URL;
const testAuthSecret = process.env.TASKS_TEST_AUTH_SECRET;
const database = testDatabase ? URL.parse(testDatabase) : null;

if (
  !testDatabase ||
  !database ||
  !["postgres:", "postgresql:"].includes(database.protocol) ||
  !["localhost", "127.0.0.1", "[::1]"].includes(database.hostname) ||
  database.pathname !== "/tasks_test" || !testAuthSecret ||
  testAuthSecret.length < 32
) {
  throw new Error("Configure TASKS_TEST_DATABASE_URL para um PostgreSQL local e TASKS_TEST_AUTH_SECRET com pelo menos 32 caracteres.");
}

const baseURL = "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/setup-tasks.ts",
  workers: 1,
  use: { baseURL, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 720 } } },
    { name: "mobile", use: { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true } },
  ],
  webServer: {
    command: "node node_modules/next/dist/bin/next dev --hostname 127.0.0.1 --port 3100",
    url: `${baseURL}/login`,
    timeout: 120_000,
    reuseExistingServer: false,
    env: {
      DATABASE_URL: testDatabase,
      DATABASE_URL_UNPOOLED: testDatabase,
      AUTH_SECRET: testAuthSecret,
    },
  },
});
